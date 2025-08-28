# Authentication & Authorization System

Sistem autentikasi dan otorisasi yang telah dibuat untuk melindungi aplikasi dashboard admin.

## Komponen yang Tersedia

### 1. `useAuth` Hook
Hook utama untuk mengelola state autentikasi user.

```typescript
import { useAuth } from '@/utils/useAuth';

const { 
  user, 
  userRole, 
  isLoading, 
  isAuthenticated, 
  isSuperAdmin, 
  isAdmin, 
  isGuest, 
  logout 
} = useAuth();
```

**Properties:**
- `user`: Firebase user object
- `userRole`: Object berisi role, email, dan displayName
- `isLoading`: Status loading autentikasi
- `isAuthenticated`: Boolean apakah user sudah login
- `isSuperAdmin`: Boolean apakah user adalah super admin
- `isAdmin`: Boolean apakah user adalah admin
- `isGuest`: Boolean apakah user adalah guest
- `logout`: Function untuk logout

### 2. `AuthGuard` Component
Component untuk melindungi halaman yang membutuhkan autentikasi.

```typescript
import { AuthGuard } from '@/components/AuthGuard';

// Basic usage - hanya cek login
<AuthGuard>
  <ProtectedPage />
</AuthGuard>

// Dengan role requirement
<AuthGuard requiredRole="super_admin">
  <SuperAdminPage />
</AuthGuard>

// Dengan custom fallback
<AuthGuard 
  requiredRole="admin" 
  fallback={<CustomErrorComponent />}
>
  <AdminPage />
</AuthGuard>
```

### 3. `RoleGuard` Component
Component untuk melindungi halaman berdasarkan role tertentu.

```typescript
import { RoleGuard } from '@/components/RoleGuard';

// Multiple roles yang diizinkan
<RoleGuard allowedRoles={['super_admin', 'admin']}>
  <AdminOrSuperAdminPage />
</RoleGuard>

// Dengan custom redirect
<RoleGuard 
  allowedRoles={['super_admin']} 
  redirectTo="/dashboard-admin"
>
  <SuperAdminPage />
</RoleGuard>
```

### 4. `SuperAdminGuard` Component
Component khusus untuk halaman yang hanya bisa diakses super admin.

```typescript
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

<SuperAdminGuard>
  <SuperAdminOnlyPage />
</SuperAdminGuard>
```

### 5. `DashboardLayout` Component
Wrapper untuk semua halaman dashboard yang otomatis menerapkan autentikasi.

```typescript
import { DashboardLayout } from '@/components/DashboardLayout';

<DashboardLayout>
  <DashboardPage />
</DashboardLayout>
```

## Higher-Order Components (HOC)

### `withAuth`
Membungkus component dengan autentikasi.

```typescript
import { withAuth } from '@/components/AuthGuard';

const ProtectedComponent = withAuth(MyComponent, 'super_admin');
```

### `withRole`
Membungkus component dengan role-based protection.

```typescript
import { withRole } from '@/components/RoleGuard';

const AdminComponent = withRole(MyComponent, ['admin', 'super_admin']);
```

### `withSuperAdmin`
Membungkus component dengan super admin protection.

```typescript
import { withSuperAdmin } from '@/components/SuperAdminGuard';

const SuperAdminComponent = withSuperAdmin(MyComponent);
```

### `withDashboardAuth`
Membungkus component dengan dashboard authentication.

```typescript
import { withDashboardAuth } from '@/components/DashboardLayout';

const DashboardComponent = withDashboardAuth(MyComponent);
```

## Cara Penggunaan

### 1. Halaman yang Membutuhkan Login
```typescript
// Gunakan DashboardLayout di layout.tsx (sudah diterapkan)
// Atau gunakan AuthGuard untuk halaman tertentu
export default function ProtectedPage() {
  return (
    <AuthGuard>
      <div>Halaman yang dilindungi</div>
    </AuthGuard>
  );
}
```

### 2. Halaman Khusus Super Admin
```typescript
export default function SuperAdminPage() {
  return (
    <SuperAdminGuard>
      <div>Halaman khusus super admin</div>
    </SuperAdminGuard>
  );
}
```

### 3. Halaman dengan Role Tertentu
```typescript
export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'super_admin']}>
      <div>Halaman untuk admin dan super admin</div>
    </RoleGuard>
  );
}
```

### 4. Menggunakan HOC
```typescript
function MyPage() {
  return <div>Halaman dengan HOC</div>;
}

// Export dengan protection
export default withRole(MyPage, ['admin', 'super_admin']);
```

## Flow Autentikasi

1. **User mengakses halaman dashboard** → `DashboardLayout` mengecek autentikasi
2. **Jika belum login** → Redirect ke halaman login (`/`)
3. **Jika sudah login** → Cek role dan akses ke halaman
4. **Jika role tidak sesuai** → Redirect ke dashboard atau tampilkan error

## Role-Based Access Control

### Super Admin
- Akses ke semua menu dan submenu
- User Management
- Logs
- CRUD
- Approval

### Admin
- Worst Site Availability (Dashboard & Data saja)
- Cell Down (Dashboard & Data saja)
- Logout

### Guest
- Worst Site Availability (Dashboard & Data saja)
- Cell Down (Dashboard & Data saja)
- Logout

## Keamanan

- **Client-side protection**: Mencegah akses langsung ke halaman
- **Role validation**: Setiap halaman dicek berdasarkan role user
- **Automatic redirect**: User tidak bisa akses halaman yang bukan haknya
- **Session management**: Integrasi dengan Firebase Auth dan localStorage

## Troubleshooting

### Error "Akses ditolak"
- Pastikan user sudah login
- Pastikan role user sesuai dengan requirement halaman
- Cek localStorage `userRole`

### Redirect loop
- Pastikan tidak ada konflik antara guard components
- Cek logic redirect di component

### Loading tidak berhenti
- Cek koneksi Firebase
- Cek error di console browser
