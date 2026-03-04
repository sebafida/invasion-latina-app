# Migration MongoDB → Supabase

## État actuel

✅ **Schéma Supabase créé** - 21 tables migrées  
✅ **Backend Supabase prêt** - `server_supabase.py`  
✅ **MongoDB toujours actif** - `server.py` (production actuelle)

## Structure des fichiers

```
backend/
├── server.py              # Backend MongoDB (ACTIF)
├── server_supabase.py     # Backend Supabase (PRÊT)
├── database.py            # Connexion MongoDB
├── database_supabase.py   # Connexion Supabase
├── models.py              # Modèles Pydantic (MongoDB)
├── models_supabase.py     # Modèles SQLAlchemy (Supabase)
├── alembic/               # Migrations Supabase
│   └── versions/          # Historique des migrations
└── .env                   # Contient les deux connexions
```

## Comment faire la migration

### Option 1: Switch complet (recommandé)

Quand vous êtes prêt à basculer vers Supabase:

1. **Sur Railway**, changez le fichier de démarrage dans `Procfile`:
   ```
   # Avant (MongoDB)
   web: uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
   
   # Après (Supabase)
   web: uvicorn server_supabase:app --host 0.0.0.0 --port ${PORT:-8001}
   ```

2. **Ajoutez la variable d'environnement** sur Railway:
   ```
   DATABASE_URL=postgresql://postgres.vcsukrqhlgegtykimlki:Invasionlatina2009-@aws-1-eu-west-3.pooler.supabase.com:6543/postgres
   ```

3. **Redéployez** sur Railway

### Option 2: Migration des données (si nécessaire)

Si vous voulez migrer les données existantes de MongoDB vers Supabase:

```bash
# Script à exécuter une fois
cd /app/backend
python migrate_data.py
```

## Tables Supabase créées

| Table | Description |
|-------|-------------|
| users | Utilisateurs |
| events | Événements |
| tickets | Billets |
| products | Produits merchandising |
| orders | Commandes |
| vip_bookings | Réservations VIP |
| song_requests | Demandes de chansons |
| free_entry_vouchers | Vouchers entrée gratuite |
| app_settings | Paramètres application |
| djs | DJs |
| photos | Photos galerie |
| aftermovies | Vidéos aftermovie |
| loyalty_checkins | Check-ins fidélité |
| loyalty_rewards | Récompenses |
| loyalty_transactions | Transactions points |
| notification_preferences | Préférences notifications |
| consent_logs | Logs de consentement |
| event_qr_codes | QR codes événements |
| event_qr_scans | Scans QR codes |
| referrals | Parrainages |
| notifications_sent | Notifications envoyées |

## Test local

Pour tester le backend Supabase localement:

```bash
cd /app/backend
uvicorn server_supabase:app --reload --port 8002
```

Puis visitez: http://localhost:8002/docs

## Rollback

Si vous devez revenir à MongoDB, changez simplement le Procfile:
```
web: uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
```
