# TruthCheck 🔍

**AI-powered misinformation & scam detector — web app + Android mobile with auto SMS scanning.**

Paste any forwarded message, or let TruthCheck automatically scan your incoming SMS messages → AI searches real sources → color-coded verdict with reasoning and clickable sources in seconds.

---

## Features

- **AI fact-checking** — Gemini (gemini-1.5-flash) analyzes claims with live web search grounding
- **4-tier verdict system** — TRUE ✅ / FALSE ❌ / MISLEADING ⚠️ / UNVERIFIED ❓ with confidence %
- **Real sources** — live web search (Tavily/Serper) before LLM answers, never from memory alone
- **React Native mobile app** — dark-themed Expo app for Android
- **Auto SMS scanning** — BroadcastReceiver monitors incoming SMS messages automatically
- **Push notifications** — FCM alerts when a scam is detected (even when app is minimized)
- **WhatsApp share extension** — share any text to TruthCheck from any app
- **Offline-first** — history cached in AsyncStorage, works without internet for past results
- **Whitelist** — trusted phone numbers skip scanning (saves API quota)
- **Configurable sensitivity** — Low / Medium / High confidence threshold
- **Multi-language** — works with non-English input
- **Graceful errors** — friendly messages for empty input, short text, API failures

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (web) | React 18 + Vite + Tailwind CSS |
| Frontend (mobile) | React Native + Expo 51 |
| Backend | Node.js + Express (ESM) |
| Database | MongoDB + Mongoose |
| AI | Google Gemini API (gemini-1.5-flash) |
| Search | Tavily API (or Serper as fallback) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Navigation | React Navigation 6 (Bottom Tabs) |

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key
- (Recommended) Tavily or Serper API key
- (Optional) Firebase project for push notifications
- For mobile: Expo CLI (`npm install -g expo-cli`) or EAS CLI

---

## Setup

### 1. Install dependencies

```bash
# Server
cd server && npm install

# Web client
cd ../client && npm install

# Mobile app
cd ../client-mobile && npm install
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/truthcheck

# Search (recommended)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxx

# Port
PORT=5001

# Firebase (optional — required for push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

---

## Running the App

### Backend

```bash
cd server
npm run dev
# → Server on http://localhost:5001
```

### Web Frontend

```bash
cd client
npm run dev
# → http://localhost:5173
```

### Mobile App (Expo Go)

```bash
cd client-mobile
npx expo start
```

Then scan the QR code with **Expo Go** on your Android device.

> ⚠️ SMS auto-scanning requires a custom dev client or EAS Build (see below). Everything else (manual scan, history, push notifications) works in Expo Go.

---

## Building the Android APK

### Option A — Preview APK (direct download, no store)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project (first time)
cd client-mobile
eas build:configure

# Build APK
eas build --platform android --profile preview
```

The APK download link will appear in your terminal when the build completes (~10 minutes).

### Option B — Production AAB (for Play Store)

```bash
eas build --platform android --profile production
```

### eas.json (add to client-mobile/)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

---

## Firebase Setup (Push Notifications)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → **Add Firebase to your Android app**
   - Package name: `com.truthcheck.mobile`
3. **Project Settings → Service Accounts → Generate new private key**
   - Download the JSON file
4. Copy values into `server/.env`:
   - `FIREBASE_PROJECT_ID` = `project_id` from JSON
   - `FIREBASE_CLIENT_EMAIL` = `client_email` from JSON
   - `FIREBASE_PRIVATE_KEY` = `private_key` from JSON (keep `\n` as literal `\n`)
5. In Firebase Console → **Project Settings → General**
   - Copy the `google-services.json` for Android → place in `client-mobile/`
6. Update `client-mobile/src/services/notifications.js`:
   - Replace `'your-eas-project-id'` with your actual EAS project ID from `expo.dev`

---

## Testing SMS Scanning on Android Emulator

1. Start your Android emulator (API 26+)
2. Open the emulator's **Extended Controls** → **Phone** tab
3. Enter a sender number and paste a scam message body → click **Send Message**
4. TruthCheck will intercept it, scan it, and show an alert

**Example scam messages to test:**

### Scam 1 — Prize/Lottery Fraud
```
CONGRATULATIONS! You have been selected as the lucky winner of Rs 25,00,000 in the Jio Lucky Draw 2024.
To claim your prize, send your Aadhaar number and bank details to this WhatsApp number immediately: +91-9876543210.
Offer valid for 24 hours only. Do not share this with anyone.
```
Expected: ❌ FALSE ~95% confidence — classic lottery scam pattern, no legitimate lottery asks for bank details via SMS.

---

### Scam 2 — Bank Phishing
```
Dear Customer, your SBI account has been temporarily suspended due to suspicious activity.
To restore access immediately, click this link and verify your details:
http://sbi-secure-update.xyz/verify
Failure to verify within 2 hours will result in permanent account closure. - SBI Customer Care
```
Expected: ❌ FALSE ~97% confidence — phishing URL, SBI does not send account suspension notices via SMS with external links.

---

### Scam 3 — Job Offer Scam
```
Work from home and earn Rs 50,000 per month! No experience needed. Just like and share posts on Instagram for 2 hours daily.
Registration fee of Rs 500 only. 100% guaranteed income. WhatsApp us now to register.
This is a genuine opportunity approved by Indian Government.
```
Expected: ❌ FALSE / ⚠️ MISLEADING ~90% confidence — fake government approval claim, upfront payment red flag, unrealistic income promise.

---

## API Endpoints

### Existing

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/check` | Fact-check a claim (now returns `alerted: boolean`) |
| GET | `/api/recent` | Last 10 public checks |
| GET | `/api/check/:id` | Single check by ID |
| GET | `/api/health` | Server + DB + Firebase status |

### New (Mobile)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/devices/register` | Register device for push notifications |
| GET | `/api/alerts/history?deviceId=` | Last 20 scam alerts for a device |
| POST | `/api/whitelist` | Add trusted phone number |
| GET | `/api/whitelist?deviceId=` | List trusted numbers |
| DELETE | `/api/whitelist/:id` | Remove trusted number |

---

## Project Structure

```
truthcheck/
├── client/                       # React web app (Vite)
├── client-mobile/                # React Native Expo app
│   ├── App.jsx                   # Root — tab navigator + hooks
│   ├── app.json                  # Expo config, permissions, share intent
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.jsx    # Live feed of scanned messages
│   │   │   ├── ScanScreen.jsx    # Manual paste + scan
│   │   │   ├── HistoryScreen.jsx # Past scans, offline-first
│   │   │   └── SettingsScreen.jsx # Toggles, whitelist, sensitivity
│   │   ├── components/
│   │   │   ├── AlertBanner.jsx   # Animated red scam overlay
│   │   │   ├── MessageCard.jsx   # Single scan card
│   │   │   ├── VerdictBadge.jsx  # TRUE/FALSE/MISLEADING/UNVERIFIED chip
│   │   │   └── ConfidenceBar.jsx # Animated progress bar
│   │   ├── services/
│   │   │   ├── api.js            # Axios backend wrapper
│   │   │   ├── notifications.js  # Expo notifications + FCM
│   │   │   ├── smsListener.js    # Android SMS BroadcastReceiver
│   │   │   └── storage.js        # AsyncStorage (deviceId, settings, cache)
│   │   └── hooks/
│   │       ├── useNotifications.js # FCM registration + listeners
│   │       └── useSmsScanner.js    # SMS permissions + listener lifecycle
└── server/                       # Express backend
    ├── server.js                 # Entry point (extended CORS, new routes)
    ├── routes/
    │   ├── check.js              # POST /api/check (+ FCM trigger, alerted flag)
    │   ├── devices.js            # POST /api/devices/register
    │   ├── alerts.js             # GET /api/alerts/history
    │   └── whitelist.js          # CRUD /api/whitelist
    ├── models/
    │   ├── Check.js              # Original check model (unchanged)
    │   ├── Device.js             # FCM token storage
    │   ├── Alert.js              # Scam alert history per device
    │   └── Whitelist.js          # Trusted phone numbers
    └── services/
        ├── claudeService.js      # Gemini AI (unchanged)
        ├── searchService.js      # Tavily/Serper (unchanged)
        └── fcmService.js         # Firebase Admin SDK push sender
```

---

## Verdict Color Codes

| Verdict | Color | Meaning |
|---------|-------|---------|
| TRUE | 🟢 Green (#10B981) | Claim is accurate and supported by evidence |
| FALSE | 🔴 Red (#EF4444) | Claim is factually incorrect |
| MISLEADING | 🟡 Yellow (#F59E0B) | Contains truth but distorted or missing context |
| UNVERIFIED | ⚫ Gray (#6B7280) | Cannot be confirmed or denied |

---

## Getting API Keys

| Service | URL | Notes |
|---------|-----|-------|
| Google Gemini | https://aistudio.google.com/app/apikey | Free tier generous |
| Tavily | https://tavily.com | 1000 free searches/month |
| Serper | https://serper.dev | 2500 free searches |
| MongoDB Atlas | https://mongodb.com/atlas | Free M0 cluster |
| Firebase | https://console.firebase.google.com | Free Spark plan sufficient |

---

## Troubleshooting

**"Could not reach the server" on mobile**
Update `BASE_URL` in `client-mobile/src/services/api.js`:
- Emulator: `http://10.0.2.2:5001`
- Physical device: `http://YOUR_LAN_IP:5001` (find with `ipconfig`)

**SMS scanning not working**
SMS auto-scanning requires a custom Expo dev client or EAS Build. It will NOT work in standard Expo Go. Build the APK with `eas build --platform android --profile preview`.

**Push notifications not arriving**
- Ensure Firebase env vars are set in `server/.env`
- Ensure `google-services.json` is in `client-mobile/`
- Ensure the device has granted notification permissions

**"AI service configuration error"**
Check that `GEMINI_API_KEY` is set correctly in `server/.env`

**MongoDB not connecting**
The app still works without MongoDB — checks just won't be saved. Set `MONGODB_URI` in `.env` to enable persistence.
