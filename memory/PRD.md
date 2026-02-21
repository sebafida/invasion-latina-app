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
- [ ] When user decides: Switch production to Supabase backend

### P1 (High Priority)
- [ ] Full regression testing after migration
- [ ] Data migration script (if needed)

### P2 (Medium Priority)
- [ ] Push notifications for event reminders
- [ ] Push notifications for song request status
- [ ] Android Beta build

### P3 (Low Priority)
- [ ] bcrypt version warning fix (4.0.1)
- [ ] Performance optimizations
