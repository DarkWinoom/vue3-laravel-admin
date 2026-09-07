import process from 'node:process';
import { existsSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { setupVitePlugins } from './build/plugins';
import { createViteProxy, getBuildTime } from './build/config';

export default defineConfig(configEnv => {
  const rootDir = fileURLToPath(new URL('../', import.meta.url));
  const envDir = existsSync(`${rootDir}/.env`) ? rootDir : process.cwd();
  const viteEnv = loadEnv(configEnv.mode, envDir) as unknown as Env.ImportMeta;

  const buildTime = getBuildTime();

  const enableProxy = configEnv.command === 'serve' && !configEnv.isPreview;

  return {
    envDir,
    base: viteEnv.VITE_BASE_URL,
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "@/styles/scss/global.scss" as *;`
        }
      }
    },
    plugins: setupVitePlugins(viteEnv, buildTime),
    define: {
      BUILD_TIME: JSON.stringify(buildTime)
    },
    server: {
      host: '127.0.0.1',
      port: Number(process.env.DEV_FRONTEND_PORT || 9527),
      open: false,
      strictPort: true,
      proxy: createViteProxy(viteEnv, enableProxy),
      watch: {
        // tell Vite to ignore watching `src-tauri`
        ignored: ['**/src-tauri/**']
      }
    },
    preview: {
      port: 9725
    },
    build: {
      reportCompressedSize: false,
      sourcemap: viteEnv.VITE_SOURCE_MAP === 'Y',
      commonjsOptions: {
        ignoreTryCatch: false
      }
    }
  };
});
