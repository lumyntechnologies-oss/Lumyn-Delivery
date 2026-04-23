# Lumyn Delivery

**A modern, full-stack delivery management platform with advanced driver onboarding, real-time tracking, and seamless PWA mobile experience.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat&logo=prisma)
![Clerk](https://img.shields.io/badge/Clerk-Auth-4D6BFE?style=flat&logo=clerk)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.2-38BDF8?style=flat&logo=tailwindcss)

---

## 📱 Mobile App (PWA)

Lumyn Delivery is a **Progressive Web App** - install it on your phone like a native app:

### **Installation**
1. Open the app on your phone: `https://your-domain.vercel.app`
2. Look for **"Add to Home Screen"** or **"Install App"** in browser menu
3. Tap to install - app icon appears on home screen
4. Launch fullscreen, works offline!

### **PWA Features**
- ✅ Works offline (caches pages & data)
- ✅ Push notifications for delivery updates
- ✅ Camera access for document upload
- ✅ GPS location for driver tracking
- ✅ Home screen icon with splash screen
- ✅ Automatic updates (no app store review needed)

---

## ✨ Key Features

### **For Customers**
- 📦 Create delivery requests with pickup/dropoff addresses
- 📍 Real-time delivery tracking on live map
- 💬 In-app messaging with drivers
- ⭐ Rate and review drivers
- 💳 Secure payment integration (Pesapal)
- 📱 Install as mobile app (PWA)

### **For Drivers**
- 🚗 Comprehensive onboarding flow (license, vehicle, documents)
- 📋 Document upload (ID, license, registration, insurance)
- ✅ Admin verification workflow with email notifications
- 🗺️ Accept deliveries with live route tracking
- 📊 Earnings dashboard with stats
- 🔔 Push notifications for new assignments
- 📱 Mobile-first responsive design

### **For Admins**
- 👥 User management (customers, drivers, admins)
- 🚗 Driver verification dashboard with document review
- 📈 Analytics and revenue tracking
- 📋 Delivery monitoring & management
- ✅ Approve/reject driver applications with email notifications

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js 16    │ (App Router, Server Components)
├─────────────────┤
│   Clerk Auth    │ (Authentication & user management)
├─────────────────┤
│    Prisma ORM   │ (PostgreSQL via Neon)
├─────────────────┤
│   PWA / SW      │ (Offline support, caching)
└─────────────────┘
```

### **Tech Stack**
- **Frontend**: React 19, Next.js 16, Tailwind CSS 4, shadcn/ui components
- **Auth**: Clerk (OAuth, SSO, webhooks)
- **Database**: PostgreSQL (Neon - serverless)
- **ORM**: Prisma (type-safe DB access)
- **PWA**: @ducanh2912/next-pwa (service worker, install prompts)
- **Maps**: Leaflet + OpenStreetMap (address picking, live tracking)
- **Payments**: Pesapal (M-Pesa, cards, bank transfers)
- **Email**: Resend (transactional emails)
- **Push**: Web Push API (browser notifications)
- **Hosting**: Vercel (recommended)

---

## 📁 Project Structure

```
lumyn-delivery/
├── app/
│   ├── (auth)/              # Auth pages (sign-in, sign-up)
│   │   ├── sign-in/[[...sign-in]]/
│   │   └── sign-up/[[...sign-up]]/
│   ├── admin/               # Admin dashboard
│   │   ├── page.tsx         # Main admin dashboard
│   │   ├── drivers/         # Driver management & verification
│   │   ├── users/           # User management
│   │   └── deliveries/      # Delivery management
│   ├── api/                 # API routes (REST)
│   │   ├── admin/
│   │   │   ├── drivers/     # Admin driver endpoints
│   │   │   └── analytics/   # Admin analytics
│   │   ├── drivers/
│   │   │   ├── apply/       # Driver application submission
│   │   │   ├── profile/     # Driver profile data
│   │   │   └── [id]/        # Admin driver updates
│   │   ├── upload/          # Document upload handler
│   │   ├── deliveries/      # Delivery CRUD
│   │   ├── addresses/       # Address management
│   │   ├── payments/        # Pesapal integration
│   │   └── webhooks/
│   │       └── clerk/       # Clerk webhook handler
│   ├── become-driver/       # Legacy driver registration
│   ├── driver-dashboard/    # Driver main dashboard
│   ├── driver-onboarding/   # NEW multi-step driver onboarding
│   ├── deliveries/          # Customer delivery list
│   ├── new-delivery/        # Create delivery (map picker)
│   └── profile/             # User profile
├── components/
│   ├── maps/
│   │   ├── address-picker.tsx   # Interactive map for address selection
│   │   └── live-map.tsx         # Real-time delivery tracking map
│   ├── ui/                    # shadcn/ui components (Button, Card, Input, etc.)
│   └── navbar.tsx             # Main navigation
├── hooks/
│   ├── useDriverLocationTracking.ts  # Real-time GPS updates
│   ├── useRealtimeDelivery.ts        # WebSocket delivery tracking
│   └── usePushNotifications.ts       # Push notification management
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── auth.ts              # Clerk auth helpers
│   ├── notifications/
│   │   ├── email.ts         # Resend email templates (driver approval/rejection)
│   │   ├── push.ts          # Web push notifications
│   │   ├── sms.ts           # SMS notifications (Twilio)
│   │   └── notifier.ts      # Unified notification dispatcher
│   ├── payments/
│   │   └── pesapal.ts       # Pesapal payment integration
│   └── api-response.ts      # Standardized API response helpers
├── prisma/
│   └── schema.prisma        # Database schema (User, Delivery, Address, etc.)
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker (auto-generated by next-pwa)
│   ├── icons/              # PWA icons (192x192, 512x512)
│   └── offline.html        # Offline fallback page
├── next.config.mjs         # Next.js config with PWA plugin
├── tailwind.config.ts      # Tailwind configuration
└── package.json
```

---

## 🚀 Quick Start

### **Clone & Install**
```bash
git clone <your-repo-url>
cd lumyn-delivery
pnpm install
```

### **Environment Variables**

Create `.env.local`:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Admin Access (comma-separated Clerk user IDs)
ADMIN_USER_IDS=user_123,user_456

# Optional: Resend API key for emails
RESEND_API_KEY=re_xxx

# Optional: VAPID keys for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### **Database Setup**
```bash
# Push Prisma schema to Neon
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Optional: seed database with test data
npx prisma db seed
```

### **Clerk Setup**
1. Sign up at https://clerk.com
2. Create a new application
3. Configure authentication methods (Email, Google, etc.)
4. Set up webhook:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
5. Get your API keys → add to `.env.local`
6. Add admin users by copying their Clerk User ID to `ADMIN_USER_IDS`

### **Run Development Server**
```bash
pnpm dev
# Open http://localhost:3000
```

---

## 🔄 Installation & Deployment

### **Deploy to Vercel (1-Click)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo)

1. Push to GitHub
2. Click "Deploy with Vercel" button above
3. Add environment variables in Vercel dashboard
4. Deploy! (PWA automatically built)

### **Deploy to Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway link
railway deploy
```

### **Deploy to AWS EC2 / DigitalOcean**
```bash
# Build production app
pnpm build

# Start production server
pnpm start

# Use PM2 for process management
pm2 start "pnpm start" --name lumyn-delivery
```

---

## 📱 Mobile App Installation Guide

### **For End Users**
Your customers and drivers install the app as a PWA:

**iOS (Safari):**
1. Open `https://your-app.vercel.app` in Safari
2. Tap Share button (⬆️)
3. Scroll down → "Add to Home Screen"
4. App icon appears on home screen

**Android (Chrome):**
1. Open URL in Chrome
2. Tap 3-dots menu (⋮)
3. Tap "Add to Home screen"
4. Confirm "Add" → icon on home screen

**Desktop (Chrome/Edge):**
1. Visit site → install icon appears in address bar (right side)
2. Click icon → "Install" → desktop shortcut created

### **For Developers (Testing PWA Locally)**
```bash
# Build and start production server
pnpm build
pnpm start

# On mobile (same WiFi), visit:
http://192.168.1.X:3000  # Your computer's IP

# Chrome will show install prompt after a few seconds
```

**Note:** PWA install prompt requires HTTPS on production. Use `ngrok` for local HTTPS testing:
```bash
ngrok http 3000
# Use the https://xxx.ngrok.io URL on your phone
```

---

## 🔐 Authentication & Roles

### **Role-Based Access Control (RBAC)**

| Role | Permissions |
|------|------------|
| **CUSTOMER** | Create deliveries, track packages, rate drivers |
| **DRIVER** | View assigned deliveries, update status, track earnings |
| **ADMIN** | Full system access, driver verification, analytics |

### **Clerk Webhook Integration**

The webhook at `/api/webhooks/clerk` automatically:
- Creates user in database when signing up (`user.created`)
- Updates user email/name on changes (`user.updated`)
- Soft-deletes user on account deletion (`user.deleted`)

---

## 🚗 Driver Onboarding Flow

```mermaid
graph TD
    A[Sign Up as Driver] --> B[6-Step Onboarding Wizard]
    B --> C[Step 1: License Info]
    C --> D[Step 2: Vehicle Details]
    D --> E[Step 3: Upload Documents]
    E --> F[Step 4: Review & Confirm]
    F --> G[Submit Application]
    G --> H[Status: SUBMITTED]
    H --> I[Admin Reviews Documents]
    I --> J{Approved?}
    J -->|Yes| K[Status: APPROVED<br/>Email Sent]
    J -->|No| L[Status: REJECTED<br/>Email with Reason]
    K --> M[Driver Can Go Online]
```

**Detailed Steps:**

1. **License Information**
   - License number
   - Expiry date (validated)
   
2. **Vehicle Information**
   - Type (sedan, SUV, truck, van, motorcycle, bicycle, scooter)
   - Make, model, year, plate, color
   
3. **Document Upload** (all required)
   - National ID Card (front & back)
   - Driver's License (front)
   - Vehicle Registration
   - Insurance Certificate
   - Profile Photo
   
4. **Review & Submit**
   - Verify all information
   - Submit for admin review
   
5. **Admin Verification** (via `/admin/drivers`)
   - Admin views all uploaded documents
   - Approve or reject with reason
   - Email notification sent automatically
   
6. **Complete**
   - Approved drivers can go online
   - Rejected drivers can re-apply after fixing issues

---

## 📊 Distance Calculation

**Distance is automatically calculated using the Haversine formula:**

```typescript
// Used in: app/api/assignments/auto/route.ts
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}
```

**Where distance is used:**
1. **Auto-assignment** (`/api/assignments/auto`) - Finds nearest available driver to pickup location
2. **Delivery metadata** - Stored in `delivery.distance` field
3. **ETA calculation** (`/api/driver/status/[deliveryId]`) - Estimates arrival time: `estimatedTime = (distance / 30km/h) * 60`

---

## 💰 Payment Integration

**Pesapal Integration** (Kenya, Uganda, Tanzania, Zambia)

### **Flow:**
1. Customer creates delivery → cost is set
2. Payment initiated via `/api/payments` (POST)
3. Backend creates Pesapal payment order
4. Customer redirected to Pesapal checkout
5. Payment confirmed via IPN webhook (`/api/payments/pesapal/ipn`)
6. Delivery status updated to `PAID`
7. Driver payout scheduled after completion

### **Supported Methods:**
- M-Pesa (Kenya, Tanzania)
- Credit/Debit cards
- Bank transfers
- Mobile money (various providers)

---

## 🔔 Notifications

Triple-channel notification system:

| Channel | When | Library |
|---------|------|---------|
| **Push** | Assignment, status changes, messages | `web-push` + service worker |
| **Email** | Application approved/rejected, delivery updates | Resend API |
| **SMS** | (Planned) Critical updates, OTP | Twilio |

---

## 🗺️ Maps & Geocoding

**OpenStreetMap + Nominatim**
- Free, no API key required
- Address picking via `AddressPicker` component
- Reverse geocoding (lat/lng → address)
- Live delivery tracking map (`LiveMap` component)

---

## 🧪 Testing

```bash
# Run lint
pnpm lint

# Type checking
pnpm type-check

# Database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Reset database (WARNING: deletes data)
npx prisma migrate reset
```

---

## 🐛 Troubleshooting

### **PWA Not Installing**
- ❌ Ensure HTTPS (required for service workers on production)
- ❌ Check manifest loads: `https://your-domain.com/manifest.json`
- ❌ Check service worker: `https://your-domain.com/sw.js`
- ✅ Clear browser cache
- ✅ Use Chrome/Edge/Safari 16.4+

### **Webhook Not Firing**
- Verify webhook URL in Clerk dashboard
- Check `CLERK_WEBHOOK_SECRET` matches
- View webhook logs in Clerk dashboard
- Test locally with ngrok: `ngrok http 3000`

### **Maps Not Loading**
- Check browser console for CORS errors
- Ensure tiles URL is accessible (OpenStreetMap)
- Add Google Maps API key if switching providers

### **Email Not Sending**
- Verify `RESEND_API_KEY` is valid
- Check Resend dashboard for sent/attempted emails
- Ensure `from` domain is verified in Resend

---

## 📈 Roadmap

**Phase 1 - Core (✅ Complete)**
- [x] Customer delivery creation
- [x] Driver assignment & tracking
- [x] Admin dashboard
- [x] PWA mobile app
- [x] Email notifications

**Phase 2 - Enhanced Onboarding (✅ Complete)**
- [x] Multi-step driver registration
- [x] Document upload system
- [x] Admin verification workflow
- [x] Email notifications for drivers

**Phase 3 - Advanced (🔜 Up Next)**
- [ ] Real-time chat between customers & drivers
- [ ] In-app payment (Pesapal SDK integration)
- [ ] Driver earnings & payout dashboard
- [ ] Referral system
- [ ] Multi-language support
- [ ] Driver availability scheduling
- [ ] Delivery zones & surge pricing
- [ ] Fleet management (multiple vehicles per driver)

**Phase 4 - Scale**
- [ ] Multi-city support
- [ ] Warehouse/fulfillment center features
- [ ] Bulk delivery uploads (CSV)
- [ ] Advanced analytics & reporting
- [ ] Driver mobile app (React Native / Capacitor)
- [ ] Apple/Google app store deployment

---

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Fork & clone
git clone https://github.com/your-username/lumyn-delivery.git
cd lumyn-delivery

# Create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m "Add amazing feature"

# Push
git push origin feature/amazing-feature

# Open PR
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- 📧 Email: support@lumyn-delivery.com
- 📖 Documentation: [docs.lumyn-delivery.com](https://docs.lumyn-delivery.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discord: [Join our community](https://discord.gg/lumyn)

---

## 🙏 Acknowledgments

- Built with [v0](https://v0.dev) by Vercel
- Auth by [Clerk](https://clerk.com)
- Database by [Neon](https://neon.tech) & [Prisma](https://prisma.io)
- Hosting by [Vercel](https://vercel.com)
- Icons by [Lucide](https://lucide.dev)
- UI components by [shadcn/ui](https://ui.shadcn.com)

---

**Made with ❤️ by Lumyn Technologies Team**
