# Lumyn Delivery - Quick Setup Guide

**Get your delivery platform running in 15 minutes!**

---

## ⚡ 5-Minute Setup (Production)

### **1. Deploy to Vercel (Recommended)**
```bash
# Click this button to deploy:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

# Or manually:
1. Push code to GitHub
2. Go to vercel.com → Import Project
3. Add environment variables (see below)
4. Click Deploy
```

### **2. Required Environment Variables**

Add these in your Vercel dashboard (Project Settings → Environment Variables):

```bash
# Database (Neon PostgreSQL - free tier)
DATABASE_URL=postgresql://...

# Clerk Auth (free tier)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Admin Access (your Clerk user ID)
ADMIN_USER_IDS=user_xxx
```

### **3. Get Your API Keys**

**Neon Database (Free):**
1. Go to https://console.neon.tech
2. Create new project → Copy connection string
3. Paste as `DATABASE_URL`

**Clerk Auth (Free):**
1. Go to https://dashboard.clerk.com
2. New application → Copy keys
3. Paste as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
4. In Webhooks tab: Add URL `https://your-app.vercel.app/api/webhooks/clerk`
5. Copy webhook secret → `CLERK_WEBHOOK_SECRET`
6. In Users tab: Copy your User ID → add to `ADMIN_USER_IDS`

### **4. Run Database Migration**

Vercel automatically runs `prisma migrate deploy` on build.

Or manually via your deployed API:
```bash
# Connect to your Vercel app's Postgres database
npx prisma migrate deploy
```

### **5. Done!**

Your app is live at: `https://your-app.vercel.app`

---

## 🖥️ Local Development

### **Prerequisites**
- Node.js 18+
- pnpm (or npm)
- Neon account (free)
- Clerk account (free)

### **Setup Steps**

**1. Clone & Install**
```bash
git clone <your-repo>
cd lumyn-delivery
pnpm install
```

**2. Environment Variables**
```bash
cp .env.example .env.local
# Edit .env.local with your keys
```

**3. Database**
```bash
# Create Neon database → get DATABASE_URL
# Then:
npx prisma migrate dev --name init
npx prisma generate
```

**4. Clerk Setup**
- Create app at clerk.com
- Add webhook: `http://localhost:3000/api/webhooks/clerk`
- Get keys → `.env.local`

**5. Run**
```bash
pnpm dev
# Open http://localhost:3000
```

---

## 📱 PWA Installation

Your users get a native app experience:

**iOS Safari:**
1. Open app URL in Safari
2. Tap Share (⬆️)
3. "Add to Home Screen"
4. Launches fullscreen

**Android Chrome:**
1. Open URL in Chrome
2. Menu (⋮) → "Add to Home screen"
3. Tap "Add"
4. Icon appears on home screen

**No app store needed!**

---

## 🔑 Getting Admin Access

1. Sign up through the app (choose "Customer" or "Driver")
2. Copy your Clerk User ID from Clerk dashboard (Users → your user → User ID)
3. Add it to `ADMIN_USER_IDS` in environment variables
4. Deploy or restart app
5. Visit `/admin` - you now have admin access!

---

## 📋 Default Workflow

### **Customer Flow**
1. Sign up as Customer
2. Add delivery addresses
3. Create new delivery (pickup + dropoff)
4. Pay via Pesapal
5. Track delivery on live map
6. Rate driver after completion

### **Driver Flow**
1. Sign up as Driver
2. Complete 6-step onboarding (license, vehicle, documents)
3. Wait for admin approval (1-2 days)
4. Go online in dashboard
5. Accept incoming deliveries
6. Update status: PICKED_UP → IN_TRANSIT → DELIVERED
7. Earn money!

### **Admin Flow**
1. Login as admin user
2. Go to `/admin/drivers`
3. Review pending driver applications
4. View uploaded documents
5. Approve or reject with reason
6. Driver receives email notification

---

## 🐛 Common Issues

### **"PWA not installing"**
- Ensure HTTPS (required on production)
- Check manifest loads at `your-domain.com/manifest.json`
- Clear browser cache & cookies
- Try incognito mode

### **"Database connection error"**
- Verify `DATABASE_URL` is correct
- Ensure Neon database is running
- Run: `npx prisma migrate deploy`

### **"Clerk authentication not working"**
- Double-check API keys in `.env.local`
- Clear browser storage (Clerk caches tokens)
- Verify webhook endpoint is configured

### **"Maps not loading"**
- OpenStreetMap tiles are free - no API key needed
- Ensure your IP isn't rate-limited
- Check browser console for errors

### **"Service worker not activating"**
- PWA requires HTTPS on production
- Clear service worker storage in DevTools → Application
- Rebuild: `pnpm build`

---

## 📞 Support

- **Docs**: See full `README.md` for comprehensive documentation
- **Clerk Help**: https://clerk.com/docs
- **Neon Help**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## 🎯 Quick Deploy Checklist

- [ ] Create Neon PostgreSQL database
- [ ] Create Clerk application
- [ ] Copy keys to environment variables
- [ ] Set `ADMIN_USER_IDS` (your Clerk user ID)
- [ ] Deploy to Vercel
- [ ] Create admin webhook in Clerk dashboard
- [ ] Test sign up flow
- [ ] Install PWA on phone (test on iOS & Android)
- [ ] Create test driver account & submit application
- [ ] Approve driver via `/admin/drivers`
- [ ] Test driver dashboard & delivery acceptance

**Total time: ~15 minutes** 🚀

---

**Need help?** Check the full [README.md](README.md) for comprehensive documentation.
