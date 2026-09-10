import { writeFileSync } from 'node:fs';
import { initializeSettings, synchronizeNative } from './project-init.mjs';
import { repositoryContext } from './repository.mjs';
import { appSettings } from './desktop-config.mjs';

// Only the disposable Actions checkout may replace its app config for acceptance.
if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Portable acceptance fixture runs only in Actions');
const { version } = appSettings();
const settings = initializeSettings({}, repositoryContext(), { name: 'Portable Admin Acceptance' });
await synchronizeNative(settings, version);
writeFileSync('desktop.json', JSON.stringify(settings, null, 2) + '\n');
console.log('Testing derived basic-release application ' + settings.identifier + ' with binary ' + settings.binaryName);
