import React from 'react';
import { Box, Typography, Alert, Paper } from '@mui/material';
import { IconLock } from '@tabler/icons-react';

interface GuestAccessGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
  showReadOnlyMessage?: boolean;
}

const GuestAccessGuard: React.FC<GuestAccessGuardProps> = ({ 
  children, 
  requiredRole = 'admin',
  showReadOnlyMessage = false 
}) => {
  const [userRole, setUserRole] = React.useState<string>('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole') || '');
    }
  }, []);

  const isGuest = userRole === 'guest';
  const hasRequiredRole = requiredRole === 'super_admin' ? 
    userRole === 'super_admin' : 
    ['admin', 'super_admin'].includes(userRole);

  if (isGuest && !hasRequiredRole) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
        }}
      >
        <IconLock size={48} color="#856404" style={{ marginBottom: 16 }} />
        <Typography variant="h6" color="#856404" gutterBottom>
          Akses Terbatas
        </Typography>
        <Typography variant="body2" color="#856404" sx={{ mb: 2 }}>
          Sebagai Guest, Anda hanya dapat melihat data (read-only).
        </Typography>
        {showReadOnlyMessage && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Mode Guest: Hanya dapat melihat data, tidak dapat melakukan perubahan
          </Alert>
        )}
      </Paper>
    );
  }

  return <>{children}</>;
};

export default GuestAccessGuard;
