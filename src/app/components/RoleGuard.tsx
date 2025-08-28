'use client';
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthGuard';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const router = useRouter();

  // Loading state
  if (isLoading) {
    return null; // Biarkan AuthGuard menangani loading
  }

  // Jika tidak terautentikasi, biarkan AuthGuard menangani
  if (!isAuthenticated) {
    return null;
  }

  // Jika user tidak memiliki role yang diizinkan
  if (!userRole || !allowedRoles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f7fafd",
          gap: 3,
        }}
      >
        <Typography variant="h4" color="error" textAlign="center">
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={400}>
          You don't have permission to access this page. Required roles: {allowedRoles.join(', ')}.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/dashboard-admin')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Jika user memiliki role yang diizinkan, render children
  return <>{children}</>;
}

// Komponen khusus untuk role tertentu
export function SuperAdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super_admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function GuestGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'guest']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
