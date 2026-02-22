# Invasion Latina - Product Requirements Document

## Overview
Invasion Latina is a mobile app for the biggest Latino-Reggaeton party in Belgium. The app manages events, tickets, VIP bookings, song requests, loyalty programs, and more.

## Core Features
- **Events Management**: View upcoming events, lineup, ticket categories
- **Ticketing**: Purchase tickets via Xceed integration
- **VIP Bookings**: Request VIP table reservations
- **Song Requests**: Request songs during events (geofenced + time-restricted)
- **Loyalty Program**: Earn Invasion Coins through check-ins, referrals, QR scans
- **Photo Gallery**: View event photos
- **Aftermovies**: Watch event videos
- **Admin Panel**: Manage events, users, QR codes, settings

## Architecture

### Frontend
- **Framework**: React Native / Expo
- **Navigation**: Expo Router
- **State Management**: React Context (AuthContext)
- **Styling**: NativeWind (Tailwind for React Native)

### Backend  
- **Framework**: FastAPI (Python)
- **Authentication**: JWT tokens + Social login (Apple/Google)
- **Hosting**: Railway

### Database
- **Current (Production)**: MongoDB Atlas
- **Prepared (Migration Ready)**: Supabase PostgreSQL

## Database Migration Status

### ✅ Completed
1. Created PostgreSQL schema on Supabase (21 tables)
2. Created `server_supabase.py` - fully functional backend using Supabase
3. Created `models_supabase.py` - SQLAlchemy models
4. Set up Alembic for database migrations
5. Tested all major endpoints successfully

### Migration Files
```
backend/
├── server.py              # MongoDB backend (ACTIVE)
├── server_supabase.py     # Supabase backend (READY)
├── database_supabase.py   # Supabase connection
├── models_supabase.py     # SQLAlchemy models
├── alembic/               # Database migrations
└── MIGRATION_SUPABASE.md  # Migration guide
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/social` - Apple/Google login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - List all events
- `GET /api/events/next` - Get next upcoming event
- `GET /api/events/{id}` - Get event details

### Song Requests
- `POST /api/dj/request-song` - Submit song request
- `GET /api/dj/requests` - Get pending requests
- `POST /api/dj/vote/{id}` - Vote for a song

### Loyalty
- `GET /api/loyalty/my-points` - Get user points
- `POST /api/loyalty/free-entry/claim` - Claim free entry voucher
- `POST /api/scan-event-qrcode` - Scan QR to earn coins

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/settings` - Get app settings
- `POST /api/admin/settings/toggle-requests` - Toggle song requests
- `POST /api/admin/event-qrcode` - Create event QR code

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://...           # Current MongoDB
DATABASE_URL=postgresql://...      # Supabase (ready for migration)
SECRET_KEY=...
```

### Frontend
```
EXPO_PUBLIC_BACKEND_URL=https://...
```

## Deployment

### Railway (Current)
- MongoDB backend via `server.py`
- Procfile: `web: uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}`

### Railway (After Migration)
- Change Procfile to use `server_supabase:app`
- Add `DATABASE_URL` environment variable

## Testing Credentials
- **Admin**: `admin@invasionlatina.be` / `admin123`
- **Admin (Production)**: `info@invasionlatina.be` / `Invasion2009-`

## Changelog

### 2025-12 - Audit Sécurité & Scalabilité (20 000 users)

**Phase 1 - Sécurité Backend (TERMINÉ)**
- ✅ 1.1 - Mots de passe admin sécurisés (env vars, plus de logging en clair)
- ✅ 1.2 - Clé JWT forte via variable d'environnement
- ✅ 1.4 - Rate limiting sur tous les endpoints auth (slowapi)
- ✅ 1.5 - datetime.now(timezone.utc) au lieu de datetime.utcnow()
- ✅ 1.6 - bcrypt rounds=12 pour plus de sécurité
- ✅ 1.7 - Validation Pydantic améliorée (TicketPurchase, SocialAuthData)
- ✅ 1.9 - Pool DB optimisé (pool_size=20, max_overflow=15, pool_pre_ping=True)

**Phase 2 - Frontend (PARTIELLEMENT TERMINÉ)**
- ✅ 2.1 - Fix memory leak setInterval DJ (useFocusEffect)
- ✅ 2.6 - DevMode uniquement pour admin/__DEV__
- ✅ 2.8 - OfflineBanner component créé
- ✅ 3.3 - Logger utility créé (supprime logs en production)
- ✅ 3.4 - ErrorBoundary component créé
- ✅ _layout.tsx mis à jour avec ErrorBoundary + OfflineBanner

**À FAIRE (Phase 2-4 restante)**
- [ ] 2.2 - Appeler registerForPushNotifications après login
- [ ] 2.3 - Error states sur les écrans
- [ ] 2.4 - Empty states sur les écrans
- [ ] 2.5 - Validation parseInt dans shop.tsx
- [ ] 2.7 - Pagination sur les endpoints de liste
- [ ] 3.1 - Validation email/phone dans register.tsx
- [ ] 3.2 - Strings non traduites

### 2025-12 - Critical Auth Bug Fixes (Session 2)
**Corrections des 5 bugs critiques d'authentification** (P0 - Stabilité connexion)

#### Bugs corrigés :
1. **BUG 1** - `AuthContext.tsx`: Ne supprime plus `auth_version` sur erreur réseau
2. **BUG 2** - `api.ts`: L'intercepteur 401 ne supprime plus `auth_version`  
3. **BUG 3** - Ajout de `auth_version` après login/register/social login :
   - `AuthContext.tsx` - `register()` ligne 94
   - `login.tsx` - `handleAppleSignIn()` ligne 155
   - `login.tsx` - `handleGoogleSignIn()` lignes 99-100
4. **BUG 4** - Race condition foreground/login social :
   - Ajout du flag `isAuthenticating` dans `AuthContext`
   - `_layout.tsx` vérifie ce flag avant d'appeler `loadUser()`
   - `login.tsx` active/désactive ce flag pendant les logins sociaux
5. **BUG 5** - Gestion erreur réseau améliorée :
   - Garde le token et utilise les données en cache sur erreur réseau
   - Ne déconnecte que sur erreur 401 (token invalide)

**Corrections UI/UX** (P1)
- Uniformisation du style du bouton "Utilisateurs & Stats" (couleur verte #4CAF50, même padding que les autres boutons admin)
- Correction de l'espacement entre les boutons Langue et Notifications (suppression du double margin)
- Bouton "Ajouter votre prénom" déjà en place pour les utilisateurs Apple Sign-In

#### Fichiers modifiés :
- `/app/frontend/src/context/AuthContext.tsx`
- `/app/frontend/app/auth/login.tsx`
- `/app/frontend/app/_layout.tsx`
- `/app/frontend/app/(tabs)/profile.tsx`

### 2025-02 - Supabase Migration Preparation
- Created complete PostgreSQL schema (21 tables)
- Implemented full backend with SQLAlchemy async
- All endpoints tested and working
- MongoDB remains active for production

### Previous Session
- Deployed to Railway with MongoDB Atlas
- Implemented QR code system for events
- Added admin user list
- Removed Face ID (simplified auth)
- Fixed various bugs and UI issues

## Backlog

### P0 (Critical)
- [x] **RÉSOLU** - Bug de stabilité de connexion après période d'inactivité (5 bugs auth corrigés)
- [ ] When user decides: Switch production to Supabase backend

### P1 (High Priority)
- [x] **RÉSOLU** - Gestion du nom pour Apple Sign-In (bouton "Ajouter votre prénom" + endpoint `/api/user/profile`)
- [x] **RÉSOLU** - Notifications activées par défaut à l'inscription (register + social login)
- [x] **RÉSOLU** - Espacement des boutons dans le profil uniformisé
- [ ] Full regression testing after migration
- [ ] Data migration script (if needed)

### P2 (Medium Priority)
- [ ] UI admin pour suppression de photos individuelles (`content-manager.tsx`)
- [ ] Push notifications for event reminders
- [ ] Push notifications for song request status
- [ ] Push notifications for VIP booking confirmation
- [ ] Android Beta build

### P3 (Low Priority)
- [ ] bcrypt version warning fix (4.0.1)
- [ ] Performance optimizations
