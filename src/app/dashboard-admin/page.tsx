'use client';
import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import PageContainer from './components/container/PageContainer';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const router = useRouter();

  return (
    <PageContainer title="Dashboard" description="Main Dashboard">
      <Box p={{ xs: 1, md: 3 }} sx={{ background: '#f7f8fa', minHeight: '100vh' }}>
        <Paper sx={{ p: { xs: 1, md: 3 }, mb: 4, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: '#fff' }} elevation={2}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Selamat datang di dashboard utama. Untuk melihat data availability, silakan akses submenu Availability di sidebar.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fafdff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } }}>
                <Typography variant="h6" gutterBottom>
                  📊 Dashboard Availability
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Lihat dashboard lengkap dengan grafik, tabel, dan progress stepper untuk data availability.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => router.push('/dashboard-admin/availability')}
                  sx={{ mt: 1 }}
                >
                  Lihat Dashboard Availability
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } }}>
                <Typography variant="h6" gutterBottom>
                  🔧 Menu Lainnya
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Akses menu lainnya melalui sidebar untuk mengelola data, approval, logs, dan CRUD operations.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => router.push('/dashboard-admin/data')}
                  >
                    Data Management
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => router.push('/dashboard-admin/approval')}
                  >
                    Approval Management
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => router.push('/dashboard-admin/logs')}
                  >
                    Logs Management
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => router.push('/dashboard-admin/crud')}
                  >
                    CRUD Operations
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default Dashboard; 