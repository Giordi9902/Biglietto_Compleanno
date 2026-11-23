import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // percorsi relativi: il sito funziona anche dentro una sottocartella (es. GitHub Pages)
  base: './',
});
