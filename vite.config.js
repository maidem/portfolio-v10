import { defineConfig } from 'vite';
import typo3 from 'vite-plugin-typo3';

export default defineConfig({
    plugins: [
        typo3()
    ],
    build: {
        manifest: true,
        rollupOptions: {
            input: [
                'packages/my_sitepackage/Resources/Private/JavaScript/Main.entry.js',
                'packages/my_sitepackage/Resources/Private/Frontend/Form.entry.scss'
            ]
        }
    }
});
