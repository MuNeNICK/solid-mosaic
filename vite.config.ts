import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  root: 'demo',
  base: process.env.GITHUB_PAGES ? '/solid-mosaic/' : '/',
  build: {
    target: 'esnext',
  },
});
