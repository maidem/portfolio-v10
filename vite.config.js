import { defineConfig } from 'vite';
import typo3 from 'vite-plugin-typo3';

export default defineConfig({
    plugins: [
        typo3()
    ],
    build: {
        manifest: true,
        outDir: 'public/_assets/vite',
        rollupOptions: {
            // Die Entrypoints werden automatisch über die ViteEntrypoints.json gefunden
        }
    },
    server: {
        // DDEV-spezifische Einstellungen falls nötig
        origin: '__VITE_FETCH_ADDR__'
    }
});
