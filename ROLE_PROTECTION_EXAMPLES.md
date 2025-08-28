# Role-Based Page Protection Examples

Berikut adalah contoh cara menerapkan role-based protection untuk berbagai halaman di dashboard.

## 1. Halaman Khusus Super Admin

### User Management (Sudah Diterapkan)
```typescript
// src/app/dashboard-admin/user-management/page.tsx
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

export default function UserManagement() {
  // ... component logic ...
  
  return (
    <SuperAdminGuard>
      <PageContainer>
        {/* Halaman content */}
      </PageContainer>
    </SuperAdminGuard>
  );
}
```

### Halaman Logs (Perlu Diterapkan)
```typescript
// src/app/dashboard-admin/logs/Availability/page.tsx
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

export default function AvailabilityLogs() {
  return (
    <SuperAdminGuard>
      <PageContainer>
        {/* Halaman logs */}
      </PageContainer>
    </SuperAdminGuard>
  );
}
```

### Halaman CRUD (Perlu Diterapkan)
```typescript
// src/app/dashboard-admin/crud/Availability/page.tsx
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

export default function AvailabilityCRUD() {
  return (
    <SuperAdminGuard>
      <PageContainer>
        {/* Halaman CRUD */}
      </PageContainer>
    </SuperAdminGuard>
  );
}
```

## 2. Halaman untuk Admin dan Super Admin

### Halaman Approval (Perlu Diterapkan)
```typescript
// src/app/dashboard-admin/approval/Availability/page.tsx
import { RoleGuard } from '@/components/RoleGuard';

export default function AvailabilityApproval() {
  return (
    <RoleGuard allowedRoles={['admin', 'super_admin']}>
      <PageContainer>
        {/* Halaman approval */}
      </PageContainer>
    </RoleGuard>
  );
}
```

## 3. Halaman untuk Semua Role (Admin, Guest, Super Admin)

### Halaman Dashboard (Sudah Aman - Diterapkan di MenuItems)
```typescript
// src/app/dashboard-admin/dashboard/Availability/page.tsx
// Tidak perlu guard tambahan karena sudah difilter di sidebar
export default function AvailabilityDashboard() {
  return (
    <PageContainer>
      {/* Halaman dashboard - accessible by all authenticated users */}
    </PageContainer>
  );
}
```

### Halaman Data (Sudah Aman - Diterapkan di MenuItems)
```typescript
// src/app/dashboard-admin/data/Availability/page.tsx
// Tidak perlu guard tambahan karena sudah difilter di sidebar
export default function AvailabilityData() {
  return (
    <PageContainer>
      {/* Halaman data - accessible by all authenticated users */}
    </PageContainer>
  );
}
```

## 4. Menggunakan Higher-Order Components (HOC)

### Dengan withSuperAdmin
```typescript
// src/app/dashboard-admin/logs/cell-down/page.tsx
import { withSuperAdmin } from '@/components/SuperAdminGuard';

function CellDownLogs() {
  return (
    <PageContainer>
      {/* Halaman logs cell down */}
    </PageContainer>
  );
}

export default withSuperAdmin(CellDownLogs);
```

### Dengan withRole
```typescript
// src/app/dashboard-admin/approval/cell-down/page.tsx
import { withRole } from '@/components/RoleGuard';

function CellDownApproval() {
  return (
    <PageContainer>
      {/* Halaman approval cell down */}
    </PageContainer>
  );
}

export default withRole(CellDownApproval, ['admin', 'super_admin']);
```

## 5. Halaman yang Perlu Dilindungi

### Halaman yang Hanya untuk Super Admin:
- ✅ User Management (sudah diterapkan)
- ❌ Logs (perlu diterapkan)
- ❌ CRUD (perlu diterapkan)

### Halaman yang untuk Admin + Super Admin:
- ❌ Approval (perlu diterapkan)

### Halaman yang untuk Semua Role:
- ✅ Dashboard (sudah aman via MenuItems)
- ✅ Data (sudah aman via MenuItems)

## 6. Implementasi Lengkap

Untuk memastikan keamanan maksimal, terapkan protection berikut:

```typescript
// 1. Logs pages
<SuperAdminGuard>
  <LogsPage />
</SuperAdminGuard>

// 2. CRUD pages  
<SuperAdminGuard>
  <CRUDPage />
</SuperAdminGuard>

// 3. Approval pages
<RoleGuard allowedRoles={['admin', 'super_admin']}>
  <ApprovalPage />
</RoleGuard>
```

## 7. Testing

Setelah menerapkan protection:

1. **Login sebagai Guest** → Coba akses `/dashboard-admin/user-management`
   - Seharusnya: Redirect ke dashboard dengan pesan "Akses ditolak"

2. **Login sebagai Admin** → Coba akses `/dashboard-admin/logs/Availability`
   - Seharusnya: Redirect ke dashboard dengan pesan "Akses ditolak"

3. **Login sebagai Super Admin** → Akses semua halaman
   - Seharusnya: Bisa akses semua halaman tanpa masalah

## 8. Keuntungan Implementasi Ini

- ✅ **Menu Filtering**: Menu tidak muncul di sidebar untuk role yang tidak berhak
- ✅ **Page Protection**: Akses langsung ke URL diblokir
- ✅ **Automatic Redirect**: User diarahkan ke halaman yang sesuai
- ✅ **Clear Error Messages**: User tahu mengapa akses ditolak
- ✅ **Consistent Security**: Semua halaman dilindungi dengan cara yang sama
