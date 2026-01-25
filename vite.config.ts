import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // For GitHub Pages deployment, set base to repo name
  // When GITHUB_REPOSITORY is set (in CI), extract repo name for base path
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
