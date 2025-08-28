'use client';
import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Avatar, Chip } from '@mui/material';
import { Person, AdminPanelSettings, Security } from '@mui/icons-material';
import { SuperAdminGuard } from '@/app/components/RoleGuard';

const UserManagementPage = () => {
  const users = [
    {
      id: 1,
      name: 'Super Admin',
      email: 'superadmin@telkomsel.com',
      role: 'super_admin',
      status: 'active',
      lastLogin: '2024-01-15 10:30:00'
    },
    {
      id: 2,
      name: 'Admin User',
      email: 'admin@telkomsel.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15 09:15:00'
    },
    {
      id: 3,
      name: 'Guest User',
      email: 'guest@telkomsel.com',
      role: 'guest',
      status: 'inactive',
      lastLogin: '2024-01-14 16:45:00'
    }
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Security sx={{ fontSize: 40, color: '#d32f2f' }} />;
      case 'admin':
        return <AdminPanelSettings sx={{ fontSize: 40, color: '#1976d2' }} />;
      case 'guest':
        return <Person sx={{ fontSize: 40, color: '#388e3c' }} />;
      default:
        return <Person sx={{ fontSize: 40, color: '#757575' }} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '#d32f2f';
      case 'admin':
        return '#1976d2';
      case 'guest':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  return (
    <SuperAdminGuard>
      <Box p={{ xs: 2, md: 4 }} sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
        {/* Header Section */}
        <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: 'white' }} elevation={3}>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight={700} mb={2} sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              User Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
              Manage user accounts, roles, and permissions
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
              Super Admin exclusive access - Full control over user system
            </Typography>
          </Box>
        </Paper>

        {/* User Cards Grid */}
        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  borderRadius: 3, 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* User Info Header */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: `${getRoleColor(user.role)}15`, mr: 2, width: 60, height: 60 }}>
                      {getRoleIcon(user.role)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary">
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Role and Status */}
                  <Box display="flex" gap={1} mb={2}>
                    <Chip 
                      label={user.role.replace('_', ' ').toUpperCase()} 
                      size="small" 
                      sx={{ 
                        bgcolor: getRoleColor(user.role), 
                        color: 'white',
                        fontWeight: 600
                      }} 
                    />
                    <Chip 
                      label={user.status} 
                      size="small" 
                      color={getStatusColor(user.status) as any}
                      variant="outlined"
                    />
                  </Box>

                  {/* Last Login */}
                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                      Last Login:
                    </Typography>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      {user.lastLogin}
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Chip 
                          label="Edit" 
                          size="small" 
                          variant="outlined"
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.50' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip 
                          label="Delete" 
                          size="small" 
                          variant="outlined"
                          color="error"
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'error.50' } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Stats */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mt: 4, borderRadius: 3, background: 'rgba(255,255,255,0.9)' }} elevation={2}>
          <Typography variant="h6" fontWeight={600} mb={2} textAlign="center">
            User Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#d32f2f">1</Typography>
                <Typography variant="body2" color="text.secondary">Super Admin</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#1976d2">1</Typography>
                <Typography variant="body2" color="text.secondary">Admin</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#388e3c">1</Typography>
                <Typography variant="body2" color="text.secondary">Guest</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#757575">3</Typography>
                <Typography variant="body2" color="text.secondary">Total Users</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </SuperAdminGuard>
  );
};

export default UserManagementPage;
