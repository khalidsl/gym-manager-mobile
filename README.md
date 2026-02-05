# 🏋️ Gym Manager Mobile

Application mobile React Native + Expo + TypeScript pour la gestion d'une salle de sport/fitness.

## ✨ Fonctionnalités

- 🔐 Authentification (inscription/connexion)
- 📱 QR Code personnel pour chaque membre
- ✅ Validation d'accès par QR Code (entrée/sortie)
- 💪 Gestion des machines
- ⏱️ Suivi des sessions d'entraînement
- 📊 Tableau de bord avec statistiques
- 👤 Profil utilisateur
- 📅 Système de réservation
- 🔒 Row Level Security (RLS) avec Supabase

## 🛠️ Technologies

- **React Native** - Framework mobile
- **Expo** ~54.0.33 - Build et développement
- **TypeScript** ~5.9.2 - Typage statique
- **Supabase** ^2.39.0 - Backend (Auth + Database)
- **Zustand** v4.4.7 - Gestion d'état
- **React Navigation** v7 - Navigation
- **expo-camera** - Scanner QR Code
- **react-native-qrcode-svg** - Génération QR Code

## 📁 Structure du projet

```
gym-manager-mobile/
├── components/          # Composants réutilisables (Button, Card, Input)
├── constants/          # Constantes (Colors, etc.)
├── screens/            # Écrans de l'application
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── MachinesScreen.tsx
│   ├── ScannerScreen.tsx
│   ├── ScheduleScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # Services API
│   ├── supabase.ts    # Configuration Supabase
│   ├── auth.ts        # Authentification
│   ├── machines.ts    # Gestion des machines
│   └── access.ts      # Contrôle d'accès
├── store/             # Zustand stores
│   ├── authStore.ts
│   ├── machinesStore.ts
│   └── accessStore.ts
├── types/             # Définitions TypeScript
│   └── index.ts       # Types Database Supabase
├── App.tsx            # Point d'entrée avec navigation
├── supabase-schema.sql # Schéma de base de données
└── .env               # Variables d'environnement
```

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd gym-manager-mobile
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **Settings > API**
3. Copiez votre **Project URL** et **Anon Key**
4. Créez un fichier `.env` à la racine :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

### 4. Créer la base de données

Exécutez le fichier `supabase-schema.sql` dans l'éditeur SQL de Supabase :

1. Allez dans **SQL Editor**
2. Copiez-collez le contenu de `supabase-schema.sql`
3. Cliquez sur **Run**

Le schéma créé inclut :
- ✅ Tables (profiles, memberships, machines, sessions, etc.)
- ✅ Row Level Security (RLS)
- ✅ Policies pour sécuriser les données
- ✅ Fonctions automatiques (QR codes, timestamps)

## 🎯 Lancer l'application

### Mode développement

```bash
npm start
```

Ensuite :
- Scannez le QR code avec **Expo Go** sur votre téléphone
- Ou appuyez sur `a` pour Android emulator
- Ou appuyez sur `i` pour iOS simulator

### Build de production

```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## 📱 Utilisation

### 1. Inscription

1. Lancez l'application
2. Cliquez sur **S'inscrire**
3. Remplissez vos informations
4. Un QR code personnel est automatiquement généré

### 2. Accès à la salle

1. Scannez votre QR code à l'entrée
2. Le système valide :
   - ✅ QR code valide
   - ✅ Abonnement actif
   - ✅ Permissions horaires
3. Votre entrée est enregistrée

### 3. Session d'entraînement

1. Scannez le QR code d'une machine
2. Démarrez votre session
3. L'application suit :
   - ⏱️ Durée
   - 💪 Séries/Répétitions
   - ⚖️ Poids utilisés
4. Terminez la session quand vous avez fini

### 4. Dashboard

- 📊 Nombre de visiteurs actuels
- ✅ Statut de votre session active
- 📈 Statistiques personnelles
- 🏋️ Machines disponibles

## 🔒 Sécurité

L'application utilise **Row Level Security (RLS)** de Supabase :

- Les utilisateurs ne peuvent voir/modifier que leurs propres données
- Les logs d'accès sont sécurisés
- Les sessions sont validées côté serveur
- Les QR codes sont uniques et cryptographiquement sûrs

## 🧩 Stores Zustand

### authStore
- `signIn()` - Connexion
- `signUp()` - Inscription
- `signOut()` - Déconnexion
- `profile` - Profil utilisateur
- `membership` - Abonnement actif

### machinesStore
- `fetchMachines()` - Liste des machines
- `startSession()` - Démarrer une session
- `endSession()` - Terminer une session
- `activeSession` - Session en cours

### accessStore
- `validateAndLogEntry()` - Enregistrer une entrée
- `validateAndLogExit()` - Enregistrer une sortie
- `currentVisitors` - Visiteurs présents
- `isInGym` - Utilisateur dans la salle

## 📝 Types TypeScript

Tous les types sont générés depuis le schéma Supabase dans `types/index.ts` :

```typescript
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type Machine = Database['public']['Tables']['machines']['Row']
// ... etc
```

## 🎨 Personnalisation

### Couleurs

Modifiez `constants/Colors.ts` :

```typescript
export const Colors = {
  primary: '#6366F1',    // Indigo
  secondary: '#8B5CF6',  // Violet
  // ...
}
```

### Composants

Les composants dans `components/` sont réutilisables :
- `<Button>` - Bouton personnalisé
- `<Card>` - Carte avec ombre
- `<Input>` - Champ de saisie

## 🐛 Résolution de problèmes

### Erreurs TypeScript

Les erreurs TypeScript concernant les types `never` de Supabase peuvent apparaître mais n'empêchent pas l'exécution de l'application. Le typage générique de Supabase avec React Native peut parfois créer des conflits de types.

### Erreurs de build

```bash
# Nettoyer le cache
npx expo start -c

# Réinstaller les dépendances
rm -rf node_modules
npm install
```

### Problèmes de QR Code

- Vérifiez les permissions caméra
- Sur iOS : Info.plist doit inclure `NSCameraUsageDescription`
- Sur Android : Permissions dans app.json

## 📦 Scripts disponibles

```bash
npm start          # Démarre Expo
npm run android    # Lance sur Android
npm run ios        # Lance sur iOS
npm run web        # Lance sur web (limité)
```

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout de...'`)
4. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

MIT

## 👥 Support

Pour toute question, ouvrez une issue sur GitHub.

---

Créé avec ❤️ pour les salles de sport modernes
