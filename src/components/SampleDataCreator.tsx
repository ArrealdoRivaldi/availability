'use client';
import React, { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { database, cellDownDatabase } from '@/app/firebaseConfig';
import { ref, set } from 'firebase/database';

interface SampleDataCreatorProps {
  show?: boolean;
}

export const SampleDataCreator: React.FC<SampleDataCreatorProps> = ({ show = false }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const createSampleAvailabilityData = async () => {
    if (!database) {
      setMessage('Database not initialized');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const sampleData = {
        'sample-001': {
          'Root Cause': 'Power - Regular',
          'PIC Dept': 'ENOM',
          'Source Power': 'PLN',
          'Progress': 'Identification',
          'Detail Problem': 'Site mengalami gangguan listrik PLN',
          'Plan Action': 'Koordinasi dengan PLN untuk perbaikan',
          'Need Support': 'Tidak',
          'Status': 'Open',
          'Date Close': [],
          'createdAt': new Date().toISOString(),
          'updatedAt': new Date().toISOString()
        },
        'sample-002': {
          'Root Cause': 'Transport',
          'PIC Dept': 'TRANSPORT',
          'Source Power': 'Genset',
          'Progress': 'Plan Action',
          'Detail Problem': 'Kendaraan transportasi rusak',
          'Plan Action': 'Perbaikan kendaraan transport',
          'Need Support': 'Ya',
          'Status': 'Waiting approval',
          'Date Close': [],
          'createdAt': new Date().toISOString(),
          'updatedAt': new Date().toISOString()
        }
      };

      await set(ref(database, 'availability'), sampleData);
      setMessage('Sample availability data created successfully!');
    } catch (error) {
      console.error('Error creating sample data:', error);
      setMessage('Error creating sample data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createSampleCellDownData = async () => {
    if (!cellDownDatabase) {
      setMessage('Cell-Down database not initialized');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const sampleData = {
        'sample-001': {
          'nop': 'kalimantan',
          'site_name': 'Sample Site 1',
          'week': '2024-W01',
          'status': 'Open',
          'createdAt': new Date().toISOString(),
          'updatedAt': new Date().toISOString()
        },
        'sample-002': {
          'nop': 'balikpapan',
          'site_name': 'Sample Site 2',
          'week': '2024-W01',
          'status': 'Close',
          'createdAt': new Date().toISOString(),
          'updatedAt': new Date().toISOString()
        }
      };

      await set(ref(cellDownDatabase, 'data_celldown'), sampleData);
      setMessage('Sample cell-down data created successfully!');
    } catch (error) {
      console.error('Error creating sample data:', error);
      setMessage('Error creating sample data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff3cd' }}>
      <Typography variant="h6" gutterBottom>
        🛠️ Sample Data Creator
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Jika database kosong, Anda bisa membuat data sample untuk testing.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button 
          variant="outlined" 
          onClick={createSampleAvailabilityData}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Create Sample Availability Data'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={createSampleCellDownData}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Create Sample Cell-Down Data'}
        </Button>
      </Box>
      
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'}>
          {message}
        </Alert>
      )}
    </Paper>
  );
};
