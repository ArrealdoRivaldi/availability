'use client';
import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, Avatar, TextField, InputAdornment } from '@mui/material';
import { Search, FilterList, Download, Visibility, Edit, Delete } from '@mui/icons-material';
import { GuestGuard } from '@/app/components/RoleGuard';

const DataAvailabilityPage = () => {
  const dataItems = [
    {
      id: 1,
      siteId: 'JKT001',
      siteName: 'Jakarta Selatan Site',
      availability: 98.5,
      status: 'active',
      lastUpdate: '2024-01-15 10:30:00',
      category: 'Urban',
      nop: 'Jakarta'
    },
    {
      id: 2,
      siteId: 'BDG001',
      siteName: 'Bandung Central Site',
      availability: 97.2,
      status: 'warning',
      lastUpdate: '2024-01-15 09:15:00',
      category: 'Urban',
      nop: 'Bandung'
    },
    {
      id: 3,
      siteId: 'SBY001',
      siteName: 'Surabaya East Site',
      availability: 99.1,
      status: 'active',
      lastUpdate: '2024-01-15 08:45:00',
      category: 'Urban',
      nop: 'Surabaya'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'warning':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 99) return '#4caf50';
    if (availability >= 95) return '#ff9800';
    return '#f44336';
  };

  const handleView = (id: number) => {
    console.log('Viewing data:', id);
    // Implementasi view logic
  };

  const handleEdit = (id: number) => {
    console.log('Editing data:', id);
    // Implementasi edit logic
  };

  const handleDelete = (id: number) => {
    console.log('Deleting data:', id);
    // Implementasi delete logic
  };

  const handleDownload = () => {
    console.log('Downloading data');
    // Implementasi download logic
  };

  return (
    <GuestGuard>
      <Box p={{ xs: 2, md: 4 }} sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
        {/* Header Section */}
        <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white' }} elevation={3}>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight={700} mb={2} sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              Data Availability
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
              View and manage availability data for all sites
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
              Accessible to all authenticated users
            </Typography>
          </Box>
        </Paper>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, background: 'rgba(255,255,255,0.9)' }} elevation={2}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search sites, categories, or NOP..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ background: 'white' }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Category"
                defaultValue=""
                SelectProps={{ native: true }}
                sx={{ background: 'white' }}
              >
                <option value="">All Categories</option>
                <option value="urban">Urban</option>
                <option value="suburban">Suburban</option>
                <option value="rural">Rural</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="NOP"
                defaultValue=""
                SelectProps={{ native: true }}
                sx={{ background: 'white' }}
              >
                <option value="">All NOPs</option>
                <option value="jakarta">Jakarta</option>
                <option value="bandung">Bandung</option>
                <option value="surabaya">Surabaya</option>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600} color="text.primary">
            Site Data ({dataItems.length} sites)
          </Typography>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownload}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
          >
            Export Data
          </Button>
        </Box>

        {/* Data Cards Grid */}
        <Grid container spacing={3}>
          {dataItems.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
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
                  {/* Header with Status */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                        {item.siteName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        ID: {item.siteId}
                      </Typography>
                      <Chip 
                        label={item.status.toUpperCase()} 
                        size="small" 
                        color={getStatusColor(item.status) as any}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Typography 
                      variant="h4" 
                      fontWeight={700} 
                      sx={{ color: getAvailabilityColor(item.availability) }}
                    >
                      {item.availability}%
                    </Typography>
                  </Box>

                  {/* Site Details */}
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Category:
                        </Typography>
                        <Typography variant="body2" color="text.primary" fontWeight={500}>
                          {item.category}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          NOP:
                        </Typography>
                        <Typography variant="body2" color="text.primary" fontWeight={500}>
                          {item.nop}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Last Update */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Last Update:
                    </Typography>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      {item.lastUpdate}
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ mt: 'auto' }}>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={() => handleView(item.id)}
                          startIcon={<Visibility />}
                        >
                          View
                        </Button>
                      </Grid>
                      <Grid item xs={4}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={() => handleEdit(item.id)}
                          startIcon={<Edit />}
                        >
                          Edit
                        </Button>
                      </Grid>
                      <Grid item xs={4}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          fullWidth
                          onClick={() => handleDelete(item.id)}
                          startIcon={<Delete />}
                        >
                          Delete
                        </Button>
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
            Availability Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#4caf50">98.5%</Typography>
                <Typography variant="body2" color="text.secondary">Average Availability</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#4caf50">2</Typography>
                <Typography variant="body2" color="text.secondary">Active Sites</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#ff9800">1</Typography>
                <Typography variant="body2" color="text.secondary">Warning Sites</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#757575">3</Typography>
                <Typography variant="body2" color="text.secondary">Total Sites</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </GuestGuard>
  );
};

export default DataAvailabilityPage; 