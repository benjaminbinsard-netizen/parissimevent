# ParissimEvent — Site + Dashboard

Site éditorial premium (inchangé) + formulaire de contact **réellement
fonctionnel** + dashboard privé **temps réel** + emails de confirmation.

## 🟢 En production

- **Site** : https://parissim.vercel.app
- **Dashboard** : https://parissim.vercel.app/admin
- **Base de données** : Neon Postgres (provisionnée via Vercel Marketplace,
  intégration `parissim-db`, connectée au projet sur tous les environnements).
- **Hébergement** : Vercel — projet `easy-contact-solutions-projects/parissim`.
- Le mot de passe admin **production** et `AUTH_SECRET` ont été générés
  aléatoirement et stockés chiffrés dans les variables d'environnement
  Vercel (différents de ceux du `.env` local).

Identifiants production : communiqués séparément. Pour les changer :
`vercel env rm ADMIN_PASSWORD production` puis `vercel env add ADMIN_PASSWORD production`,
et redéployer (`vercel --prod`).

## Ce qui a été construit

| Élément | Détail |
|---|---|
| **Site vitrine** | `public/site.html` — votre `index.html` d'origine, **intact au pixel près**. Servi sur `/`. |
| **Formulaire réel** | Envoie vers `POST /api/contact` → validation, anti-spam (honeypot + anti-doublon 20 s), enregistrement en base. |
| **Email client** | Confirmation HTML pro, charte bronze/ivoire de la maison. |
| **Email interne** | Copie de chaque demande vers `NOTIFY_EMAIL` (avec lien dashboard, `reply-to` = client). |
| **Dashboard** | `/admin` — protégé par mot de passe, **rafraîchi en temps réel** (toutes les 4 s), notification visuelle des nouvelles demandes. |
| **Gestion** | Filtres (Nouvelles / Traitées / Archivées), recherche, statuts, suppression. |

> L'original `index.html` est conservé à la racine comme référence. Le
> fichier **réellement servi** est `public/site.html` — modifiez celui-ci.

## Démarrage local

```bash
npm install
npx prisma generate        # client Prisma (la base Neon est déjà migrée)
npm run dev
```

- Site : http://localhost:3000
- Dashboard : http://localhost:3000/admin

**Identifiants locaux** (`.env`) : mot de passe `parissim2026`.
Les identifiants **production** sont distincts (voir section « En production »).
Le `.env` local pointe sur la **même base Neon** que la production.

## Configuration (`.env`)

Voir `.env.example` pour le détail. Variables clés :

| Variable | Rôle |
|---|---|
| `ADMIN_PASSWORD` | Mot de passe du dashboard `/admin`. |
| `AUTH_SECRET` | Signe le cookie de session (déjà généré). |
| `DATABASE_URL` | SQLite en local ; Postgres en production. |
| `SMTP_HOST/PORT/USER/PASS/SECURE` | Compte SMTP d'envoi (Gmail, OVH…). |
| `MAIL_FROM` | Expéditeur affiché. |
| `NOTIFY_EMAIL` | Adresse interne recevant chaque demande. |
| `PUBLIC_SITE_URL` | URL publique (liens dans les emails). |

### Activer l'envoi d'emails (SMTP)

Tant que `SMTP_HOST` est vide, **le formulaire fonctionne quand même** :
les demandes sont enregistrées et visibles dans le dashboard, seuls les
emails ne partent pas (un avertissement est loggué).

Exemples de remplissage :

- **OVH** : `SMTP_HOST="ssl0.ovh.net"`, `SMTP_PORT="587"`, `SMTP_SECURE="false"`, `SMTP_USER`/`SMTP_PASS` = identifiants de la boîte.
- **Gmail** : `SMTP_HOST="smtp.gmail.com"`, `SMTP_PORT="465"`, `SMTP_SECURE="true"`, `SMTP_USER` = adresse Gmail, `SMTP_PASS` = **mot de passe d'application** (pas le mot de passe du compte).

## Déploiement (déjà effectué)

Le projet est **déployé en production sur Vercel avec Neon Postgres**.
Stack figée : `prisma/schema.prisma` est en `provider = "postgresql"`
(`url` poolée + `directUrl` directe), migration `init` appliquée sur Neon.

### Redéployer après une modification

```bash
vercel --prod        # build + deploy ; le build lance automatiquement
                     # `prisma migrate deploy`
```

### Variables d'environnement (Vercel → projet `parissim`)

| Source | Variables |
|---|---|
| Intégration Neon | `DATABASE_URL` (poolée), `DATABASE_URL_UNPOOLED` (directe), `POSTGRES_*`, `PG*` — toutes environnements |
| Définies manuellement | `ADMIN_PASSWORD`, `AUTH_SECRET`, `MAIL_FROM`, `NOTIFY_EMAIL`, `PUBLIC_SITE_URL` |
| À renseigner pour activer l'email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` |

Ajouter/modifier une variable puis redéployer :

```bash
vercel env add SMTP_HOST production     # (saisir la valeur)
vercel --prod
```

### Développement local

Le `.env` local pointe désormais aussi sur Neon Postgres (mêmes données
qu'en prod). Pour repartir d'une base vide en local sans toucher la prod,
créez une autre base Neon/Postgres et changez `DATABASE_URL` dans `.env`.

### Base de données — migrations

Toute évolution du modèle :

```bash
# modifier prisma/schema.prisma puis :
npx prisma migrate dev --name <nom>   # crée + applique la migration sur Neon
vercel --prod                          # le déploiement rejoue migrate deploy
```

## SEO & indexation

| Fichier / route | Rôle |
|---|---|
| `public/robots.txt` | Autorise l'indexation du site, **bloque `/admin` et `/api/`**, déclare le sitemap. |
| `public/sitemap.xml` | Plan du site (page d'accueil, `hreflang` fr / x-default). |
| `public/favicon.svg` | Favicon monogramme bronze (toutes tailles). `/favicon.ico` y est redirigé. |
| `public/site.webmanifest` | Manifeste PWA (nom, couleurs, icône). |
| `app/og/route.tsx` | **Image Open Graph 1200×630 générée dynamiquement** (`next/og`), servie sur `/og`. Aucun binaire à gérer. |
| `<head>` de `public/site.html` | `canonical`, `robots`, Open Graph, Twitter Card, `hreflang`, **données structurées Schema.org** (`ProfessionalService` + `WebSite`). |

> Toutes les URL SEO pointent sur `https://parissim.vercel.app`. **Si vous
> branchez un domaine personnalisé** (ex. `parissim-event.fr`), remplacez
> `parissim.vercel.app` dans : `public/site.html` (canonical/OG/JSON-LD),
> `public/robots.txt`, `public/sitemap.xml`, puis redéployez. Pensez aussi
> à mettre à jour `lastmod` dans `sitemap.xml` à chaque refonte de contenu.

### Après mise en ligne — à faire côté moteurs

1. **Google Search Console** : ajoutez la propriété, soumettez
   `https://parissim.vercel.app/sitemap.xml`.
2. **Bing Webmaster Tools** : idem (import possible depuis Search Console).
3. Vérifiez l'aperçu social via les *debuggers* (Facebook Sharing Debugger,
   LinkedIn Post Inspector, validateur X) — l'image `/og` doit s'afficher.
4. Testez les données structurées : <https://search.google.com/test/rich-results>.

## Architecture

```
public/site.html        Site vitrine (servi sur "/", inchangé)
app/og                  Image Open Graph dynamique (/og, 1200×630 PNG)
app/api/contact         POST formulaire → DB + 2 emails
app/api/auth/*          Connexion / déconnexion (cookie signé)
app/api/leads[/[id]]    Lecture / statut / suppression (protégé)
app/admin               Dashboard temps réel (polling 4 s)
app/admin/login         Page de connexion
middleware.ts           Protège /admin
lib/                     db · auth · mailer · emails
prisma/schema.prisma     Modèle Lead
```

Le « temps réel » repose sur du polling (4 s) : robuste, sans
infrastructure supplémentaire, idéal pour le volume d'une maison
événementielle et 100 % compatible serverless Vercel.
