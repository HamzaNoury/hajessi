# HAJESSI — Guide de configuration

Boutique de parfums de luxe **HAJESSI** — Next.js 16 + Tailwind CSS 4.

## Démarrage rapide

```bash
npm install
cp .env.example .env.local
npm run dev
```

Site public : http://localhost:3000  
Admin : http://localhost:3000/admin/login

## Variables d'environnement (.env.local)

| Variable | Description |
|----------|-------------|
| `ADMIN_PASSWORD` | Mot de passe unique pour le dashboard admin |
| `GOOGLE_SHEET_WEBAPP_URL` | URL de déploiement Google Apps Script |
| `NEXT_PUBLIC_FB_PIXEL_ID` | ID Facebook Pixel |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ID Google Analytics 4 (G-XXXXXXXXXX) |

## Mot de passe admin

1. Définissez `ADMIN_PASSWORD` dans `.env.local`
2. Redémarrez le serveur (`npm run dev`)
3. Connectez-vous sur `/admin/login`

## Google Sheets

1. Créez une Google Sheet avec les colonnes :
   `Date | Nom client | Téléphone | Ville | Adresse | Produit | Quantité | Prix unitaire | Total | Statut`
2. Ouvrez **Extensions → Apps Script**
3. Collez le code de `docs/google-apps-script.js`
4. **Déployer → Nouvelle déploiement → Application Web**
   - Exécuter en tant que : Moi
   - Qui a accès : Tout le monde
5. Copiez l'URL dans `GOOGLE_SHEET_WEBAPP_URL`

## Tracking pixels

Remplacez les placeholders dans `.env.local` :
- `NEXT_PUBLIC_FB_PIXEL_ID` — depuis Meta Business Suite
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — depuis Google Analytics 4

Événements trackés : PageView, ViewContent (page produit), Purchase (commande confirmée).

## Logo

Remplacez le placeholder dans `src/components/Logo.tsx` par votre vrai logo (image ou SVG).

## Déploiement (Vercel)

1. Poussez le repo sur GitHub
2. Importez sur [vercel.com](https://vercel.com)
3. Ajoutez les variables d'environnement
4. Déployez

**Note :** Les produits sont stockés dans `data/products.json`. Sur Vercel, le filesystem est éphémère — pour la production, migrez vers une base de données ou Google Sheets pour les produits aussi.
