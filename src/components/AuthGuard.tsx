import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '@/utils/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: 'super_admin' | 'admin' | 'guest';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Box p={4}>
        <Typography color="error" fontWeight={700} fontSize={20} textAlign="center">
          Anda harus login terlebih dahulu.
          <br />
          Mengarahkan ke halaman login...
        </Typography>
      </Box>
    );
  }

  // Role check if required
  if (requiredRole && userRole.role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Box p={4}>
        <Typography color="error" fontWeight={700} fontSize={20} textAlign="center">
          Akses ditolak. Halaman ini hanya untuk {requiredRole === 'super_admin' ? 'super admin' : requiredRole}.
          <br />
          Mengarahkan ke dashboard...
        </Typography>
      </Box>
    );
  }

  // Authenticated and authorized - render children
  return <>{children}</>;
};

// Higher-order component untuk halaman yang membutuhkan autentikasi
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: 'super_admin' | 'admin' | 'guest'
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard requiredRole={requiredRole}>
      <Component {...props} />
    </AuthGuard>
  );
  
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
