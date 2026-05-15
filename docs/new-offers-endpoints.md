# New Offers Endpoints - Documentation

## Summary
Do naye endpoints add kiye gaye hain end users ke liye offers dikhane ke liye:

---

## 1. GET /offers
**Description:** Saare active offers ki list

**Response:**
```json
{
  "offers": [
    {
      "id": "uuid",
      "title": "Offer title",
      "description": "Offer description",
      "type": "2-for-1 | discount | freebie | guestlist",
      "venue": {
        "id": "uuid",
        "name": "Venue name",
        "address": "Area, City",
        "category": "bar | club | restaurant..."
      },
      "validDays": ["Mon", "Tue", ...],
      "validTimeStart": "17:00",
      "validTimeEnd": "19:00",
      "savingValue": 10,
      "currency": "GBP",
      "status": "active | inactive | expired | upcoming",
      "isActive": true,
      "isAvailableNow": true,
      "expiresAt": "2026-12-31T00:00:00.000Z"
    }
  ],
  "count": 21
}
```

**Test Result:** ✅ Pass - 21 offers returned

---

## 2. GET /venues/:id/offers
**Description:** Kisi specific venue ke saare offers

**Parameters:**
- `id` (path) - Venue UUID

**Response:**
```json
{
  "venue": {
    "id": "uuid",
    "name": "Warehouse Project",
    "address": "Mayfield Depot, London Road",
    "city": "Manchester"
  },
  "offers": [
    {
      "id": "uuid",
      "title": "Guestlist Open Now",
      "description": "Skip the queue — guaranteed entry before midnight",
      "type": "guestlist",
      "validDays": ["Fri", "Sat"],
      "validTimeStart": "22:00",
      "validTimeEnd": "02:00",
      "savingValue": 15,
      "currency": "GBP",
      "status": "upcoming",
      "isActive": true,
      "isAvailableNow": false,
      "expiresAt": "2026-12-31T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "Venue not found"
  },
  "statusCode": 404
}
```

**Test Results:**
- ✅ Valid venue ID - Returns offers
- ✅ Invalid venue ID - Returns 404 error

---

## Features

### Offer Status
- `active` - Offer abhi available hai
- `inactive` - Offer off hai ya valid time nahi hai
- `expired` - Offer expire ho gaya
- `upcoming` - Offer aaj valid hai lekin time abhi nahi hua

### Offer Availability
- `isAvailableNow` - Boolean flag jo batata hai ke offer RIGHT NOW claim ho sakta hai
- Yeh check karta hai: active status, valid day, valid time, max redemptions

### Enriched Data
- Venue details included
- Saving value in GBP
- Status calculation
- Real-time availability check

---

## Code Changes

### Files Modified:
1. `offers.controller.ts` - Added GET /offers endpoint
2. `offers.service.ts` - Added findAll() method
3. `venues.controller.ts` - Added GET /venues/:id/offers endpoint
4. `venues.module.ts` - Imported OffersModule

### Files Created:
1. `test-scripts/test-offers-endpoints.js` - Test script

---

## Testing Summary

| Endpoint | Test Case | Result |
|----------|-----------|--------|
| GET /offers | Fetch all offers | ✅ Pass (21 offers) |
| GET /venues/:id/offers | Valid venue (Warehouse) | ✅ Pass (1 offer) |
| GET /venues/:id/offers | Valid venue (Alchemist) | ✅ Pass (1 offer, active) |
| GET /venues/:id/offers | Invalid venue ID | ✅ Pass (404 error) |

---

## Usage Examples

### Frontend Integration

```typescript
// Get all offers
const response = await fetch('http://localhost:3000/offers');
const { offers, count } = await response.json();

// Get venue-specific offers
const venueId = '5857bda3-0361-4e1c-a35e-6035d148bca2';
const response = await fetch(`http://localhost:3000/venues/${venueId}/offers`);
const { venue, offers, count } = await response.json();

// Filter available offers
const availableOffers = offers.filter(o => o.isAvailableNow);
```

---

## Notes

- Sirf active offers return hote hain (isActive: true)
- Offers venue details ke saath aate hain
- Status aur availability real-time calculate hoti hai
- Cache TTL: 120 seconds
- Error handling properly implemented

---

**Date:** 2026-05-12
**Status:** ✅ Completed & Tested
