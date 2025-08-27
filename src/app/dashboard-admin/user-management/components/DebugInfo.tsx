import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Collapse,
  IconButton
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

interface DebugInfoProps {
  users: any[];
  loading: boolean;
  error: string | null;
}

export default function DebugInfo({ users, loading, error }: DebugInfoProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<any>({});
  const [testingConnection, setTestingConnection] = React.useState(false);

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      console.log('Testing Firebase connection...');
      
      // Test basic collection access
      const usersRef = collection(db, 'users');
      console.log('Collection reference:', usersRef);
      
      // Test getting documents
      const snapshot = await getDocs(usersRef);
      console.log('Snapshot:', {
        size: snapshot.size,
        empty: snapshot.empty,
        docs: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
      });
      
      setDebugInfo({
        collectionPath: usersRef.path,
        snapshotSize: snapshot.size,
        snapshotEmpty: snapshot.empty,
        documents: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })),
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Connection test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const errorCode = (err as any)?.code || 'UNKNOWN';
      setDebugInfo({
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" color="textSecondary">
          Debug Information
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={testConnection}
            disabled={testingConnection}
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </Button>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current State:
          </Typography>
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', bgcolor: 'white', p: 1, borderRadius: 1 }}>
            <div>Loading: {loading.toString()}</div>
            <div>Users Count: {users.length}</div>
            <div>Error: {error || 'None'}</div>
          </Box>

          {Object.keys(debugInfo).length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Connection Test Results:
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', bgcolor: 'white', p: 1, borderRadius: 1 }}>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </Box>
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Error Details:</strong> {error}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Check the browser console for more detailed error information.
              </Typography>
            </Alert>
          )}

          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            This debug panel helps troubleshoot data loading issues. Check the browser console for detailed logs.
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
}
