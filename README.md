# Klantdashboard PoortEijk ZZP

Online klantdashboard waarin alle collega's van PoortEijk ZZP tegelijk werken: afvinken per maand of kwartaal, BTW, controles, jaarwerk en IB. De beheerder kan daarnaast klanten toevoegen, overdragen en beëindigen, selecties maken en de in- en uitstroom bekijken.

## Hoe het in elkaar zit

- **GitHub** (deze repository): de code. Elke wijziging die hier landt, zet Netlify automatisch online.
- **Netlify**: host de website. Er is geen build-stap; Netlify publiceert de bestanden zoals ze zijn.
- **Supabase**: database, inloggen en live bijwerken. Zolang `config.js` leeg is, draait het dashboard in **demomodus** met verzonnen klanten die alleen in de eigen browser worden bewaard.

| Bestand | Wat het doet |
|---|---|
| `index.html` | De pagina met alle schermen |
| `assets/app.js` | De logica van het dashboard |
| `assets/store.js` | Opslag: demo of Supabase (inloggen, rechten, live) |
| `assets/runtime.js` | Kleine weergavemotor voor de schermen |
| `assets/app.css` | Opmaak in PoortEijk-huisstijl |
| `config.js` | Instellingen: Supabase-adres en sleutel, lopend jaar |
| `supabase/schema.sql` | Tabellen en rechten voor Supabase |
| `netlify.toml` | Beveiligingsinstellingen voor de website |

## Demo bekijken

Ook als het dashboard live staat, kun je de demo met verzonnen klanten nog openen door `?demo` achter het adres te zetten, bijvoorbeeld `https://poorteijkzzp.netlify.app/?demo`.

## Rollen

- **Beheer**: alles, inclusief klanten toevoegen, stamgegevens wijzigen, overdragen, beëindigen, selecties en export.
- **Collega**: alle klanten bekijken, afvinken en teamnotities schrijven. Stamgegevens zijn alleen-lezen.

De rechten worden afgedwongen in de database zelf (Row Level Security), niet alleen in het scherm.

## Fase 1: online zetten (demomodus)

1. Log in op Netlify met het zakelijke account.
2. **Add new project** > **Import an existing project** > **GitHub** > kies `poorteijkZZP/dashboard`.
3. Laat alle instellingen staan en klik op **Deploy**.
4. Onder **Domain management** kun je later een eigen adres koppelen, bijvoorbeeld `dashboard.poorteijkzzp.nl`.

## Fase 2: live zetten met Supabase

1. Maak op supabase.com een account en een nieuw project aan. Kies als regio **Frankfurt (eu-central-1)**. Bewaar het databasewachtwoord in je wachtwoordkluis.
2. Accepteer de verwerkersovereenkomst (DPA) van Supabase.
3. Ga naar **SQL Editor** > **New query**, plak de inhoud van `supabase/schema.sql` en klik op **Run**.
4. Ga naar **Authentication** > **Sign In / Providers** en zet **Allow new users to sign up** uit. Alleen uitgenodigde collega's kunnen dan inloggen.
5. Ga naar **Authentication** > **URL Configuration** en vul bij **Site URL** het Netlify-adres in.
6. Nodig iedereen uit via **Authentication** > **Users** > **Invite user**. Collega's krijgen een mail en kiezen zelf een wachtwoord.
7. Koppel elke gebruiker aan een naam en rol met de SQL onderaan `schema.sql`. De naam moet gelijk zijn aan de administrateursnaam in het dashboard (Jeroen, Gea, Marco, Yassir).
8. Ga naar **Project Settings** > **API** en kopieer de **Project URL** en de **anon / publishable key** naar `config.js`. Gebruik nooit de `service_role` of `secret` sleutel.
9. Na het opslaan van `config.js` in GitHub zet Netlify de nieuwe versie automatisch online. Het dashboard vraagt vanaf dan om in te loggen.

## Fase 3: klantgegevens importeren

Wordt aangeleverd als importbestanden (CSV) voor de tabellen `klanten` en `voortgang`. BSN's gaan niet mee naar de online versie.

## Afspraken

- Geen BSN's, inloggegevens of bankgegevens in dit dashboard.
- Ieder een eigen account, tweestapsverificatie aan op GitHub, Netlify en Supabase.
- Wekelijks een export naar Excel als reservekopie (Beheer > Selecties, mail en export).
