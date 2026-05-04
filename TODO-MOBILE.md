# Lumyn Delivery Mobile App (Expo RN) Completion Plan

## Current Status
- Capacitor APK: ✅ Production-ready
- Expo RN: 🟡 70% scaffold (nav, maps, API basics)
- Goal: Full native app using web /api/* endpoints

## Step-by-Step Implementation (Mark [x] when done)

### Phase 1: Dependencies & Auth (Today)
- [x] 1. Add Clerk Expo + auth deps to mobile/package.json
- [x] 2. Create mobile/hooks/useAuth.ts (Clerk hooks + token)
- [x] 3. Create mobile/api/client.ts (axios/fetch w/ auth interceptor)
- [x] 4. Update mobile/App.tsx (ClerkProvider + auth guard)
- [x] 5. `cd mobile && npm install` (running)

### Phase 2: Core Screens (Day 1-2)
- [x] 6. mobile/screens/Auth/Login.tsx (Clerk sign-in)
- [x] 7. mobile/screens/Auth/SignUp.tsx (Clerk + role picker)

- [ ] 8. mobile/screens/NewDelivery.tsx (form + /api/pricing calc)
- [ ] 9. mobile/screens/DriverOnboarding.tsx (wizard + /api/cloudinary-upload)
- [ ] 10. Enhance DeliveriesScreen (auth + full list w/ /api/deliveries)

### Phase 3: Driver Flows (Day 3)
- [ ] 11. mobile/screens/DriverDashboard.tsx (full w/ assignments /api/assignments)
- [ ] 12. mobile/screens/DeliveryDetails.tsx (/api/deliveries/[id] + accept)
- [ ] 13. Integrate /api/sse for real-time updates

### Phase 4: Polish & Build (Day 4)
- [ ] 14. UI polish (match web shadcn/tailwind)
- [ ] 15. Error handling + offline
- [ ] 16. `expo doctor && npx expo run:android`
- [ ] 17. `eas build --platform all`
- [ ] 18. Update MOBILE_APP_SETUP.md

**Progress: 0/18 steps**

**Next Step**: Phase 1 #1 - Update package.json

