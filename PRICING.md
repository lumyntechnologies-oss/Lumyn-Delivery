# Pricing System Documentation

## Overview

Lumyn Delivery uses a **distance-based pricing model** with configurable multipliers for priority levels.

---

## 📐 Calculation Formula

```
Total Cost = (Base Fare + (Distance × Cost Per Km)) × Priority Multiplier
```

**Default Rates (Kenya Shillings - KES):**
- Base Fare: KSh 500
- Per KM: KSh 50/km
- Minimum Fare: KSh 800

### Example Calculations

| Distance | Priority | Calculation | Total |
|----------|----------|-------------|-------|
| 5 km | Normal | (500 + 5×50) × 1.0 | **KSh 750** |
| 10 km | Normal | (500 + 10×50) × 1.0 | **KSh 1,000** |
| 10 km | High | (500 + 10×50) × 1.3 | **KSh 1,300** |
| 10 km | Urgent | (500 + 10×50) × 1.5 | **KSh 1,500** |
| 2 km | Low | (500 + 2×50) × 0.9 = 630 | **KSh 800** (min fare applies) |

---

## 🎯 Priority Multipliers

| Priority | Multiplier | When to Use |
|----------|------------|-------------|
| **LOW** | 0.9 × | Non-urgent, flexible timing |
| **NORMAL** | 1.0 × | Standard delivery |
| **HIGH** | 1.3 × | Same-day delivery, important |
| **URGENT** | 1.5 × | ASAP, emergency delivery |

---

## 🔧 How It Works (Technical)

### User Flow
1. User creates saved addresses with coordinates (latitude/longitude)
2. In "New Delivery" form, user selects pickup & dropoff addresses
3. System calculates distance using Haversine formula
4. Cost is auto-computed and displayed in preview card
5. User can adjust priority which recalculates cost
6. Cost field is populated but still editable
7. Final cost sent to backend with delivery creation

### Code Implementation

**`lib/pricing.ts`** - Core pricing utilities:
```typescript
export function calculateDeliveryCost(
  distanceKm: number,
  priority: string = 'NORMAL'
): number {
  const baseFare = 500
  const costPerKm = 50
  const minimumFare = 800

  let cost = baseFare + (distanceKm * costPerKm)
  cost *= priorityMultiplier[priority]
  return Math.max(cost, minimumFare)
}

export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  // Haversine formula - returns km
}
```

**`app/new-delivery/page.tsx`** - Live calculation:
```typescript
useEffect(() => {
  if (pickup && dropoff coordinates exist) {
    const distance = calculateDistance(pickup, dropoff)
    const cost = calculateDeliveryCost(distance, priority)

    setCalculatedDistance(distance)
    setAutoCost(cost)
    setFormData(prev => ({ ...prev, cost: cost.toFixed(2) }))
  }
}, [pickupId, dropoffId, addresses, priority])
```

---

## 📊 Admin Configuration

### Current Implementation

Pricing is currently hardcoded in `lib/pricing.ts`:
```typescript
const DEFAULT_PRICING = {
  baseFare: 500,
  costPerKm: 50,
  minimumFare: 800,
  priorityMultiplier: { NORMAL: 1, URGENT: 1.5, HIGH: 1.3, LOW: 0.9 }
}
```

### Future: Dynamic Pricing Rules

In a future update, admins will be able to configure pricing via the admin dashboard:

**Database Model:**
```prisma
model PricingRule {
  id                String
  name              String      // "Standard rates"
  baseFare          Float
  costPerKm         Float
  minimumFare       Float
  priorityMultiplier Json      // JSON object with multipliers
  vehicleType       String?     // null = all, or "motorcycle", "truck", etc.
  active            Boolean     @default(true)
}
```

**Admin API:**
- `GET /api/admin/pricing` - List pricing rules
- `POST /api/admin/pricing` - Create rule
- `PATCH /api/admin/pricing/[id]` - Update rule
- `DELETE /api/admin/pricing/[id]` - Delete rule

**Features:**
- Different rates per vehicle type (motorcycle cheaper than truck)
- Time-based pricing (peak hour surcharge)
- Zone-based pricing (different rates per city/region)
- Surge pricing during high demand

---

## 🗺️ Distance Calculation

**Method:** Haversine formula

**Formula:**
```javascript
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c
// R = 6371 km (Earth radius)
```

**Used in:**
- Auto-assignment (`/api/assignments/auto`) - finds nearest driver
- Delivery cost calculation (`app/new-delivery/page.tsx`)
- ETA estimation (`/api/driver/status/[deliveryId]`) - assumes avg 30km/h

**Accuracy:** ±0.3% error (good enough for pricing)

---

## 💰 Payment Flow

1. **Customer** selects addresses → sees live cost estimate
2. Creates delivery → cost saved in `Delivery.cost`
3. Payment initiated via Pesapal
4. Webhook confirms payment → `Delivery.paymentStatus = PAID`
5. **Driver** completes delivery
6. System calculates driver payout: `cost × platformCut%`
7. Driver earns money!

---

## 📈 Future Enhancements

### Phase 1 (Immediate)
- [ ] Allow admin to set pricing in admin dashboard
- [ ] Display pricing breakdown in confirmation modal
- [ ] Save estimated distance in delivery record

### Phase 2 (Scale)
- [ ] Dynamic surge pricing based on demand
- [ ] Different rates for different vehicle types
- [ ] Zone-based pricing (city centers vs outskirts)
- [ ] Volume discounts (multiple deliveries)

### Phase 3 (Advanced)
- [ ] AI-based pricing prediction
- [ ] Time-of-day pricing
- [ ] Weather-based surcharge
- [ ] Driver bidding system (auction pricing)

---

## 🧮 Testing the Calculator

**Test Case 1: Short Distance**
```
Pickup: Nairobi CBD (lat: -1.2921, lon: 36.8219)
Dropoff: Westlands (lat: -1.2625, lon: 36.8141)
Distance: ~3.3 km
Expected Cost: (500 + 3.3×50) = 665 → 800 (min fare applies)
```

**Test Case 2: Long Distance**
```
Pickup: Nairobi CBD
Dropoff: Juja (lat: -1.1000, lon: 37.0167)
Distance: ~22 km
Expected Cost: (500 + 22×50) = 1,600
Priority URGENT: 1,600 × 1.5 = 2,400
```

**Test Case 3: Medium Distance**
```
Pickup: Karen (lat: -1.3167, lon: 36.7000)
Dropoff: Embakasi (lat: -1.3167, lon: 36.8833)
Distance: ~14.3 km
Expected Cost: (500 + 14.3×50) = 1,215
Priority HIGH: 1,215 × 1.3 = 1,579.50
```

---

## ⚠️ Edge Cases & Validation

| Scenario | Behavior |
|----------|----------|
| Distance = 0 (same location) | Minimum fare applied, validation warning: "Addresses are too close" |
| No coordinates on addresses | Show warning: "Cannot calculate distance - add location data" |
| Customer manually edits cost | Allowed, but flagged for admin review if significantly different |
| Negative distance (invalid coords) | Error: "Invalid coordinates" |
| Very long distance (>100km) | Warning: "Long distance - confirm cost" |

---

## 📱 Mobile UI/UX

**PWA Display:**
```
┌─────────────────────────────┐
│  Cost Estimate              │
│  ─────────────────────────  │
│  • 5.2 km                   │
│  • ~10 min                   │
│                             │
│  Base fare      KSh 500.00   │
│  Distance (5.2km) KSh 260.00 │
│  Priority (Normal) ×1.0     │
│                             │
│  TOTAL          KSh 760.00   │
│                             │
│  ℹ Cost auto-calculates     │
└─────────────────────────────┘
```

**Button states:**
- Disabled until addresses selected
- Shows loading spinner during calculation
- Shows final cost in button: `"Create Delivery — KSh 760.00"`

---

## 🔐 Security & Validation

**Server-side validation:**
- Cost cannot exceed 10x calculated amount (anti-tampering)
- Distance must be positive number
- Priority must be valid enum value

**Backend verification (in `/api/deliveries`):**
```typescript
// Verify cost is reasonable (optional but recommended)
const expectedCost = calculateCost(distance, priority)
if (Math.abs(parsedCost - expectedCost) > expectedCost * 0.5) {
  // Flag for review
}
```

---

## 🎛️ Configuration Options

To change default rates, edit `lib/pricing.ts`:

```typescript
const DEFAULT_PRICING = {
  baseFare: 800,        // Increase base
  costPerKm: 75,        // Higher per-km rate
  minimumFare: 1000,    // Raise minimum
  priorityMultiplier: {
    NORMAL: 1,
    URGENT: 2.0,       // Double for urgent
    HIGH: 1.5,
    LOW: 0.8,
  }
}
```

---

**Last Updated:** April 23, 2026  
**Version:** 1.0 (Automatic distance-based pricing)
