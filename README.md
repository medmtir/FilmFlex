# 🎬 FilmFlex - Plateforme de Streaming Ultra-HD (Netflix Clone)

FilmFlex est une application de streaming complète, ultra-rapide et sécurisée conçue avec **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS**, et préparée pour une connexion directe avec **Supabase** et **Vercel Free Tier**.

---

## ✨ Fonctionnalités Implémentées

### 1. 🛡️ Sécurité & Vulnérabilités (0 Vulnerability & Next.js Hardened)
- Dépendances auditées : **0 vulnérabilités**.
- En-têtes HTTP de sécurité stricts configurés dans `next.config.ts` :
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options: SAMEORIGIN` (Anti-Clickjacking)
  - `X-Content-Type-Options: nosniff` (Anti-MIME Sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - Masquage des en-têtes du serveur (`poweredByHeader: false`)
- Endpoint API `/api/stream/[id]` avec assainissement d'entrées (anti-SSRF et Path Traversal) et vérification d'abonnement VIP.

### 2. 👥 Système de Profils (Max 2 Profils + Code PIN Optionnel)
- Conformément à votre demande, le compte est limité à **2 profils maximum**.
- Chaque profil dispose de :
  - Son propre nom et avatar personnalisé.
  - Un **Code PIN de 4 chiffres** optionnel pour verrouiller l'accès.
  - Son propre historique de visionnage et sa propre liste (**My List**).
  - Mode "Manage Profiles" pour modifier le nom et le code secret.

### 3. ⏯️ Reprise Automatique de Lecture (Continue Watching)
- Sauvegarde automatique de la progression toutes les 4 secondes dans le stockage du profil actif.
- Affichage de la barre de progression rouge sous les miniatures des films commencés.
- Dès que vous lancez un film, notification et reprise directe à la minute exacte où vous vous étiez arrêté.

### 4. 🎥 Introduction Personnalisée FilmFlex ("Ta-Dum" Bumper)
- Chaque film commence automatiquement par l'animation officielle de marque **FilmFlex** avec l'ambiance sonore cinématographique et l'effet de zoom du logo.
- Bouton interactif pour passer l'intro si souhaité.

### 5. 🌍 Multi-Audio & Sous-titres (Traduction Complète)
- Sélecteur de sous-titres en temps réel dans le player :
  - العربية (Arabic)
  - Français (French)
  - English [CC]
- Sélecteur de pistes audio (Version originale, doublage français, etc.).
- Contrôle de la vitesse de lecture (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x).
- Avance / retour rapide de 10 secondes.

### 6. 🍿 Expérience Complète Style Netflix
- **Hero Billboard** géant avec bande-annonce en fond, synopsis, badges 4K HDR, et bouton d'activation/désactivation du son.
- **Top 10 du jour** avec grands numéros stylisés (1 à 10).
- Carrousels par catégories : Trending, Blockbusters d'Action, Sci-Fi, Drames acclamés, Continue Watching.
- Cartes interactives au survol avec aperçu animé et boutons d'action rapide.
- Modal de détails complet avec lecteur de bande-annonce YouTube officiel intégré et recommandations "More Like This".

### 7. 💳 Paywall & Système d'Abonnement
- Modal d'abonnement avec formules mensuelle (15 DT) et annuelle (-35%).
- Système de rachat de **Code Recharge / Coupon VIP** (Codes de test inclus : `FILMFLEX`, `VIP2026`, `PREMIUM`, `TUNISIA`).

---

## 🚀 Lancement & Utilisation

Le serveur de développement est actuellement lancé et accessible sur votre machine :
👉 **http://localhost:3000**

Pour relancer le projet à tout moment dans le dossier `c:\Users\medmt\OneDrive\Bureau\FilmFlex` :
```bash
npm run dev
```

Pour créer le build de production optimisé :
```bash
npm run build
npm start
```
