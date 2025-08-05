import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PageContainer from '../../components/container/PageContainer';

const DataAvailabilityPage = () => {
  return (
    <PageContainer title="Data Availability" description="Data Availability Management">
      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          Data Availability
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Data Availability Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page will contain data availability management features.
          </Typography>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default DataAvailabilityPage; 