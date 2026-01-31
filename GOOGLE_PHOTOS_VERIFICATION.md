# Google Photos API - Scope Verification Checklist

## ✅ Step-by-Step Verification

### 1. Verify Authorization URL Includes Scopes

**Status:** ✅ CONFIGURED

The OAuth URL includes all required scopes:
```
openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary
```

**How to verify:**
1. Start your dev server: `npm run dev`
2. Watch the terminal logs when you visit `/api/auth/google`
3. You'll see: `🔐 Google OAuth URL: https://accounts.google.com/o/oauth2/v2/auth?...`
4. Check the `scope` parameter contains all scopes above

**Files:** [app/api/auth/google/route.ts](app/api/auth/google/route.ts#L7-L15)

---

### 2. Delete Old Tokens

**Status:** ⚠️ ACTION REQUIRED

If you authenticated before adding Photos scopes, you MUST clear tokens:

**Option A: Use the Diagnostics Page (Recommended)**
1. Visit: `http://localhost:3000/dashboard/diagnostics`
2. Click "Clear All Tokens"
3. Log out and log back in

**Option B: API Call**
```bash
curl -X POST http://localhost:3000/api/auth/clear-tokens -b cookies.txt
```

**Option C: Database**
Delete/update the user record in your MongoDB database to set:
- `googleAccessToken: null`
- `googleRefreshToken: null`
- `googleConnected: false`

**Files:**
- Token diagnostics: [app/dashboard/diagnostics/page.tsx](app/dashboard/diagnostics/page.tsx)
- Clear tokens API: [app/api/auth/clear-tokens/route.ts](app/api/auth/clear-tokens/route.ts)

---

### 3. Confirm Token Contains Photos Scopes

**Status:** 🔍 NEEDS VERIFICATION

After re-authenticating, verify the token has the correct scopes:

**Option A: Visit Diagnostics Page**
1. Go to: `http://localhost:3000/dashboard/diagnostics`
2. Click "Check Token"
3. Look for ✅ green checks next to:
   - `photoslibrary.readonly`
   - `photoslibrary`

**Option B: API Call**
```bash
curl http://localhost:3000/api/auth/tokeninfo -b cookies.txt
```

Look for this in the response:
```json
{
  "analysis": {
    "hasRequiredScopes": {
      "photoslibrary.readonly": true,
      "photoslibrary": true
    }
  }
}
```

**Option C: Direct Google API**
```bash
curl "https://oauth2.googleapis.com/tokeninfo?access_token=YOUR_ACCESS_TOKEN"
```

The `scope` field should include:
- `https://www.googleapis.com/auth/photoslibrary.readonly`
- `https://www.googleapis.com/auth/photoslibrary`

**Files:**
- Token info API: [app/api/auth/tokeninfo/route.ts](app/api/auth/tokeninfo/route.ts)

---

### 4. Google Cloud Console Configuration

**Status:** ⚠️ VERIFY IN GOOGLE CLOUD CONSOLE

Your app must be properly configured in Google Cloud Console:

**Required Setup:**
1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **OAuth consent screen**

**Checklist:**
- [ ] **User Type:** External (or Internal if G Workspace)
- [ ] **Publishing Status:** Testing (add test users) OR Published
- [ ] **Scopes:** Click "Edit App" → "Scopes" → "Add or Remove Scopes"
  - [ ] `openid`
  - [ ] `email`
  - [ ] `profile`
  - [ ] `.../auth/gmail.readonly`
  - [ ] `.../auth/drive.readonly`
  - [ ] `.../auth/photoslibrary.readonly` ⚠️ **CRITICAL**
  - [ ] `.../auth/photoslibrary` ⚠️ **CRITICAL**

**⚠️ Important Notes:**
- Google Photos scopes are "sensitive scopes"
- If not added to the consent screen, Google will NEVER grant them
- If your app is in "Testing" mode, add your email as a test user
- Users must be explicitly added as test users OR app must be published

**Common Issues:**
- ❌ Scopes not added to OAuth consent screen → Google ignores them
- ❌ App in "Testing" but user not added as test user → Permission denied
- ❌ Scopes added but consent screen not saved → Changes not applied

---

### 5. Test the Photos API Call

**Status:** 🧪 TEST AFTER RE-AUTH

After clearing tokens and re-authenticating:

1. Visit: `http://localhost:3000/dashboard/photos`
2. Or call: `curl http://localhost:3000/api/photos?pageSize=50 -b cookies.txt`

**Expected Result:**
- ✅ Status: 200
- ✅ Response contains `mediaItems` array

**If Still Failing:**
- ❌ 403 "insufficient authentication scopes" → Token still doesn't have Photos scope
  - Verify Google Cloud Console configuration (step 4)
  - Check diagnostics page (step 3)
  - Check terminal logs for granted scopes

---

## 🔍 Debugging Tools

### Terminal Logs
When logging in, watch for:
```
🔐 Google OAuth URL: https://accounts.google.com/o/oauth2/v2/auth?...
📋 Requested Scopes: openid email profile https://...
✅ Token granted with scopes: openid email profile https://...
✅ Google Photos scope GRANTED
```

### Diagnostics Page
Visit `/dashboard/diagnostics` to see:
- Current token scopes
- Missing scopes
- Step-by-step instructions

### API Endpoints
- `GET /api/auth/tokeninfo` - Check current token scopes
- `POST /api/auth/clear-tokens` - Clear all OAuth tokens
- `GET /api/photos` - Test Photos API (the one that was failing)

---

## 📝 Summary of Changes Made

1. ✅ Added `include_granted_scopes: true` for incremental auth
2. ✅ Added logging to OAuth URL generation
3. ✅ Added scope verification after token exchange
4. ✅ Created diagnostics page: `/dashboard/diagnostics`
5. ✅ Created token info API: `/api/auth/tokeninfo`
6. ✅ Created clear tokens API: `/api/auth/clear-tokens`
7. ✅ Both `photoslibrary.readonly` and `photoslibrary` scopes included

---

## 🚀 Quick Start (For Testing)

```bash
# 1. Start your app
npm run dev

# 2. Visit diagnostics page
open http://localhost:3000/dashboard/diagnostics

# 3. Clear old tokens
# Click "Clear All Tokens" button

# 4. Log out and log in again
# Make sure to accept ALL permissions in Google consent screen

# 5. Verify token has Photos scopes
# Return to diagnostics page and click "Check Token"

# 6. Test Photos API
open http://localhost:3000/dashboard/photos
```

---

## ⚠️ Critical: Google Cloud Console

**YOU MUST verify in Google Cloud Console that:**
1. OAuth consent screen includes Photos scopes
2. App is either Published OR you're added as a test user
3. All sensitive scopes are explicitly added and saved

Without this configuration, Google will NEVER grant Photos scopes regardless of what your code requests.
