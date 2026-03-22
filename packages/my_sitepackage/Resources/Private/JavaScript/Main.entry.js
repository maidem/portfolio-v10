console.log('Main JS loaded');

// Google Font 'Inter' locally hosted via @fontsource
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

import '../Styles/Main.entry.scss';

// Vite Collector "Glob-Module" (Best Practice nach Simon Praetorius)
// Alle frontend.{js,scss,css} Dateien aus den Content-Blöcken automatisch laden
import.meta.glob('../../../ContentBlocks/ContentElements/*/assets/frontend.{js,scss,css}', { eager: true });
