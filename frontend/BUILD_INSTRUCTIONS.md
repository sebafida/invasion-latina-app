# 🚀 Invasion Latina - Instructions de Build iOS

## Prérequis

- macOS avec Xcode installé
- Node.js 18+ 
- Un compte Expo (gratuit) : https://expo.dev
- Votre compte Apple Developer (déjà configuré ✅)

---

## 📦 Étape 1 : Installation

Ouvrez le Terminal et exécutez :

```bash
# Installer EAS CLI globalement
npm install -g eas-cli

# Se connecter à Expo
eas login
```

---

## 📂 Étape 2 : Préparer le projet

```bash
# Naviguer vers le dossier frontend
cd frontend

# Installer les dépendances
npm install
```

---

## 🔨 Étape 3 : Lancer le Build iOS

```bash
# Build pour TestFlight (distribution interne)
eas build --platform ios --profile preview
```

**Pendant le build, EAS vous demandera :**
1. Votre Apple ID (email Apple Developer)
2. Votre mot de passe Apple
3. Code de vérification 2FA

Le build prend environ **15-20 minutes**.

---

## 📤 Étape 4 : Soumettre sur TestFlight

Une fois le build terminé :

```bash
eas submit --platform ios
```

Ou téléchargez le fichier .ipa depuis le dashboard Expo et uploadez-le manuellement via Transporter (app Mac).

---

## 📱 Étape 5 : Configurer TestFlight

1. Allez sur https://appstoreconnect.apple.com
2. **Apps** → **Invasion Latina** (ou créez l'app si pas encore fait)
3. **TestFlight** → Votre build apparaîtra
4. Ajoutez des testeurs (email) 
5. Ils recevront une invitation par email

---

## 🔧 Configuration de l'app dans App Store Connect

Si l'app n'existe pas encore :

1. **Apps** → **+** → **Nouvelle app**
2. Plateforme : **iOS**
3. Nom : **Invasion Latina**
4. Langue principale : **Français**
5. Bundle ID : **com.invasionlatina.app**
6. SKU : **invasionlatina001**

---

## ⚙️ Informations techniques

- **Bundle ID** : com.invasionlatina.app
- **Team ID** : C3V222SFFY
- **Version** : 1.0.0
- **Build Number** : 1

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes, les erreurs courantes sont :

1. **"No provisioning profile"** → EAS le créera automatiquement
2. **"Bundle ID already exists"** → Utilisez le même dans App Store Connect
3. **"Authentication failed"** → Vérifiez votre Apple ID et 2FA

---

## 👤 Comptes Admin de l'app

| Email | Mot de passe |
|-------|--------------|
| info@invasionlatina.be | Invasion2009- |
| sebastian@invasionlatina.be | Invasion2009- |

Bonne chance ! 🎉
