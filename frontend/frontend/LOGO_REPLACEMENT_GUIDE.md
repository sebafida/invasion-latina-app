# 🎨 GUIDE DE REMPLACEMENT DU LOGO INVASION LATINA

## 📍 Emplacements du Logo dans l'Application

Le logo placeholder (flamme 🔥) a été ajouté dans **2 emplacements stratégiques** :

### 1️⃣ **Écran de Connexion (Login Screen)** - GRAND LOGO
**Fichier:** `/app/frontend/app/auth/login.tsx`

**Lignes:** Recherchez les commentaires suivants :
```typescript
{/* ============================================ */}
{/* LOGO SECTION - REPLACE WITH YOUR ACTUAL LOGO */}
{/* ============================================ */}
{/* TODO: Replace the Ionicons below with your actual "INVASION LATINA" logo */}
{/* Use: <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" /> */}
```

**Code actuel (placeholder):**
```typescript
<View style={styles.logoContainer}>
  <View style={styles.logoIconWrapper}>
    <Ionicons name="flame" size={80} color={theme.colors.primary} />
  </View>
  <Text style={styles.logoText}>INVASION</Text>
  <Text style={styles.logoSubtext}>LATINA</Text>
  <View style={styles.logoUnderline} />
</View>
```

**Code à utiliser avec votre logo :**
```typescript
<View style={styles.logoContainer}>
  <Image 
    source={require('../../assets/logo.png')} 
    style={styles.logoImage} 
    resizeMode="contain" 
  />
</View>
```

**Ajoutez ce style dans les styles:**
```typescript
logoImage: {
  width: 200,
  height: 200,
  marginBottom: theme.spacing.md,
},
```

---

### 2️⃣ **Barre de Navigation Home (Header)** - PETIT LOGO
**Fichier:** `/app/frontend/app/(tabs)/home.tsx`

**Lignes:** Recherchez les commentaires suivants :
```typescript
{/* ============================================ */}
{/* CUSTOM HEADER WITH LOGO */}
{/* ============================================ */}
{/* TODO: Replace the Ionicons logo with your actual "INVASION LATINA" logo image */}
{/* Use: <Image source={require('../../assets/logo-small.png')} style={styles.headerLogo} resizeMode="contain" /> */}
```

**Code actuel (placeholder):**
```typescript
<View style={styles.headerLogoContainer}>
  <Ionicons name="flame" size={32} color={theme.colors.primary} />
  <View style={styles.headerTextContainer}>
    <Text style={styles.headerLogoText}>INVASION</Text>
    <Text style={styles.headerLogoSubtext}>LATINA</Text>
  </View>
</View>
```

**Code à utiliser avec votre logo :**
```typescript
<Image 
  source={require('../../assets/logo-header.png')} 
  style={styles.headerLogoImage} 
  resizeMode="contain" 
/>
```

**Ajoutez ce style dans les styles:**
```typescript
headerLogoImage: {
  width: 150,
  height: 40,
},
```

---

## 📦 PRÉPARATION DE VOS FICHIERS LOGO

### Formats Recommandés :
- **PNG avec fond transparent** (recommandé)
- Format de secours : **SVG** (nécessite `react-native-svg`)

### Tailles Recommandées :

#### Logo Login Screen (Grand) :
- **Dimensions:** 400x400px ou 600x600px
- **Nom du fichier:** `logo.png`
- **Emplacement:** `/app/frontend/assets/logo.png`

#### Logo Header (Petit) :
- **Dimensions:** 300x80px (format horizontal)
- **Nom du fichier:** `logo-header.png`
- **Emplacement:** `/app/frontend/assets/logo-header.png`

### Optimisations :
✅ Exportez en **PNG-24 avec transparence**
✅ Optimisez la taille du fichier (utilisez TinyPNG.com)
✅ Testez sur **fond noir** pour vous assurer de la visibilité

---

## 🎨 RECOMMANDATIONS DESIGN

### Couleurs à utiliser dans votre logo :
- **Rouge primaire:** `#FF0000` (couleur signature)
- **Or/Gold:** `#FFD700` (accent luxe)
- **Blanc:** `#FFFFFF` (texte/détails)

### Style :
- **Vibe:** Puerto Rico / Miami luxury club
- **Effet:** Neon glow / Ombre portée rouge
- **Typographie:** Bold, moderne, impactante

### Ce qui fonctionne bien sur dark mode :
✅ Contours lumineux (neon effect)
✅ Or/Gold pour les accents
✅ Rouge vif pour l'impact
❌ Éviter : Gris foncés (peu visibles sur noir)

---

## 🔧 ÉTAPES D'IMPLÉMENTATION

### Étape 1 : Préparez vos logos
1. Créez deux versions de votre logo
2. Nommez-les `logo.png` (grand) et `logo-header.png` (petit)
3. Optimisez la taille des fichiers

### Étape 2 : Ajoutez les fichiers
```bash
# Placez vos logos dans le dossier assets
/app/frontend/assets/logo.png
/app/frontend/assets/logo-header.png
```

### Étape 3 : Remplacez le code
1. Ouvrez `/app/frontend/app/auth/login.tsx`
2. Cherchez le commentaire `{/* TODO: Replace the Ionicons below... */}`
3. Remplacez le code du placeholder par le code Image
4. Faites de même pour `/app/frontend/app/(tabs)/home.tsx`

### Étape 4 : Ajustez les styles si nécessaire
```typescript
// Si votre logo est plus large/haut, ajustez :
logoImage: {
  width: 250,  // Augmentez si nécessaire
  height: 250, // Augmentez si nécessaire
  marginBottom: theme.spacing.md,
},
```

### Étape 5 : Testez
```bash
# Redémarrez le serveur Expo
sudo supervisorctl restart expo
```

---

## 💡 EXEMPLES ALTERNATIFS

### Option 1 : Logo + Texte (recommandé)
```typescript
<View style={styles.logoContainer}>
  <Image 
    source={require('../../assets/logo-icon.png')} 
    style={styles.logoIcon} 
    resizeMode="contain" 
  />
  <Text style={styles.brandText}>INVASION LATINA</Text>
</View>
```

### Option 2 : Logo seul (épuré)
```typescript
<Image 
  source={require('../../assets/logo-full.png')} 
  style={styles.logoFull} 
  resizeMode="contain" 
/>
```

### Option 3 : Logo avec effet neon
```typescript
<View style={styles.logoWithGlow}>
  <Image 
    source={require('../../assets/logo.png')} 
    style={[styles.logoImage, styles.neonGlow]} 
    resizeMode="contain" 
  />
</View>

// Style :
neonGlow: {
  shadowColor: theme.colors.primary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 1,
  shadowRadius: 20,
  elevation: 10,
},
```

---

## 🚀 APRÈS LE REMPLACEMENT

Une fois vos logos en place, l'application aura :
✅ Votre branding sur l'écran de connexion
✅ Votre logo dans la navigation principale
✅ Une identité visuelle professionnelle et cohérente

---

## 🎯 CHECKLIST FINALE

- [ ] Logo grand format créé (400x400px minimum)
- [ ] Logo header créé (300x80px horizontal)
- [ ] Logos optimisés et testés sur fond noir
- [ ] Fichiers placés dans `/app/frontend/assets/`
- [ ] Code remplacé dans `login.tsx`
- [ ] Code remplacé dans `home.tsx`
- [ ] Styles ajustés si nécessaire
- [ ] App testée sur mobile
- [ ] Logo visible et net sur iOS
- [ ] Logo visible et net sur Android

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :
1. Vérifiez que les chemins des fichiers sont corrects
2. Assurez-vous que les images sont au format PNG
3. Redémarrez l'application Expo après chaque modification
4. Vérifiez la console pour les erreurs de chargement d'image

**Votre logo donnera vie à l'identité visuelle d'Invasion Latina! 🔥🎵**
