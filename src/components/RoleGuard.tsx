import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '@/utils/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowedRoles: ('super_admin' | 'admin' | 'guest')[];
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  fallback,
  allowedRoles,
  redirectTo = '/dashboard-admin'
}) => {
  const { userRole, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (!isLoading && isAuthenticated && userRole.role && !allowedRoles.includes(userRole.role)) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, userRole.role, allowedRoles, redirectTo, router]);

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

  // Role check
  if (userRole.role && !allowedRoles.includes(userRole.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Box p={4}>
        <Typography color="error" fontWeight={700} fontSize={20} textAlign="center">
          Akses ditolak. Halaman ini hanya untuk {allowedRoles.join(' atau ')}.
          <br />
          Mengarahkan ke dashboard...
        </Typography>
      </Box>
    );
  }

  // Authorized - render children
  return <>{children}</>;
};

// Higher-order component untuk halaman yang membutuhkan role tertentu
export const withRole = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: ('super_admin' | 'admin' | 'guest')[],
  redirectTo?: string
) => {
  const WrappedComponent = (props: P) => (
    <RoleGuard allowedRoles={allowedRoles} redirectTo={redirectTo}>
      <Component {...props} />
    </RoleGuard>
  );
  
  WrappedComponent.displayName = `withRole(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
