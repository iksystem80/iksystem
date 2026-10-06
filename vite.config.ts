import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import fs from 'fs';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import Inspect from 'vite-plugin-inspect';

import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

import svgSpritePlugin from '@pivanov/vite-plugin-svg-sprite';

export default defineConfig(({ command, mode }) => {
  console.log('vite.config defineConfig', command, mode);

  const env = loadEnv(mode, process.cwd(), '');
  const useHttps = env.VITE_USE_HTTPS === 'true';

  console.log(`Vite development server: ${useHttps ? 'HTTPS' : 'HTTP'}`);

  const optimizeDepsElementPlusIncludes = ['element-plus/es'];

  fs.readdirSync('node_modules/element-plus/es/components').forEach((dirname) => {
    fs.access(
      `node_modules/element-plus/es/components/${dirname}/style/css.mjs`,
      (err) => {
        if (!err) {
          optimizeDepsElementPlusIncludes.push(
            `element-plus/es/components/${dirname}/style/css`
          );
        }
      }
    );
  });

  return {
    base: '/',

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },

    optimizeDeps: {
      include: optimizeDepsElementPlusIncludes
    },

    plugins: [
      vue(),

      Inspect(),

      AutoImport({
        resolvers: [ElementPlusResolver()]
      }),

      Components({
        resolvers: [ElementPlusResolver()]
      }),

      svgSpritePlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
        symbolId: 'icon-[name]',
        inject: 'body-last'
      })
    ],

    server: {
      watch: {
        usePolling: true,
        ignored: ['**/node_modules/**', '**/dist/**']
      },

      host: '0.0.0.0',
      port: 5173,

      ...(useHttps
        ? {
          https: {
            key: fs.readFileSync('./certs/localhost-key.pem'),
            cert: fs.readFileSync('./certs/localhost.pem')
          }
        }
        : {})
    }
  };
});
