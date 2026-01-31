# Invasion Latina Mobile App - Product Requirements Document

## 1. PROJECT OVERVIEW

**App Name:** Invasion Latina (Official App)
**Type:** Native Mobile Application (iOS & Android)
**Category:** Nightlife & Event Management
**Target Market:** Belgium (Brussels - Mirano Continental)
**Launch Strategy:** Full Feature Release (No Phased Rollout)

### Context
- **Event:** Largest monthly Latino-Reggaeton party in Belgium
- **History:** 16 years of operations
- **Monthly Traffic:** 2,000 attendees (indoor), 5,000 (outdoor festival)
- **Demographics:** Ages 18-35, smartphone-first, high social engagement
- **Primary Goal:** Combine ticketing, e-commerce, and real-time social interaction to maximize retention and engagement

## 2. DESIGN & BRAND IDENTITY

### Visual Identity
- **Theme:** Dark Mode by default (optimized for club environment)
- **Color Palette:**
  - Primary Red: `#FF0000`
  - Deep Black: `#000000`
  - Gold Accent: `#FFD700`
  - Neon highlights for interactive elements
- **Aesthetic:** Urban, energetic, "Puerto Rico/Miami" luxury club vibe
- **Typography:** Bold, modern, latino-inspired fonts
- **UX Philosophy:** Thumb-friendly, glanceable, gesture-driven

## 3. TECHNICAL ARCHITECTURE

### Technology Stack

**Frontend:**
- Expo React Native (iOS + Android)
- React Navigation for routing
- Expo Router for file-based routing
- Zustand for state management
- React Query for server state caching

**Backend:**
- FastAPI (Python)
- MongoDB for transactional data
- Firebase Realtime Database for live features

**Real-Time Services:**
- Firebase Realtime Database (voting, live updates)
- Socket.io (optional backup)

**Authentication:**
- Firebase Authentication
  - Google Sign-In (primary)
  - Apple Sign-In (primary)
  - Email/Password (secondary)

**Payments:**
- Stripe
- Supported: Bancontact (essential), Apple Pay, Google Pay, Credit Cards
- Test Mode during development

**Push Notifications:**
- Firebase Cloud Messaging (FCM)
- Segments: General, Interactive, Commercial

**Media Storage:**
- Base64 encoding for MongoDB storage
- Optimized for mobile bandwidth

**Location Services:**
- Expo Location for geofencing
- Coordinate-based venue detection

### Infrastructure Requirements
- Support 2,000+ concurrent users during events
- Real-time latency <2 seconds
- Offline-first architecture for tickets
- Multi-language support (French, Spanish, Dutch)

## 4. FEATURE SPECIFICATIONS

### 4.1 Authentication & User Management

**Features:**
- Social login (Google, Apple) - Primary
- Email/Password authentication - Fallback
- Profile creation and management
- Loyalty points tracking
- Badge/achievement system

**User Profile Schema:**
```
- User ID
- Name, Email, Phone (optional)
- Profile picture (base64)
- Loyalty points
- Badges earned
- Friends list
- Preferences (language, notifications)
- Purchase history
```

**Acceptance Criteria:**
- ✅ First-time users can sign up in <30 seconds
- ✅ Returning users auto-login if session valid
- ✅ Profile pictures display across all screens
- ✅ Loyalty points update in real-time

---

### 4.2 Events & Countdown Hub

**Features:**
- Live countdown timer to next event
- Event details (date, time, venue, lineup)
- "Add to Calendar" integration
- Push notification reminders (24h before event)
- Event history and past events archive

**Event Schema:**
```
- Event ID
- Event name
- Event date & time
- Venue details (name, address, coordinates)
- Lineup (DJ names, photos)
- Ticket categories
- Event status (upcoming, live, past)
- Banner image (base64)
- Description
```

**Acceptance Criteria:**
- ✅ Countdown updates every second
- ✅ Calendar integration works on iOS and Android
- ✅ Push notifications sent 24h before event
- ✅ Event info loads in <2 seconds

---

### 4.3 Ticketing System

**Features:**
- Multi-category tickets (Standard, VIP, Platinum)
- Stripe payment integration (Bancontact, Apple Pay, Google Pay, Cards)
- QR code generation per ticket
- Purchase history
- Ticket transfer to friends
- Offline ticket access

**Ticket Categories:**
1. **Standard** - €25
   - General admission
   - Access to main floor

2. **VIP** - €50
   - Priority entry
   - VIP area access
   - 1 free drink

3. **Platinum** - €100
   - All VIP benefits
   - Reserved table
   - 2 free drinks

**Ticket Schema:**
```
- Ticket ID
- Booking ID (reference)
- Event ID
- Category (Standard/VIP/Platinum)
- QR Code data (JSON string)
- Owner name, email
- Purchase date
- Status (issued, scanned, verified, used, cancelled)
- Transfer history
- Scan history (timestamp, staff member)
```

**Payment Flow:**
1. User selects ticket category and quantity
2. Checkout screen with total
3. Payment method selection
4. Stripe Payment Sheet
5. Payment confirmation
6. Instant QR code generation
7. Ticket stored offline

**Acceptance Criteria:**
- ✅ Tickets generate within 3 seconds of payment
- ✅ QR codes work offline
- ✅ Bancontact payment completes successfully
- ✅ Ticket transfer sends email notification
- ✅ Purchase history shows all past tickets

---

### 4.4 Live DJ Request System ⭐ STAR FEATURE

**Core Functionality:**
- Active ONLY during event hours
- Geofencing: Only at Mirano Continental
- Real-time voting system
- 3 requests per user per night
- Push notification when song plays

**User Interface:**
- Search bar (artist + song title)
- Song request button
- Live leaderboard (sorted by votes)
- Upvote/downvote buttons
- "Your Requests" section

**DJ/Admin Dashboard (Tablet Landscape):**
- Live request feed (auto-refresh)
- Sort by: Most Votes, Recent, Category
- Action buttons per request:
  1. ✅ **Played** - Moves to history
  2. ⏳ **Pending** - Stays in queue
  3. ❌ **Not Appropriate** - Removes with reason
     - Dropdown reasons:
       - Not Reggaeton
       - Kills Vibe
       - Already Played
       - Explicit Content
       - Technical Issues

**Request Schema (Firebase Realtime DB):**
```json
{
  "eventId": {
    "requests": {
      "requestId": {
        "userId": "string",
        "userName": "string",
        "songTitle": "string",
        "artistName": "string",
        "requestedAt": "timestamp",
        "votes": 0,
        "voters": ["userId1", "userId2"],
        "status": "pending|played|rejected",
        "rejectionReason": "string|null",
        "playedAt": "timestamp|null"
      }
    }
  }
}
```

**Geofencing Logic:**
- Venue coordinates: Mirano Continental, Brussels
- Radius: 100 meters
- Check location permission on feature access
- Disable requests if outside geofence

**Voting Rules:**
- Users can vote on others' requests
- Cannot vote on own requests
- One vote per user per request
- Vote count updates in real-time
- Leaderboard re-sorts automatically

**Push Notifications:**
- "Your song [Title] is playing now! 🎵"
- Sent when DJ marks request as "Played"

**Acceptance Criteria:**
- ✅ Feature disabled outside event hours
- ✅ Feature disabled outside venue geofence
- ✅ Real-time vote updates <2 seconds
- ✅ DJ dashboard shows requests instantly
- ✅ Push notification sent when song plays
- ✅ 3-request limit enforced per user

---

### 4.5 Merchandising (E-commerce)

**Features:**
- Product catalog (apparel, accessories)
- Product images, descriptions, sizes
- Shopping cart
- Checkout with Stripe
- Delivery options:
  - Home delivery (address form)
  - Pick-up at bar (during event)
- Order tracking

**Product Categories:**
1. **Apparel**
   - Hoodies (€45)
   - T-shirts (€25)
   - Caps (€20)

2. **Accessories**
   - Wristbands (€10)
   - Keychains (€8)
   - Stickers (€5)

**Product Schema:**
```
- Product ID
- Name
- Description
- Category
- Price
- Sizes available
- Images (base64 array)
- Stock quantity
- Vendor ID (for split payments)
```

**Order Schema:**
```
- Order ID
- User ID
- Products (array with quantity, size)
- Total price
- Delivery method (home | pickup)
- Delivery address (if home)
- Order status (pending, confirmed, shipped, delivered)
- Stripe payment ID
- Created at, Updated at
```

**Acceptance Criteria:**
- ✅ Product images load in <2 seconds
- ✅ Cart persists across app restarts
- ✅ Checkout completes in <30 seconds
- ✅ Order confirmation email sent
- ✅ Pick-up orders flagged for event staff

---

### 4.6 VIP Table Booking

**Features:**
- Interactive venue map
- Date selection
- Zone selection (Main Floor, VIP Area, Terrace)
- Bottle package selection
- Guest count input
- Request submission
- Admin confirmation workflow
- Booking confirmation push notification

**Bottle Packages:**
1. **Bronze** - €200
   - 1 bottle vodka/rum
   - Mixers included
   - Table for 4

2. **Silver** - €400
   - 2 bottles (your choice)
   - Premium mixers
   - Table for 6

3. **Gold** - €800
   - 3 bottles (your choice)
   - Champagne included
   - Table for 10
   - Priority service

**Booking Flow:**
1. Select event date
2. View venue map
3. Select zone
4. Choose package
5. Enter guest count
6. Submit request
7. Staff reviews → Confirms/Rejects
8. User receives push notification

**Booking Schema:**
```
- Booking ID
- User ID
- Event ID
- Zone (Main Floor, VIP, Terrace)
- Package (Bronze, Silver, Gold)
- Guest count
- Bottle preferences
- Special requests
- Status (pending, confirmed, rejected, completed)
- Submitted at
- Confirmed at
- VIP provider ID (for split payment)
```

**Acceptance Criteria:**
- ✅ Venue map displays all zones
- ✅ Booking request sent in <3 seconds
- ✅ Admin can approve/reject from dashboard
- ✅ User notified within 2 hours
- ✅ Payment processed on confirmation

---

### 4.7 Social & Media Features

**Photo Gallery:**
- Event albums (auto-organized by date)
- HD photo viewing
- "Tag Yourself" feature
- Share to social media
- Download photos

**Aftermovies:**
- Embedded video player
- HD streaming
- Share functionality
- Play count tracking

**Friend Features:**
- "Who's Going?" list
- Check-in at event
- Friend activity feed
- Send friend requests

**AR Filters (Future Enhancement):**
- Branded Invasion Latina filters
- In-app camera with filters
- Save and share photos

**Gamification:**
- Loyalty badges:
  - 🎟️ **Rookie** - First event attended
  - 🔥 **Regular** - 5 events attended
  - 👑 **VIP** - 10 events attended
  - 💎 **Ambassador** - 20 events attended
- Points system:
  - 10 points per ticket purchase
  - 5 points per merchandise order
  - 20 points per VIP booking
  - 1 point per song request vote
- Rewards:
  - 100 points = €5 discount
  - 500 points = Free standard ticket
  - 1000 points = VIP upgrade

**Media Schema:**
```
- Media ID
- Event ID
- Type (photo | video)
- URL or base64
- Upload date
- Tagged users (array)
- View count
- Like count
```

**Acceptance Criteria:**
- ✅ Photos load in gallery view
- ✅ Tag yourself feature works
- ✅ Videos stream without buffering
- ✅ Badges display on profile
- ✅ Points update after purchases

---

### 4.8 Info & Practical

**Features:**
- Venue map and directions
- Parking information
- FAQ section
- Club rules
- Contact form
- Emergency contacts
- Multi-language toggle (FR, ES, NL)

**Info Sections:**
1. **Venue Info**
   - Address
   - Google Maps integration
   - Public transport options
   - Parking locations

2. **FAQ**
   - Ticket policies
   - Age restrictions (18+)
   - Dress code
   - Re-entry policy
   - Refund policy

3. **Rules**
   - No drugs policy
   - No weapons
   - Respect staff and attendees
   - Photography guidelines

4. **Contact**
   - Email
   - Phone
   - Social media links
   - Submit inquiry form

**Acceptance Criteria:**
- ✅ All info loads offline
- ✅ Maps open in Google/Apple Maps
- ✅ Language switch works instantly
- ✅ Contact form submits successfully

---

## 5. PUSH NOTIFICATION STRATEGY

### Notification Types

**1. Event Announcements (General)**
- "New event announced! 🎉 Save your spot"
- Sent when new event is created
- Delivered to all users

**2. Reminders (General)**
- "24 hours until Invasion Latina! Ready? 🔥"
- Sent 24h before event
- Delivered to ticket holders

**3. Interactive (Song Requests)**
- "Your song [Title] is playing now! 🎵"
- Sent when DJ plays requested song
- Delivered to requester only

**4. Commercial (Bookings/Orders)**
- "Your VIP table is confirmed! ✅"
- "Your order has shipped! 📦"
- Delivered to individual users

**5. Social (Friend Activity)**
- "[Friend Name] is going to the next event!"
- "You've earned a new badge: VIP 👑"

### Notification Settings
- User can enable/disable each category
- Quiet hours option (11 PM - 9 AM)
- Test notification button in settings

---

## 6. OFFLINE FUNCTIONALITY

**Offline-First Features:**
1. **Tickets**
   - QR codes cached locally
   - Ticket details stored in SQLite/Realm
   - Accessible without internet

2. **Event Info**
   - Event details cached
   - FAQ cached
   - Venue info cached

3. **Media**
   - Downloaded photos stored locally
   - Aftermovies require connection

**Sync Strategy:**
- Background sync when connection restored
- Manual "Pull to Refresh" option
- Visual indicator for offline mode

---

## 7. PERFORMANCE REQUIREMENTS

**Response Times:**
- App launch: <3 seconds
- Screen navigation: <1 second
- API calls: <2 seconds
- Real-time updates: <2 seconds
- Payment processing: <5 seconds
- Ticket generation: <3 seconds

**Concurrent Users:**
- Support 2,000+ users during events
- Real-time voting with no lag
- No crashes under load

**Data Usage:**
- Minimize bandwidth with image optimization
- Compress video streams
- Cache aggressively

**Battery Usage:**
- Optimize location tracking
- Minimize background processes
- Use efficient Firebase listeners

---

## 8. SECURITY & PRIVACY

**Data Protection:**
- Encrypt all payment data
- Never store card numbers
- Use Stripe tokenization
- Secure API keys in environment variables

**Authentication:**
- JWT tokens with expiration
- Secure token storage (Keychain/Encrypted Shared Prefs)
- Automatic logout after 30 days

**Permissions:**
- Camera (for AR filters)
- Location (for geofencing)
- Notifications (for push)
- Photos (for gallery access)

**Privacy Policy:**
- GDPR compliant
- Data deletion request support
- Transparent data usage

---

## 9. TESTING REQUIREMENTS

**Unit Tests:**
- Payment calculation logic
- Split payment logic
- Voting system logic
- Loyalty points calculation

**Integration Tests:**
- Stripe payment flow
- Firebase authentication
- Real-time voting
- Push notifications

**E2E Tests:**
- Complete ticket purchase flow
- Song request and voting
- VIP booking confirmation
- Merchandise order

**Load Tests:**
- 2,000 concurrent users
- Real-time voting performance
- Payment processing under load

**Device Tests:**
- iOS (iPhone 12+, iPad)
- Android (Samsung, Pixel)
- Various screen sizes
- Dark mode consistency

---

## 10. LAUNCH CHECKLIST

**Pre-Launch:**
- ✅ All features implemented
- ✅ Backend deployed and tested
- ✅ Firebase configured (production)
- ✅ Stripe live mode enabled
- ✅ Push notifications tested
- ✅ App store assets prepared
- ✅ Privacy policy published
- ✅ Terms of service published

**App Store Requirements:**
- iOS App Store submission
- Google Play Store submission
- App icons (all sizes)
- Screenshots (all devices)
- App description (3 languages)
- Privacy declarations
- Age rating: 18+

**Post-Launch:**
- Monitor crash reports
- Track user analytics
- Gather user feedback
- Plan feature updates
- Monitor payment success rates

---

## 11. SUCCESS METRICS (KPIs)

**User Engagement:**
- Monthly Active Users (MAU)
- Daily Active Users (DAU)
- Session duration
- Feature adoption rate

**Revenue:**
- Ticket sales via app
- Merchandise sales
- VIP booking conversion rate
- Average order value

**Retention:**
- 7-day retention rate
- 30-day retention rate
- Churn rate
- Repeat purchase rate

**Technical:**
- App crash rate (<1%)
- API response time (<2s)
- Payment success rate (>95%)
- Push notification open rate (>30%)

**Social:**
- Song requests per event
- Average votes per request
- Friend connections
- Media shares

---

## 12. FUTURE ENHANCEMENTS (Post-Launch)

**Phase 2 Features:**
- AR filters integration
- Live chat during events
- In-app social feed
- Personalized event recommendations
- AI-powered music preferences

**Phase 3 Features:**
- Multi-city expansion
- Partner venue integration
- Artist meet-and-greet bookings
- Exclusive content for VIP members
- NFT-based collectibles

---

## APPENDIX A: API ENDPOINTS

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/social-login` - Google/Apple login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `GET /api/events/next` - Get next upcoming event

### Tickets
- `POST /api/tickets/create-payment-intent` - Initiate purchase
- `POST /api/tickets/confirm` - Confirm payment
- `GET /api/tickets/my-tickets` - User's tickets
- `POST /api/tickets/transfer` - Transfer ticket

### DJ Requests (Firebase)
- `POST /firebase/requests/create` - Submit song request
- `POST /firebase/requests/vote` - Vote on request
- `GET /firebase/requests/live` - Get live requests
- `PUT /firebase/requests/update-status` - DJ updates status

### Merchandise
- `GET /api/merchandise/products` - List products
- `POST /api/merchandise/cart` - Add to cart
- `POST /api/merchandise/checkout` - Process order

### VIP Bookings
- `POST /api/vip/request` - Submit booking request
- `PUT /api/vip/confirm` - Admin confirms booking
- `GET /api/vip/my-bookings` - User's bookings

### Media
- `GET /api/media/gallery/:eventId` - Get event photos
- `POST /api/media/tag` - Tag user in photo
- `GET /api/media/videos/:eventId` - Get aftermovies

### Notifications
- `POST /api/notifications/register-token` - Register FCM token
- `PUT /api/notifications/preferences` - Update settings

---

## APPENDIX B: DATABASE COLLECTIONS

### MongoDB Collections
1. `users` - User profiles and authentication
2. `events` - Event information
3. `tickets` - Ticket records and QR codes
4. `bookings` - Ticket purchase bookings
5. `merchandise` - Product catalog
6. `orders` - Merchandise orders
7. `vip_bookings` - VIP table reservations
8. `media` - Photos and videos
9. `notifications` - Notification logs
10. `loyalty` - Points and badges

### Firebase Realtime Database Structure
```
/events/{eventId}/
  /requests/
    /{requestId}/
      - userId
      - songTitle
      - artistName
      - votes
      - voters[]
      - status
      - timestamps
  /active_status
  /geofence_enabled
```

---

**Document Version:** 1.0
**Last Updated:** 2025
**Status:** Ready for Implementation
