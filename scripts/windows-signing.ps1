param([switch]$Cleanup)
$ErrorActionPreference = 'Stop'
if ($Cleanup) {
  if ($env:DESKTOP_IMPORTED_CERTIFICATE -and $env:DESKTOP_WINDOWS_CERT_THUMBPRINT) {
    Remove-Item -LiteralPath ("Cert:\CurrentUser\My\" + $env:DESKTOP_WINDOWS_CERT_THUMBPRINT) -Force
  }
  exit 0
}
if (-not $env:WINDOWS_CERTIFICATE) { Write-Output 'Windows system signing is not configured.'; exit 0 }
if (-not $env:WINDOWS_CERTIFICATE_PASSWORD -or -not $env:WINDOWS_TIMESTAMP_URL) {
  throw 'Windows certificate password and timestamp URL are required when enabling system signing.'
}
if (-not $env:RUNNER_TEMP -or -not $env:GITHUB_ENV) { throw 'Certificate import is limited to GitHub runners.' }
$certificateFile = Join-Path $env:RUNNER_TEMP ('admin-signing-' + [guid]::NewGuid().ToString() + '.pfx')
try {
  [IO.File]::WriteAllBytes($certificateFile, [Convert]::FromBase64String($env:WINDOWS_CERTIFICATE))
  $certificatePassword = ConvertTo-SecureString $env:WINDOWS_CERTIFICATE_PASSWORD -AsPlainText -Force
  $certificate = Import-PfxCertificate -FilePath $certificateFile -CertStoreLocation Cert:\CurrentUser\My -Password $certificatePassword
  $thumbprint = ($certificate | Where-Object HasPrivateKey | Select-Object -First 1).Thumbprint
  if (-not $thumbprint) { throw 'Imported certificate has no signing private key.' }
  Add-Content -LiteralPath $env:GITHUB_ENV -Value ("DESKTOP_WINDOWS_CERT_THUMBPRINT=" + $thumbprint)
  Add-Content -LiteralPath $env:GITHUB_ENV -Value 'DESKTOP_IMPORTED_CERTIFICATE=Y'
  Add-Content -LiteralPath $env:GITHUB_ENV -Value ("DESKTOP_WINDOWS_TIMESTAMP_URL=" + $env:WINDOWS_TIMESTAMP_URL)
} finally {
  if (Test-Path -LiteralPath $certificateFile) { Remove-Item -LiteralPath $certificateFile -Force }
}
