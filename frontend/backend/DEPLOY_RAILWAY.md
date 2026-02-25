# 🚀 Guide de Déploiement Supabase sur Railway

## Fichiers prêts pour le déploiement

```
backend/
├── server_supabase.py      # ✅ Backend Supabase (NOUVEAU)
├── server_mongodb.py       # ✅ Backend MongoDB (BACKUP)
├── database_supabase.py    # ✅ Connexion Supabase
├── models_supabase.py      # ✅ Modèles SQLAlchemy
├── Procfile.supabase       # ✅ Pour déployer Supabase
├── Procfile.mongodb        # ✅ Pour rollback MongoDB
├── requirements.txt        # ✅ Dépendances (SQLAlchemy, asyncpg inclus)
└── alembic/                # ✅ Migrations base de données
```

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### Étape 1: Préparer Railway

1. Allez sur [Railway Dashboard](https://railway.app/dashboard)
2. Sélectionnez votre projet `invasion-latina-app`

### Étape 2: Ajouter la variable d'environnement Supabase

Dans Railway > Variables, ajoutez :

```
DATABASE_URL=postgresql://postgres.vcsukrqhlgegtykimlki:Invasionlatina2009-@aws-1-eu-west-3.pooler.supabase.com:6543/postgres
```

### Étape 3: Modifier le Procfile

**Option A - Via Railway Dashboard :**
1. Allez dans Settings > Deploy
2. Changez "Start Command" en :
   ```
   uvicorn server_supabase:app --host 0.0.0.0 --port $PORT
   ```

**Option B - Via fichier Procfile :**
1. Renommez `Procfile` en `Procfile.old`
2. Renommez `Procfile.supabase` en `Procfile`
3. Commit et push sur GitHub

### Étape 4: Déployer

Railway va automatiquement redéployer après le push GitHub.

---

## 🔄 ROLLBACK vers MongoDB (si problème)

### Option 1 - Via Railway Dashboard :
Changez "Start Command" en :
```
uvicorn server_mongodb:app --host 0.0.0.0 --port $PORT
```

### Option 2 - Via Procfile :
1. Renommez `Procfile` en `Procfile.supabase`
2. Renommez `Procfile.mongodb` en `Procfile`
3. Commit et push

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

Après le déploiement, testez ces URLs :

```bash
# Health check
curl https://invasion-latina-app-production.up.railway.app/api/health

# Devrait retourner :
# {"status":"healthy","database":"connected","type":"PostgreSQL"}

# Test événements
curl https://invasion-latina-app-production.up.railway.app/api/events

# Test login
curl -X POST https://invasion-latina-app-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"info@invasionlatina.be","password":"Invasion2009-"}'
```

---

## ⚠️ POINTS IMPORTANTS

1. **Créer le compte admin sur Supabase** après déploiement :
   - Le compte `info@invasionlatina.be` devra être recréé
   - Ou utilisez l'endpoint `/api/auth/register`

2. **Les données MongoDB ne sont PAS migrées** :
   - Supabase démarre avec une base vide
   - Les utilisateurs devront se réinscrire
   - Ou créez un script de migration des données

3. **Variables d'environnement requises sur Railway** :
   ```
   DATABASE_URL=postgresql://...   # Supabase Transaction Pooler
   SECRET_KEY=votre-secret-key     # Pour JWT (gardez l'existant)
   ```

---

## 📱 TEST SUR TESTFLIGHT

1. Déployez sur Railway (étapes ci-dessus)
2. Attendez que le déploiement soit terminé (~2-3 min)
3. Ouvrez l'app sur TestFlight
4. Connectez-vous ou créez un nouveau compte
5. Testez toutes les fonctionnalités

---

## 🆘 EN CAS DE PROBLÈME

Si l'app ne fonctionne pas après migration :

1. **Vérifiez les logs Railway** : Dashboard > Deployments > View Logs
2. **Testez l'API** : `curl .../api/health`
3. **Rollback** : Suivez les instructions de rollback ci-dessus

Le rollback prend ~1 minute et restaure MongoDB immédiatement.
