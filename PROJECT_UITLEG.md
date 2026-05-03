# Project Uitleg Transportplanner

Dit bestand is bedoeld als rustige uitleg van waar dit project nu staat en hoe ermee verder gewerkt kan worden op een andere computer.

De voorkeur voor dit project is:

- zoveel mogelijk werken met `Codex/ChatGPT`
- zo min mogelijk handmatig werken in de terminal

## Doel van het project

We maken een webbased app:

- in `React`
- gestart met `Vite`
- code in `VS Code`
- database later via `Supabase`
- hosting later via `Vercel`
- code opgeslagen op `GitHub`

## Wat is al gedaan

De volgende basis is al opgezet:

1. Er is een `Vite + React` project gemaakt.
2. De oorspronkelijke voorbeeldcode is omgezet naar:
   - `src/App.jsx`
3. De speciale opslag `window.storage` is vervangen door standaard browseropslag:
   - `localStorage`
4. Het project kan lokaal gebouwd worden met:
   - `npm run build`
5. `Git` is lokaal ingesteld.
6. De code staat op GitHub in deze repository:
   - `https://github.com/RobMaas01/Transportplanner`
7. Er is een basisvoorbereiding gedaan voor later gebruik van `Supabase` en `Vercel`.

## Belangrijkste bestanden

- `src/App.jsx`
  Hier staat nu de hoofdapp.

- `src/main.jsx`
  Startpunt van de React-app.

- `package.json`
  Bevat de projectinstellingen en npm scripts.

- `.env.example`
  Voorbeeld van variabelen die later nodig zijn voor Supabase.

- `vercel.json`
  Kleine basisconfiguratie voor Vercel.

## Huidige status van de app

De app is nog een eerste basisversie.

Wat werkt al:

- inlogscherm
- planningsoverzicht
- taken toevoegen
- weken blokkeren
- rapportage
- gegevens bewaren in `localStorage`

Wat nog later moet gebeuren:

- app verder verbeteren
- schermen mooier maken
- echte database via Supabase koppelen
- online zetten via Vercel

## Waarom `localStorage` is gebruikt

In het originele voorbeeldbestand stond:

- `window.storage.get(...)`
- `window.storage.set(...)`

Dat is geen standaard browserfunctie in een gewone Vite-app.

Daarom is dit vervangen door:

- `localStorage.getItem(...)`
- `localStorage.setItem(...)`

Dat is goed genoeg voor een eerste lokale versie.

Later kan dit vervangen worden door Supabase.

## GitHub status

De lokale git-repository is al gemaakt.

De code is gepusht naar:

- `https://github.com/RobMaas01/Transportplanner`

De branch is:

- `main`

## Vercel status

Vercel is nog niet gekoppeld.

Dat moet later nog gebeuren via de Vercel website door de GitHub-repository te importeren.

De instellingen die waarschijnlijk gebruikt moeten worden:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## Supabase status

Supabase is nog niet gekoppeld.

Er is alleen alvast een voorbeeldbestand gemaakt:

- `.env.example`

Daarin staan later deze variabelen:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Werken op een andere computer

Als je dochter op een andere computer verder wil werken, dan is dit de rustige volgorde:

1. Installeer:
   - `VS Code`
   - `Node.js`
   - `Git`

### Hoe installeer je dat op Windows

#### VS Code

1. Ga naar:
   - `https://code.visualstudio.com/download`
2. Kies bij Windows:
   - `User Installer x64`
3. Open het gedownloade bestand.
4. Klik steeds op:
   - `Next`
   - `I accept`
   - `Install`
5. Start daarna `VS Code`.

#### Node.js

1. Ga naar:
   - `https://nodejs.org/en/download`
2. Kies de `LTS` versie.
3. Download de Windows installer.
4. Open het installatiebestand.
5. Klik steeds op:
   - `Next`
   - `Install`
6. Laat `npm` gewoon mee installeren.
7. Open daarna `VS Code`.
8. Open onderin een opdrachtvenster via:
   - `Terminal`
   - `New Terminal`
9. Dat venster heet de terminal.
   Daar kun je commando's typen.
10. Controleer daarna:

```bash
node -v
npm -v
```

Als je versienummers ziet, is Node.js goed geïnstalleerd.

Voor de eerste fase zijn deze onderdelen genoeg:

- `VS Code`
- `Node.js`
- `Git`

### Codex gebruiken met ChatGPT

Codex is een programmeerhulp van OpenAI.

Je kunt Codex gebruiken:

- in de terminal
- in een editor zoals `VS Code`
- via de Codex app of webomgeving

Volgens de OpenAI Help Center uitleg over Codex met ChatGPT kan Codex worden gebruikt door in te loggen met een ChatGPT-account. OpenAI noemt daar ook dat Codex beschikbaar is binnen ondersteunde ChatGPT-abonnementen. Dit kan later veranderen, dus controleer altijd de officiële pagina.

#### Officiële links

- `https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan`
- `https://help.openai.com/en/articles/11096431`
- `https://openai.com/codex/get-started/`

#### Eenvoudige manier om Codex te gebruiken

1. Zorg dat `Node.js` al geïnstalleerd is.
2. Open een terminal.
3. Installeer Codex:

```bash
npm install -g @openai/codex
```

4. Start daarna:

```bash
codex
```

5. Volg de inlogstappen in Codex.
6. Log in met het `ChatGPT` account.

#### Wat daarna meestal gebeurt

Na het starten van `codex`:

- kies je een map of project
- geef je een opdracht in gewone taal
- Codex helpt dan met code, bestanden en commando's

#### Voorkeur voor dit project

Voor dit project is het handigst om Codex dingen te laten doen zoals:

- het project ophalen van GitHub
- de juiste map openen
- afhankelijkheden installeren
- de app starten
- uitleg geven in gewone taal

Voorbeelden van opdrachten:

- `haal dit project op van GitHub`
- `open deze projectmap`
- `start de app`
- `leg uit wat je doet`
- `help me stap voor stap`

#### Belangrijk bij Codex

- `Node.js` moet eerst geïnstalleerd zijn
- soms moet de terminal opnieuw geopend worden na installatie
- op een andere computer moet Codex opnieuw geïnstalleerd worden
- als `codex` niet herkend wordt, sluit de terminal en open hem opnieuw

#### Voor dit project

Codex is niet verplicht om het project te draaien.

De app kan ook zonder Codex worden gebruikt met alleen:

- `VS Code`
- `Node.js`
- `Git`
- `npm run dev`

2. Haal de code op van GitHub.

Bij voorkeur laat je dit door `Codex/ChatGPT` doen.

3. Ga in de map staan:

Ook dit kan Codex meestal voor je doen.

4. Installeer de npm-pakketten:

Laat dit bij voorkeur door Codex uitvoeren.

5. Start de app lokaal:

Ook dit kan Codex voor je starten.

6. Open daarna in de browser meestal:

```bash
http://localhost:5173
```

## Lokaal werken zonder Docker

Gebruik:

```bash
npm install
npm run dev
```

## Logische volgende stappen

De verstandigste volgorde voor later is:

1. Eerst lokaal openen op de andere computer.
2. Controleren of `npm run dev` goed werkt.
3. Pas daarna verder bouwen aan de app zelf.
4. Daarna Supabase koppelen.
5. Daarna Vercel koppelen.

## Korte samenvatting

De basis van het project staat.

Wat nu klaar is:

- Vite
- React
- App.jsx
- localStorage
- Git
- GitHub
- Vercel voorbereiding
- Supabase voorbereiding

Wat nog niet klaar is:

- verdere ontwikkeling van de app
- echte database
- echte online deployment
