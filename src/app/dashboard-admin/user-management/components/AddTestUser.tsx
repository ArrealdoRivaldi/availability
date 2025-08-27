import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

interface AddTestUserProps {
  onUserAdded: () => void;
}

export default function AddTestUser({ onUserAdded }: AddTestUserProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addTestUser = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const testUser = {
        displayName: 'Test User',
        email: 'test@example.com',
        nop: 'kalimantan',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Adding test user:', testUser);
      
      const docRef = await addDoc(collection(db, 'users'), testUser);
      console.log('Test user added with ID:', docRef.id);
      
      setMessage({
        type: 'success',
        text: `Test user added successfully with ID: ${docRef.id}`
      });
      
      // Call the callback to refresh the user list
      onUserAdded();
      
    } catch (err) {
      console.error('Error adding test user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setMessage({
        type: 'error',
        text: `Failed to add test user: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
      <Typography variant="h6" color="info.main" gutterBottom>
        No Users Found
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        The users collection appears to be empty. You can add a test user to verify the system is working correctly.
      </Typography>
      
      <Box display="flex" alignItems="center" gap={2}>
        <Button
          variant="contained"
          color="info"
          startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
          onClick={addTestUser}
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Test User'}
        </Button>
        
        <Typography variant="caption" color="textSecondary">
          This will create a sample user with basic information
        </Typography>
      </Box>
      
      {message && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}
    </Paper>
  );
}
