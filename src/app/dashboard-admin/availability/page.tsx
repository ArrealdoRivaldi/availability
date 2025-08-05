import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PageContainer from '../components/container/PageContainer';

const AvailabilityPage = () => {
  return (
    <PageContainer title="Availability" description="Dashboard Availability">
      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          Availability Dashboard
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Welcome to Availability Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page will contain availability-related dashboard content.
          </Typography>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default AvailabilityPage; 