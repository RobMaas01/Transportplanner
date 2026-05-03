# Transportplanner

Webapp gebouwd met Vite en React.

## Lokaal starten

### Zonder Docker

```bash
npm install
npm run dev
```

### Met Docker

```bash
docker compose up --build
```

Daarna draait de app op `http://localhost:5173`.

## Belangrijke bestanden

- `src/App.jsx` - de app zelf
- `Dockerfile` - Docker image
- `docker-compose.yml` - lokaal draaien met Docker
- `.env.example` - voorbeeld voor Supabase variabelen

## GitHub

Als volgende stap kun je een lege repository maken op GitHub en daarna:

```bash
git add .
git commit -m "Eerste versie transportplanner"
git branch -M main
git remote add origin JOUW_GITHUB_URL
git push -u origin main
```

## Vercel

Koppel later de GitHub repository aan Vercel.

Instellingen:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

## Supabase

Gebruik later een `.env` bestand op basis van `.env.example`.

Benodigde variabelen:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
