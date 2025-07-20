# Firebase Firestore Index Setup

## Issue
The application is encountering a Firestore index error when querying orders by email and ordering by creation date:

```
FirebaseError: [code=failed-precondition]: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/lazy-bread-web/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9sYXp5LWJyZWFkLXdlYi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvb3JkZXJzL2luZGV4ZXMvXxABGgkKBWVtYWlsEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

## Solution

### Option 1: Create the Index (Recommended)
1. Click the link in the error message above, or
2. Go to [Firebase Console](https://console.firebase.google.com)
3. Select your project: `lazy-bread-web`
4. Go to Firestore Database → Indexes
5. Click "Create Index"
6. Configure the index:
   - **Collection ID**: `orders`
   - **Fields to index**:
     - `email` (Ascending)
     - `createdAt` (Descending)
   - **Query scope**: Collection
7. Click "Create"

The index will take a few minutes to build. Once complete, the error will be resolved.

### Option 2: Use Alternative Query (Temporary)
The application already has a fallback that doesn't require the index. This will work immediately but may be slower for large datasets.

## Why This Index is Needed
Firestore requires composite indexes when you:
- Filter by one field (`email`)
- Order by another field (`createdAt`)

This is a Firestore limitation to ensure query performance.

## Current Status
- ✅ Application has fallback query implemented
- ✅ Error handling gracefully switches to fallback
- ⏳ Index creation needed for optimal performance

## Testing
After creating the index:
1. Wait for the index to finish building (check Firebase Console)
2. Refresh the dashboard page
3. Orders should load without errors
4. Check browser console for "Index ready" message 