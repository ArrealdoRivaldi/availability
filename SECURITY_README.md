# Sistem Keamanan Dashboard Admin

## Overview
Sistem keamanan ini dirancang untuk mencegah akses langsung ke halaman dashboard tanpa autentikasi yang proper. Sistem terdiri dari beberapa lapisan keamanan:

## Komponen Keamanan

### 1. AuthGuard (`src/app/components/AuthGuard.tsx`)
- **Fungsi**: Memverifikasi status login user sebelum mengizinkan akses ke halaman
- **Fitur**:
  - Verifikasi Firebase Auth
  - Verifikasi user di Firestore
  - Role-based access control
  - Loading state dan error handling
  - Redirect otomatis ke login jika tidak terautentikasi

### 2. RoleGuard (`src/app/components/RoleGuard.tsx`)
- **Fungsi**: Mengontrol akses berdasarkan role user
- **Fitur**:
  - SuperAdminGuard: Hanya super admin
  - AdminGuard: Admin dan super admin
  - GuestGuard: Semua role yang valid
  - Custom role validation
  - Fallback UI untuk unauthorized access

### 3. Middleware (`src/middleware.ts`)
- **Fungsi**: Server-side protection untuk semua route yang memerlukan autentikasi
- **Fitur**:
  - Verifikasi token di level server
  - Redirect otomatis ke login
  - Protection untuk semua path dashboard

### 4. LogoutButton (`src/app/components/LogoutButton.tsx`)
- **Fungsi**: Komponen logout yang membersihkan semua data autentikasi
- **Fitur**:
  - Logout dari Firebase
  - Hapus data dari localStorage
  - Hapus cookies
  - Hapus user dari active_users collection

## Cara Penggunaan

### 1. Melindungi Halaman dengan AuthGuard
```tsx
import AuthGuard from '@/app/components/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <YourPageContent />
    </AuthGuard>
  );
}
```

### 2. Melindungi Halaman dengan RoleGuard
```tsx
import { SuperAdminGuard, AdminGuard } from '@/app/components/RoleGuard';

// Hanya super admin
export default function SuperAdminPage() {
  return (
    <SuperAdminGuard>
      <SuperAdminContent />
    </SuperAdminGuard>
  );
}

// Admin dan super admin
export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}
```

### 3. Menggunakan useAuth Hook
```tsx
import { useAuth } from '@/app/components/AuthGuard';

export default function MyComponent() {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;
  
  return <div>Welcome, {userRole}!</div>;
}
```

## Flow Autentikasi

1. **Login**: User login dengan Google atau sebagai Guest
2. **Token Generation**: Firebase ID token dibuat dan disimpan di localStorage dan cookie
3. **Route Protection**: Middleware memverifikasi token di setiap request
4. **Client-side Verification**: AuthGuard memverifikasi status login dan role
5. **Access Control**: RoleGuard memverifikasi permission berdasarkan role
6. **Logout**: Semua data autentikasi dibersihkan

## Role Hierarchy

- **super_admin**: Akses penuh ke semua fitur
- **admin**: Akses terbatas (tanpa menu Logs dan User Management)
- **guest**: Akses sangat terbatas (hanya dashboard dan data)

## Keamanan Tambahan

### 1. Idle Logout
- User otomatis logout setelah 15 menit tidak aktif
- Warning dialog 1 menit sebelum logout
- Reset timer pada setiap aktivitas user

### 2. Token Management
- Token disimpan di localStorage dan cookie
- Token expired setelah 1 jam
- Secure cookie dengan SameSite=Strict

### 3. Error Handling
- Graceful fallback untuk error autentikasi
- Logging error untuk debugging
- User-friendly error messages

## Troubleshooting

### 1. User tidak bisa login
- Cek Firebase configuration
- Verifikasi user ada di collection "users"
- Cek role user di Firestore

### 2. Access denied error
- Verifikasi role user
- Cek permission untuk halaman tertentu
- Pastikan user sudah login

### 3. Middleware error
- Cek token di cookie/header
- Verifikasi path protection configuration
- Cek Next.js configuration

## Best Practices

1. **Selalu gunakan AuthGuard** untuk halaman yang memerlukan login
2. **Gunakan RoleGuard** untuk halaman yang memerlukan role tertentu
3. **Jangan hardcode role** di komponen, gunakan useAuth hook
4. **Test semua role** untuk memastikan permission bekerja dengan benar
5. **Monitor active_users collection** untuk tracking user yang sedang login
6. **Regular security audit** untuk memastikan tidak ada celah keamanan

## Update History

- **v1.0**: Implementasi sistem keamanan dasar
- **v1.1**: Penambahan middleware dan role-based access control
- **v1.2**: Implementasi idle logout dan token management
- **v1.3**: Penambahan error handling dan user experience improvements
