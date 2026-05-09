---
title: Storyblok CLI plus Nuxt 4, ein Projekt in einer Woche live
slug: storyblok-cli-nuxt-4-workflow
date: 2026-04-30
description: Wie ich mit der Storyblok CLI, sauberem Block-Scaffolding und einem Nuxt-4-Frontend ein komplettes Marketing-Projekt in unter einer Woche von Null auf live gebracht habe. Werkzeug, Workflow und die Stolpersteine, die wirklich Zeit kosten.
tags:
  - Storyblok
  - Nuxt 4
  - Headless
  - CLI
  - Workflow
---

Ein Kunde aus dem SaaS-Bereich brauchte eine neue Marketing-Site. Sieben Seiten, drei Sprachen, Visual Editor für das Marketing-Team, performant, deploybar auf Vercel. Zeitfenster: eine Woche. Mit dem Stack aus **Storyblok CLI** und **Nuxt 4** war das machbar, ohne Abstriche bei der Qualität. Hier ist der Ablauf.

## Tag 1: Setup und Space

Am ersten Tag passiert alles, was später Reibung erzeugen würde. Storyblok-Space anlegen, CLI installieren, Nuxt-Projekt scaffolden, Repo aufsetzen.

```bash
# Storyblok CLI global oder per npx
npm install -g storyblok
storyblok login

# Nuxt 4 Projekt
npx nuxi@latest init kundenprojekt
cd kundenprojekt
npm install @storyblok/nuxt
```

In `nuxt.config.ts` reicht ein Modul-Eintrag plus der Access-Token aus den Storyblok-Spaces:

```ts
export default defineNuxtConfig({
  modules: ["@storyblok/nuxt"],
  storyblok: {
    accessToken: process.env.STORYBLOK_TOKEN,
    apiOptions: { region: "eu" },
  },
});
```

Damit ist der API-Zugriff fertig. Das Marketing-Team kann parallel schon Storys anlegen, während ich mich um Bloks und Komponenten kümmere.

## Tag 2: Bloks per CLI bauen

Hier zeigt sich die eigentliche Stärke der CLI. Statt Bloks im Storyblok-Backend zu klicken (was ab dem dritten Block extrem ermüdet), pushe ich sie aus dem Repo:

```bash
# Komponenten-Schemas aus Storyblok ziehen
storyblok pull-components --space 12345

# Lokal editieren in components.<space>.json
# Dann zurückpushen
storyblok push-components components.12345.json --space 12345
```

Die JSON-Definition jedes Bloks liegt im Repo, versionsverwaltet, reviewbar in Pull Requests. Wenn ich einen neuen Block „Pricing-Table" brauche, kopiere ich die Struktur eines vorhandenen, passe Felder an und pushe. Drei Sekunden später ist der Block im Visual Editor verfügbar.

Für komplexe Setups nutze ich die **Migrations**, die die CLI mitbringt:

```bash
storyblok generate-migration --space 12345 \
  --component hero --field cta_label
storyblok run-migrations --space 12345 \
  --component hero --field cta_label
```

So lassen sich bestehende Inhalte beim Schema-Wechsel automatisch transformieren. Kein Redakteur muss tausend Storys nacheditieren.

## Tag 3 und 4: Komponenten in Nuxt

Für jeden Storyblok-Block existiert eine Vue-Komponente unter `components/storyblok/`. Naming-Konvention: PascalCase, exakt wie der Block-Name. Das `@storyblok/nuxt`-Modul löst das automatisch auf.

```vue
<!-- components/storyblok/Hero.vue -->
<script setup lang="ts">
defineProps<{ blok: any }>();
</script>

<template>
  <section v-editable="blok" class="hero">
    <h1>{{ blok.headline }}</h1>
    <p>{{ blok.subline }}</p>
    <NuxtLink :to="blok.cta_link.cached_url" class="btn">
      {{ blok.cta_label }}
    </NuxtLink>
  </section>
</template>
```

Das `v-editable`-Directive ist die Magie hinter dem Visual Editor: Klickt jemand im Storyblok-Frontend auf den Block, öffnet sich rechts die Bearbeitungsmaske, exakt für diesen Block. Im Code ist davon nichts zu sehen, ein einziges Directive reicht.

Pages sind in Nuxt eine einzige catch-all-Route mit `useStoryblok()` und `<StoryblokComponent>`. Ein File für alle Marketing-Seiten:

```vue
<!-- pages/[...slug].vue -->
<script setup lang="ts">
const route = useRoute();
const slug = (route.params.slug as string[])?.join("/") || "home";
const story = await useAsyncStoryblok(slug, { version: "draft" });
</script>

<template>
  <StoryblokComponent v-if="story" :blok="story.content" />
</template>
```

## Tag 5: Live-Editor und Mehrsprachigkeit

Der Visual Editor läuft lokal über `npm run dev` plus einen HTTPS-Tunnel (DDEV oder `cloudflared`). In Storyblok zeigt der Preview-URL auf den Tunnel, das Marketing-Team sieht Änderungen live, klickt einen Block an, editiert, sieht Resultat.

Mehrsprachigkeit über Storyblok-Folder-Strategien. Drei Folder (`de/`, `en/`, `fr/`), pro Sprache eine Story-Hierarchie. In Nuxt extrahiere ich das Locale-Präfix aus dem Slug und setze es als reaktive State-Variable. Kein extra i18n-Modul nötig, weil der Content selbst die Sprache trägt.

## Tag 6 und 7: Docker-Build, Mittwald, Webhook

Nuxt 4 läuft bei mir nicht als statischer Export, sondern als Node-SSR-Server im Container. Das hält die Tür offen für Preview-Modi, On-Demand-Revalidation und API-Routes, ohne den Stack zu wechseln.

Ein schlankes `Dockerfile` reicht:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production
ENV NITRO_PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

GitHub Actions baut das Image, pusht nach `ghcr.io/<org>/<projekt>:sha-<git-sha>` und triggert den Deploy bei **Mittwald**. Mittwald hostet den Container in Deutschland, die Storyblok-Region ist `eu`, der Datenfluss verlässt damit zu keinem Zeitpunkt Europa, was den DSGVO-Teil eines jeden Pitches stark vereinfacht.

Der Storyblok-Webhook stößt nach jedem Publish nicht einen Rebuild an, sondern einen Cache-Purge im Container und im vorgelagerten CDN:

```
Storyblok Story published
  → Webhook an Mittwald-Container (/api/revalidate)
    → Nitro invalidiert die betroffenen Routen
      → Nächster Request rendert neu, danach gecached
```

Time-to-Live nach einem Edit: zwei bis drei Sekunden. Für Marketing-Use-Cases ist das praktisch sofort.

## Was die Geschwindigkeit ermöglicht hat

Drei Dinge waren entscheidend:

**Erstens, die Storyblok CLI als Repo-Citizen.** Bloks im Repo zu haben, statt im Backend zu klicken, hat mir jeden Tag eine Stunde gespart und mehrere Merge-Konflikte vermieden, die sonst entstanden wären, wenn zwei Entwickler parallel Schemas geändert hätten.

**Zweitens, Nuxt 4s Auto-Imports und das Storyblok-Modul.** Keine Boilerplate für `useAsyncStoryblok`, keine manuelle Komponenten-Registrierung. Was den Namenskonventionen folgt, funktioniert einfach.

**Drittens, die klare Trennung.** Storyblok ist Content, Nuxt ist Präsentation, Mittwald ist Auslieferung. Niemand mischt sich in fremde Zuständigkeiten. Das hält die Codebase klein und die Entscheidungen einfach.

Eine Woche von der ersten Anfrage bis zur produktiven Site ist kein Sonderfall mit diesem Stack, sondern der erwartbare Normalfall, sobald die Setup-Routine sitzt. Und genau das ist für mich der eigentliche Wert von Storyblok plus Nuxt: nicht die einzelne Feature-Liste, sondern die Vorhersagbarkeit des Workflows.
