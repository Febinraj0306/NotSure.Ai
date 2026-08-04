# 🚀 NotSure.Ai — Production Deployment Guide

This guide details how to transition your codebase from local development to production, deploy each component, and test the production-grade application.

---

## 1. Deploy the Backend Server (Railway)

The backend server is already configured for [Railway](https://railway.app) via [`railway.toml`](file:///c:/Users/FEBIN%20RAJ/OneDrive/Documents/NotSure.Ai/server/railway.toml).

### Steps to Deploy:
1. Push your code to a GitHub repository.
2. Log in to [Railway](https://railway.app) and create a **New Project**.
3. Select **Deploy from GitHub repo** and connect your repository.
4. Set the root directory of the deploy to `/server`.
5. Under **Variables** in Railway, add the following production environment variables (do NOT copy local dev secrets):
   - `NODE_ENV=production`
   - `PORT=5001` (or let Railway assign it dynamically)
   - `MONGODB_URI` = *Your MongoDB Atlas production URI*
   - `GEMINI_API_KEY` = *Your Gemini Production API Key*
   - `TAVILY_API_KEY` = *Your Tavily Key* (optional, for search grounding)
   - `SERPER_API_KEY` = *Your Serper Key* (optional fallback)
   - `CLIENT_ORIGIN` = *Your production Web Client URL* (e.g., `https://truthcheck.vercel.app`)
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (optional, for push notifications)
6. Railway will automatically build and deploy the server. Copy your assigned public domain (e.g., `https://truthcheck-production.up.railway.app`).

---

## 2. Deploy the Web Client (Vercel or Netlify)

The React web app is built using Vite. It can be built locally or automatically on static hosts like Vercel or Netlify.

### Steps to Deploy (Vercel):
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Set the **Framework Preset** to `Vite`.
3. Set the **Root Directory** to `client`.
4. In **Environment Variables**, add:
   - `VITE_API_URL` = *Your production Railway backend URL* (e.g., `https://truthcheck-production.up.railway.app`)
5. Click **Deploy**. Vercel will build and serve your static assets instantly.

---

## 3. Deploy the Mobile Client (EAS Build)

To build your React Native app for distribution, you need to use Expo Application Services (EAS).

### Steps to Build a Production APK (Android):
1. **Configure Production URL**:
   Create a production environment file `client-mobile/.env.production` or set it in your local environment:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://truthcheck-production.up.railway.app
   ```
2. **Generate EAS Project**:
   Open a terminal in the root or `client-mobile` directory and log in to Expo:
   ```bash
   npm install -g eas-cli
   eas login
   eas project:init
   ```
   This will generate a unique `projectId` in `app.json`.
3. **Build the APK**:
   Run the build script defined in [`package.json`](file:///c:/Users/FEBIN%20RAJ/OneDrive/Documents/NotSure.Ai/client-mobile/package.json#L11):
   ```bash
   npm run build:apk --prefix client-mobile
   ```
4. EAS will compile your app in the cloud and output a downloadable link to your production `.apk` file.

---

## 🧪 Testing the Production Stack

Once deployed, follow these steps to verify your pipeline:

1. **Test Health Route**:
   Open a browser and navigate to your production backend:
   ```
   https://your-server.railway.app/api/health
   ```
   Verify that `status` is `"ok"`, and `db` is `"connected"`.

2. **Test Web Verification**:
   Go to your deployed Web Client, paste a scam claim, and hit **Check**. Check the network tab in your browser's dev tools to verify that request routes go to `your-server.railway.app/api/check` and get back a valid JSON verdict.

3. **Test Mobile App**:
   Install the generated `.apk` on an Android device:
   - Send a manual text check and ensure it receives the verdict.
   - Whitelist a phone number in **Settings** and verify it is successfully saved to the production MongoDB instance.
