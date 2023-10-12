import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: 'RowColMi',
  plugins: [react(), viteSingleFile()],
  build: { minify: 'terser', terserOptions: { format: { comments: false } } }
});
