'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { database, cellDownDatabase } from '@/app/firebaseConfig';
import { ref, get } from 'firebase/database';

interface DatabaseExplorerProps {
  show?: boolean;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ show = false }) => {
  const [availabilityStructure, setAvailabilityStructure] = useState<any>(null);
  const [cellDownStructure, setCellDownStructure] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const exploreDatabase = async () => {
    setLoading(true);
    
    try {
      // Explore Availability Database
      if (database) {
        console.log('Exploring Availability Database structure...');
        const rootRef = ref(database);
        const snapshot = await get(rootRef);
        const data = snapshot.val();
        console.log('Availability Database root structure:', data);
        setAvailabilityStructure(data);
      }
      
      // Explore Cell-Down Database
      if (cellDownDatabase) {
        console.log('Exploring Cell-Down Database structure...');
        const rootRef = ref(cellDownDatabase);
        const snapshot = await get(rootRef);
        const data = snapshot.val();
        console.log('Cell-Down Database root structure:', data);
        setCellDownStructure(data);
      }
    } catch (error) {
      console.error('Error exploring database structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStructure = (data: any, title: string) => {
    if (!data) return null;
    
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          <pre style={{ fontSize: '12px', margin: 0 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </Box>
      </Paper>
    );
  };

  if (!show) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f0f0f0' }}>
      <Typography variant="h6" gutterBottom>
        🔍 Database Structure Explorer
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={exploreDatabase}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={20} /> : 'Explore Database Structure'}
      </Button>
      
      {availabilityStructure && renderStructure(availabilityStructure, 'Availability Database Structure')}
      {cellDownStructure && renderStructure(cellDownStructure, 'Cell-Down Database Structure')}
    </Paper>
  );
};
