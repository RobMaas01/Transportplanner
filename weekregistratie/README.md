# Boekenbode Weekregistratie

Deze mini-app is bedoeld voor de aangepaste werkwijze:

- aanvragen blijven via papier of directe communicatie binnenkomen;
- Bert of administratie voert achteraf per week of dag in wat er is gedaan;
- de organisatie krijgt alsnog overzicht en rapportage.

## Starten

Vanuit de hoofdmap `Transportplanner`:

```bash
npm.cmd --prefix weekregistratie run dev
```

Open daarna de link die Vite toont, meestal:

```text
http://127.0.0.1:5180/
```

Als poort `5180` bezet is, kiest Vite automatisch bijvoorbeeld `5181`.

## Opslag

De app gebruikt centrale opslag via Supabase als de `.env` in de hoofdmap goed staat ingesteld.

- Centrale tabel: `weekregistratie_state`
- Lokale backup: `localStorage`

Als Supabase niet bereikbaar is, blijft de app lokaal bruikbaar.

## Bestanden

- `index.html`: startbestand voor Vite en Vercel. Deze naam bewust niet wijzigen.
- `weekregistratie.js`: gedrag, opslag, formulierlogica en rapportage.
- `gegevens.js`: vaste lijsten, taaknamen, opslagnaam en taakregels.
- `stijl.css`: vormgeving.
- `package.json`: technische projectinstellingen voor npm/Vercel. Deze naam bewust niet wijzigen.
- `vite.config.js`: zorgt dat deze app de `.env` uit de hoofdmap kan lezen.

## Wat zit erin?

- voorpagina met `Registreren` en `Rapportage`;
- bij registratie week of dag kiezen;
- taak toevoegen, wijzigen en verwijderen;
- archief van vorige logins;
- centrale opslag via Supabase;
- rapportage per week, maand of jaar;
- export naar Excel.

## Taakregels

- Plukker: geen `Van`; `Naar` staat standaard op Bibliotheek School 7 en mag gewijzigd worden.
- Eelan: `Van` wordt automatisch Eelan; alleen `Naar` is zichtbaar en staat standaard op Bibliotheek School 7. Aantal is optioneel.
- Meubel verplaatsen: `Van` en `Naar` zijn optioneel; geen aantal.
- Extra sorteerwerk: alleen `Bij vestiging`, aantal en tijd in minuten.
- Extra kratten ophalen: alleen `Bij vestiging`, aantal verplicht en tijd optioneel.
- CoderDojo: aantal kratten staat automatisch op 15.
- Stort: alleen `Van vestiging` is verplicht; geen aantal en geen `Naar`.
- Garage: reden, tijd in minuten en opmerking.
- Rapportage telt hoe vaak een taak voorkomt; niet het ingevulde aantal.

## Later uitbreiden

Als deze vorm goed werkt, kan de weekregistratie gekoppeld worden aan de Transportplanner. Dan kunnen registraties als afgeronde taken worden doorgestuurd.
