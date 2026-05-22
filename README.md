# AI Frame Generation

Ce projet est une application de génération de cadres (frames) par IA, construite avec Next.js, Supabase et Fabric.js.

## Démarrage rapide

### 1. Installation des dépendances

Assurez-vous d'avoir Node.js installé, puis utilisez `pnpm` :

```bash
pnpm install
```

### 2. Configuration de l'environnement

Créez un fichier `.env.local` à la racine du projet et remplissez les variables suivantes :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase

# NextAuth
AUTH_SECRET=votre_secret_nextauth # Générez un secret avec: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Google Auth (Optionnel pour le développement local)
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret
```

### 3. Lancement du serveur de développement

```bash
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir le résultat.

## Structure du projet

- `app/` : Routes et pages Next.js (App Router).
- `components/` : Composants UI réutilisables.
- `lib/` : Utilitaires, configuration Supabase et Auth.
- `hooks/` : Hooks React personnalisés.
- `public/` : Assets statiques.
