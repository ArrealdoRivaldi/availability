import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useSuperAdmin } from '@/utils/useSuperAdmin';

interface SuperAdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { isSuperAdmin, isLoading } = useSuperAdmin();

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Not super admin - show error message
  if (isSuperAdmin === false) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
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
