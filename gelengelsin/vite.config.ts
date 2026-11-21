import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Tek dosyalık derleme: dist/index.html sunucusuz açılabilir (hash yönlendirme).
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
});
