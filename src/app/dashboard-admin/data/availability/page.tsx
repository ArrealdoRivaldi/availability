'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import PageContainer from '../../components/container/PageContainer';
import { useRouter } from 'next/navigation';

const DataAvailabilityPage = () => {
  const router = useRouter();

  return (
    <PageContainer title="Data Availability" description="Data Availability Management">
      <Box p={{ xs: 1, md: 3 }} sx={{ background: '#f7f8fa', minHeight: '100vh' }}>
        <Paper sx={{ p: { xs: 1, md: 3 }, mb: 4, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: '#fff' }} elevation={2}>
          <Typography variant="h3" component="h1" gutterBottom>
            Data Availability Management
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Halaman ini berisi fitur manajemen data availability yang lengkap dengan tabel, filter, dan operasi CRUD.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fafdff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } }}>
                <Typography variant="h6" gutterBottom>
                  📊 Data Table Management
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Kelola data availability dengan fitur tabel lengkap, filter, search, dan pagination.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => router.push('/dashboard-admin/data')}
                  sx={{ mt: 1 }}
                >
                  Lihat Data Table
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } }}>
                <Typography variant="h6" gutterBottom>
                  🔧 Fitur Data Management
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Fitur yang tersedia:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Tabel data dengan pagination
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Filter dan search global
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Edit data inline
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Export data (Copy/Download)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Diskusi dan komentar
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default DataAvailabilityPage; 