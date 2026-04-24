# Remaining Tasks from TODO.md - To Implement

## 🐛 Known Issues & Technical Debt (All need fixing)

- [ ] Real-time tracking uses polling, not WebSockets (needs upgrade)
  - **Status**: Created SSE system, need to replace polling in driver dashboard
  - **File**: app/driver-dashboard/page.tsx (line 99: setInterval)
  
- [ ] Document upload stores on local filesystem (should use S3/Cloudinary)
  - **Status**: Created Cloudinary route, need to switch from local /api/upload
  - **Files**: app/driver-onboarding/page.tsx, app/api/upload/route.ts

- [ ] No rate limiting on API endpoints
  - **Status**: Created rate limit lib, need to apply to routes
  - **Files**: All API routes, especially /api/deliveries, /api/upload, /api/drivers/apply

- [ ] Password reset not implemented for Clerk
  - **Status**: Not started
  - **Files**: Need password reset page

- [ ] Mobile menu UX could be improved
  - **Status**: Not started
  - **Files**: components/navbar.tsx

- [ ] No input validation on some forms
  - **Status**: Created Zod schemas, need to apply universally
  - **Files**: All API routes and forms

- [ ] Driver location tracking needs optimization (battery drain)
  - **Status**: Not started
  - **Files**: hooks/useDriverLocationTracking.ts

---

## 📝 API Endpoints to Add (From Notes section)

- [ ] POST /api/pricing/calculate - calculate delivery cost (expose as API)
- [x] GET /api/driver/earnings - driver earnings report ✅ DONE
- [ ] POST /api/chat/send - send chat message
- [ ] POST /api/driver/payout - request payout
- [ ] GET /api/admin/reports/driver - admin driver reports

---

## 🎯 Additional Missing Features from Future Sections

### Communication (Priority)
- [ ] Two-way driver-customer chat
- [ ] Push notification system for deliveries (partially done, need to send on status changes)

### Admin Features
- [ ] Driver earnings reports (admin view)
- [ ] Admin pricing settings page (to configure rates)

### Technical
- [ ] Redis caching implementation
- [ ] Database indexes for performance

---

## 📋 Implementation Order

### PHASE 1: Critical Security & Validation (MUST DO)
1. [x] Apply Zod validation to ALL API routes ✅
2. [x] Implement rate limiting on sensitive endpoints ✅
3. [x] Switch document upload to Cloudinary ✅
4. [ ] Add password reset flow

### PHASE 2: Real-Time & Performance
5. [ ] Replace polling with SSE in driver dashboard
6. [ ] Optimize driver location tracking (reduce frequency)
7. [ ] Add Redis caching for hot data (optional)

### PHASE 3: Missing Core Features
8. [ ] Driver earnings payout request
9. [ ] Admin pricing settings page
10. [ ] Admin driver earnings reports

### PHASE 4: Nice-to-Have
11. [ ] Mobile menu improvements
12. [ ] Chat system (future phase)
