import { defineConfig } from "vite";
import typo3, { getDefaultAllowedOrigins } from "vite-plugin-typo3";

export default defineConfig({
  plugins: [typo3()],
  server: {
    cors: {
      origin: getDefaultAllowedOrigins(),
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: [
        "packages/my_sitepackage/Resources/Private/JavaScript/Main.entry.js",
        "packages/my_sitepackage/Resources/Private/Frontend/Form.entry.scss",
        "packages/maidem_pdfexport/Resources/Private/Scss/PdfExport.scss",
      ],
    },
  },
});
