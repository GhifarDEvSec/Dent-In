# How to Connect Supabase + Hugging Face + Deploy

> Step-by-step with exact buttons to click. Follow each section in order.

---

## STEP 1: Get Supabase Database (Free)

### 1.1 Create Account
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with **GitHub** (easiest)
4. Verify your email

### 1.2 Create Project
1. Click **"New project"**
2. Fill in:
   - **Organization**: Click "Create a new organization" → type `Dent-in` → Done
   - **Project name**: `dentin-clinic`
   - **Database password**: Type any password → **SAVE THIS somewhere!**
   - **Region**: Pick closest to your country (e.g. `Southeast Asia` for Indonesia)
3. Click **"Create new project"**
4. Wait 2-3 minutes until it says **"Healthy"**

### 1.3 Get Your Database URL
1. Go to **Settings** (gear icon, left sidebar)
2. Click **"Database"**
3. Scroll down to **"Connection string"**
4. Click **"URI"** tab
5. You see something like:
   ```
   postgresql://postgres.xxxxxxxxxxxxx:your-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
6. **Copy this entire URL** — this is your `DATABASE_URL`

### 1.4 Put It in Your Project
1. Open your project folder: `C:\Haackathon\dentin-unified`
2. Create a file called `.env` (not `.env.example`):
```
DATABASE_URL=paste-your-url-here
JWT_SECRET=any-random-text-at-least-32-characters-long
HF_API_TOKEN=will-get-in-step-2
POSTHOG_API_KEY=will-get-in-step-3
```

---

## STEP 2: Get Hugging Face AI Token (Free)

### 2.1 Create Account
1. Go to **https://huggingface.co**
2. Click **"Sign Up"**
3. Sign up with **GitHub** or **Email**
4. Verify your email

### 2.2 Get API Token
1. Click your **profile picture** (top right)
2. Click **"Settings"**
3. Click **"Access Tokens"** (left sidebar)
4. Click **"Create new token"**
5. Fill in:
   - **Name**: `dentin-ai`
   - **Role**: Select **"Read"** (free tier)
6. Click **"Create token"**
7. You see: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
8. **COPY THIS** — you won't see it again!

### 2.3 Put It in Your Project
1. Open your `.env` file
2. Replace the `HF_API_TOKEN` line:
```
HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## STEP 3: Deploy to Railway (Free $5/month)

### 3.1 Create GitHub Repository
1. Go to **https://github.com**
2. Click **"+"** (top right) → **"New repository"**
3. Fill in:
   - **Repository name**: `dentin-unified`
   - **Public** or **Private** (your choice)
4. Click **"Create repository"**
5. Run these commands in your terminal:
```bash
cd C:\Haackathon\dentin-unified
git init
git add .
git commit -m "Deploy to production"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dentin-unified.git
git push -u origin main
```

### 3.2 Deploy on Railway
1. Go to **https://railway.app**
2. Click **"Login"** → Sign in with **GitHub**
3. Click **"New Project"**
4. Click **"Deploy from GitHub Repo"**
5. Select your `dentin-unified` repository
6. Railway auto-detects Java → starts building
7. Wait for build to finish (2-5 minutes)

### 3.3 Add Environment Variables
1. In Railway dashboard, click your **project**
2. Click **"Variables"** tab
3. Click **"New Variable"** and add these one by one:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase URL from Step 1.3 |
| `JWT_SECRET` | Any random text (e.g. `my-super-secret-key-123456789012`) |
| `HF_API_TOKEN` | Your Hugging Face token from Step 2.2 |
| `SPRING_PROFILES_ACTIVE` | `production` |

4. Click **"Deploy"** (it re-deploys automatically)

### 3.4 Get Your Public URL
1. Go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. You get: `https://dentin-unified-production.up.railway.app`
5. **Open this URL** — your website is live!

---

## STEP 4: Update CORS (Important!)

Your backend needs to know your public URL.

### 4.1 Update Code
Open `WebConfig.java` and update the CORS origins. Or better, add this variable in Railway:

1. In Railway **Variables** tab, add:
```
CORS_ORIGINS=https://dentin-unified-production.up.railway.app
```

2. Railway re-deploys automatically

---

## STEP 5: Verify Everything Works

### 5.1 Test Database (Supabase)
1. Go to **https://supabase.com** → Your project
2. Click **"Table Editor"** (left sidebar)
3. You should see tables: `patients`, `dentists`, `appointments`, `teeth_scans`, `prescriptions`
4. Register a user on your website → check if it appears in `patients` table

### 5.2 Test AI (Hugging Face)
1. Go to your website → Dashboard → Dental Scanner
2. Upload a photo → Click "Run AI Analysis"
3. If you see a health score → AI is working
4. If you see "AI analysis unavailable" → Check `HF_API_TOKEN` in Railway variables

### 5.3 Test Auth
1. Register a new account
2. Log out
3. Log back in with same email/password
4. If it works → JWT auth is working

---

## Quick Reference: Where to Get What

| Service | Website | Free Tier | What You Get |
|---------|---------|-----------|--------------|
| **Supabase** | https://supabase.com | 500MB database | PostgreSQL + API |
| **Hugging Face** | https://huggingface.co | Free inference | AI image classification |
| **Railway** | https://railway.app | $5/month credit | Host Spring Boot app |
| **GitHub** | https.github.com | Unlimited | Code storage |

---

## Troubleshooting

### "Application failed to start"
- Check Railway **Deploy Logs** — look for error messages
- Make sure `DATABASE_URL` is correct (copy again from Supabase)

### "Connection refused" or "FATAL: password authentication failed"
- Your Supabase password might be wrong
- Go to Supabase → Settings → Database → Reset password

### AI returns "AI analysis unavailable"
- Check `HF_API_TOKEN` in Railway variables
- Make sure token starts with `hf_`
- Token must have "Read" permission

### Website shows blank page
- Open browser console (F12) → check for red errors
- Make sure URL is `https://...up.railway.app` (not HTTP)

### CORS error in console
- Add your Railway URL to `CORS_ORIGINS` variable in Railway
