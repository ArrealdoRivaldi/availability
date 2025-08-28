import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '@/utils/useAuth';
import { useRouter } from 'next/navigation';

interface SuperAdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Not super admin - show error message and redirect
  if (!isSuperAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Redirect to dashboard after showing message
    setTimeout(() => {
      router.push('/dashboard-admin');
    }, 2000);
    
    return (
      <Box p={4}>
        <Typography color="error" fontWeight={700} fontSize={20} textAlign="center">
          Akses ditolak. Halaman ini hanya untuk super admin.
          <br />
          Anda akan diarahkan ke dashboard...
        </Typography>
      </Box>
    );
  }

  // Super admin - render children
  return <>{children}</>;
};

// Higher-order component untuk halaman yang membutuhkan super admin
export const withSuperAdmin = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <SuperAdminGuard>
      <Component {...props} />
    </SuperAdminGuard>
  );
  
  WrappedComponent.displayName = `withSuperAdmin(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
