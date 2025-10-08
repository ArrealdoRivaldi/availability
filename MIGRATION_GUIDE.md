# Cell-Down Migration Guide: Firestore → Realtime Database

## Overview
This migration moves Cell-Down data from Firestore to Realtime Database to avoid quota limits and implement sequential keys for better data organization.

## Architecture Changes

### Before Migration
- **Single Firebase Project**: Availability
  - Firestore: User Management + Cell-Down data
  - Realtime Database: Availability data

### After Migration
- **Project 1**: Availability
  - Firestore: User Management only
  - Realtime Database: Availability data
- **Project 2**: Cell-Down
  - Firestore: Not used
  - Realtime Database: Cell-Down data with sequential keys

## Key Features Implemented

### 1. Sequential Keys
- New data gets sequential numeric keys (0, 1, 2, 3...)
- No more random Firebase-generated keys
- Clean, organized data structure

### 2. Dual Firebase Configuration
- Separate Firebase apps for each project
- Independent authentication and database access
- Isolated quota and billing

### 3. Data Migration Support
- Automatic sequential ID generation
- Batch upload with sequential keys
- Data integrity preservation

## Files Modified

### 1. Firebase Configuration (`src/app/firebaseConfig.ts`)
```typescript
// Dual project configuration
const availabilityApp = initializeApp(availabilityConfig);
const cellDownApp = initializeApp(cellDownConfig, 'celldown');

// Exports
export const database = getDatabase(availabilityApp); // Availability
export const cellDownDatabase = getDatabase(cellDownApp); // Cell-Down
export const auth = getAuth(availabilityApp); // Shared auth
export const db = getFirestore(availabilityApp); // User management
```

### 2. DataService (`src/app/dashboard-admin/data/cell-down/services/dataService.ts`)
- Migrated from Firestore to Realtime Database
- Added sequential key support
- Maintained all CRUD operations

### 3. UploadService (`src/app/dashboard-admin/data/cell-down/services/uploadService.ts`)
- Updated for Realtime Database
- Sequential key generation for new records
- Batch upload with proper key assignment

### 4. Dashboard (`src/app/dashboard-admin/dashboard/cell-down/page.tsx`)
- Updated data fetching from Realtime Database
- Maintained all existing functionality

## Environment Variables Required

### For Vercel Deployment (Service Account Method)
Add these environment variables in your Vercel dashboard:

```env
# Availability Project Configuration (Service Account)
AVAILABILITY_SERVICE_ACCOUNT={"type":"service_account","project_id":"availability",...}
AVAILABILITY_DATABASE_URL=https://availability-default-rtdb.asia-southeast1.firebasedatabase.app

# Cell-Down Project Configuration (Service Account)
CELLDOWN_SERVICE_ACCOUNT={"type":"service_account","project_id":"celldown",...}
CELLDOWN_DATABASE_URL=https://celldown-default-rtdb.asia-southeast1.firebasedatabase.app
```

### For Local Development (.env.local)
```env
# Availability Project Configuration (Service Account)
AVAILABILITY_SERVICE_ACCOUNT={"type":"service_account","project_id":"availability",...}
AVAILABILITY_DATABASE_URL=https://availability-default-rtdb.asia-southeast1.firebasedatabase.app

# Cell-Down Project Configuration (Service Account)
CELLDOWN_SERVICE_ACCOUNT={"type":"service_account","project_id":"celldown",...}
CELLDOWN_DATABASE_URL=https://celldown-default-rtdb.asia-southeast1.firebasedatabase.app
```

**Note**: Both service accounts should contain the full JSON content of your Firebase service account key files.

## Database Structure

### Realtime Database Structure
```
celldown-default-rtdb/
└── data_celldown/
    ├── 0/
    │   ├── week: 36
    │   ├── siteId: "SITE001"
    │   ├── cellDownName: "Cell Down Name"
    │   ├── nop: "NOP001"
    │   ├── createdAt: "2024-01-01T00:00:00.000Z"
    │   └── ...
    ├── 1/
    │   └── ...
    └── 2/
        └── ...
```

## Benefits

1. **Quota Separation**: Cell-Down has its own Realtime Database quota
2. **Sequential Keys**: Clean, organized data structure
3. **Cost Efficiency**: Realtime Database is cheaper for read/write intensive operations
4. **Data Isolation**: Cell-Down issues don't affect Availability system
5. **Better Performance**: Realtime Database optimized for real-time updates

## Migration Steps Completed

✅ Updated Firebase configuration for dual projects
✅ Migrated DataService to Realtime Database
✅ Updated UploadService with sequential key support
✅ Modified dashboard to use Realtime Database
✅ Created environment variables template
✅ Maintained all existing functionality

## Next Steps

1. **Add Service Accounts to Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `AVAILABILITY_SERVICE_ACCOUNT` with the full JSON content of your availability service account
   - Add `AVAILABILITY_DATABASE_URL` with your availability Realtime Database URL
   - Add `CELLDOWN_SERVICE_ACCOUNT` with the full JSON content of your cell-down service account
   - Add `CELLDOWN_DATABASE_URL` with your cell-down Realtime Database URL

2. **For Local Development**:
   - Add the same variables to your `.env.local` file

3. **Remove Old Environment Variables** (if any):
   - Remove all `NEXT_PUBLIC_FIREBASE_*` variables as they're no longer needed
   - Only keep the 4 service account variables above

4. **Test the application** with the new configuration
5. **Verify data migration** is working correctly
6. **Monitor quota usage** for both projects

## Notes

- All existing functionality is preserved
- Sequential keys start from 0 and increment automatically
- Data migration from Firestore to Realtime Database should be done manually
- Authentication remains shared between projects
- User management stays in the original Firestore
