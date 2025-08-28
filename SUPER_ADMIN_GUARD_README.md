# SuperAdminGuard - Sistem Keamanan Halaman Super Admin

## Overview
`SuperAdminGuard` adalah sistem keamanan yang dibuat untuk melindungi halaman-halaman yang hanya boleh diakses oleh super admin. Sistem ini menggantikan implementasi manual yang sebelumnya ada di setiap halaman.

## Komponen yang Tersedia

### 1. Custom Hook: `useSuperAdmin`
**File:** `src/utils/useSuperAdmin.ts`

Hook ini menangani logika pengecekan super admin dan redirect otomatis.

```typescript
import { useSuperAdmin } from '@/utils/useSuperAdmin';

const { isSuperAdmin, redirecting, isLoading } = useSuperAdmin();
```

**Return Values:**
- `isSuperAdmin`: boolean - status apakah user adalah super admin
- `redirecting`: boolean - status sedang dalam proses redirect
- `isLoading`: boolean - status loading (true saat pengecekan awal)

### 2. Component Wrapper: `SuperAdminGuard`
**File:** `src/components/SuperAdminGuard.tsx`

Component wrapper yang otomatis menangani UI states (loading, error, content).

```typescript
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

<SuperAdminGuard>
  {/* Konten halaman yang dilindungi */}
</SuperAdminGuard>
```

### 3. Higher-Order Component: `withSuperAdmin`
**File:** `src/components/SuperAdminGuard.tsx`

HOC untuk membungkus komponen yang membutuhkan super admin access.

```typescript
import { withSuperAdmin } from '@/components/SuperAdminGuard';

const ProtectedPage = withSuperAdmin(MyPage);
```

## Cara Penggunaan

### Metode 1: Menggunakan SuperAdminGuard Component (Recommended)

```typescript
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

const MyPage = () => {
  // State dan logic halaman
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Fetch data - tidak perlu cek super admin lagi
    fetchData();
  }, []);

  return (
    <SuperAdminGuard>
      <Box>
        {/* Konten halaman */}
        <Typography>Halaman Super Admin</Typography>
      </Box>
    </SuperAdminGuard>
  );
};
```

### Metode 2: Menggunakan Custom Hook

```typescript
import { useSuperAdmin } from '@/utils/useSuperAdmin';

const MyPage = () => {
  const { isSuperAdmin, isLoading } = useSuperAdmin();
  const [data, setData] = useState([]);
  
  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  if (isLoading) return <CircularProgress />;
  if (!isSuperAdmin) return null; // Redirect otomatis

  return (
    <Box>
      {/* Konten halaman */}
    </Box>
  );
};
```

### Metode 3: Menggunakan Higher-Order Component

```typescript
import { withSuperAdmin } from '@/components/SuperAdminGuard';

const MyPage = () => {
  // Logic halaman
  return (
    <Box>
      {/* Konten halaman */}
    </Box>
  );
};

export default withSuperAdmin(MyPage);
```

## Fitur Otomatis

### 1. Redirect Otomatis
- User non-super admin akan otomatis diarahkan ke `/dashboard-admin` setelah 1.5 detik
- Tidak perlu implementasi manual

### 2. Pesan Error Konsisten
- Menampilkan pesan "Akses ditolak. Halaman ini hanya untuk super admin. Anda akan diarahkan ke dashboard..."
- Styling konsisten di semua halaman

### 3. Loading State
- Menampilkan loading spinner saat pengecekan super admin
- Tidak ada flash content

### 4. Custom Fallback
```typescript
<SuperAdminGuard 
  fallback={<CustomErrorComponent />}
>
  {/* Konten halaman */}
</SuperAdminGuard>
```

## Halaman yang Sudah Diupdate

### 1. `/dashboard-admin/approval/Availability`
- ✅ Menggunakan `SuperAdminGuard`
- ✅ Logika super admin lama dihapus

### 2. `/dashboard-admin/crud/Availability`
- ✅ Menggunakan `SuperAdminGuard`
- ✅ Logika super admin lama dihapus

### 3. `/dashboard-admin/logs/Availability`
- ✅ Menggunakan `SuperAdminGuard`
- ✅ Logika super admin lama dihapus

## Keuntungan Sistem Baru

### 1. **DRY (Don't Repeat Yourself)**
- Tidak perlu copy-paste logika super admin di setiap halaman
- Satu tempat untuk maintenance

### 2. **Konsistensi**
- Pesan error sama di semua halaman
- Behavior redirect konsisten

### 3. **Maintainability**
- Perubahan logika cukup di satu file
- Testing lebih mudah

### 4. **Flexibility**
- Bisa custom fallback component
- Bisa gunakan hook atau component wrapper

## Migration dari Sistem Lama

### Sebelum (Manual Implementation):
```typescript
const [isSuperAdminState, setIsSuperAdminState] = useState<boolean | null>(null);
const [redirecting, setRedirecting] = useState(false);

useEffect(() => {
  if (typeof window !== 'undefined') {
    const isSuper = localStorage.getItem('userRole') === 'super_admin';
    setIsSuperAdminState(isSuper);
    if (!isSuper) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        window.location.href = '/dashboard-admin';
      }, 1500);
      return () => clearTimeout(timer);
    }
  }
}, []);

if (isSuperAdminState === false) {
  return <Box p={4}><Typography color="error" fontWeight={700} fontSize={20}>Akses ditolak. Halaman ini hanya untuk super admin.<br/>Anda akan diarahkan ke dashboard...</Typography></Box>;
}
if (isSuperAdminState === null) {
  return null;
}
```

### Sesudah (SuperAdminGuard):
```typescript
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

return (
  <SuperAdminGuard>
    {/* Konten halaman */}
  </SuperAdminGuard>
);
```

## Troubleshooting

### 1. Import Error
Pastikan path import benar:
```typescript
// ✅ Benar
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

// ❌ Salah
import { SuperAdminGuard } from '../../components/SuperAdminGuard';
```

### 2. TypeScript Error
Pastikan file `tsconfig.json` memiliki path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. Component Tidak Render
- Cek console browser untuk error
- Pastikan `localStorage.getItem('userRole')` mengembalikan `'super_admin'`
- Pastikan tidak ada infinite loop di useEffect

## Best Practices

### 1. Gunakan SuperAdminGuard untuk Halaman Baru
```typescript
// ✅ Recommended
<SuperAdminGuard>
  <NewPage />
</SuperAdminGuard>

// ❌ Avoid
// Implementasi manual super admin check
```

### 2. Gunakan Hook untuk Logic Complex
```typescript
const { isSuperAdmin } = useSuperAdmin();

useEffect(() => {
  if (isSuperAdmin) {
    // Logic yang membutuhkan super admin
  }
}, [isSuperAdmin]);
```

### 3. Custom Fallback untuk UX yang Lebih Baik
```typescript
<SuperAdminGuard 
  fallback={
    <Box p={4}>
      <Typography variant="h6" color="error">
        Maaf, Anda tidak memiliki akses ke halaman ini
      </Typography>
      <Button onClick={() => router.push('/dashboard')}>
        Kembali ke Dashboard
      </Button>
    </Box>
  }
>
  {/* Konten halaman */}
</SuperAdminGuard>
```

## Kesimpulan

Sistem `SuperAdminGuard` memberikan solusi yang lebih efisien dan maintainable untuk melindungi halaman super admin. Dengan menggunakan sistem ini, developer tidak perlu lagi mengimplementasikan logika keamanan yang sama di setiap halaman, dan maintenance menjadi lebih mudah karena perubahan cukup dilakukan di satu tempat.
