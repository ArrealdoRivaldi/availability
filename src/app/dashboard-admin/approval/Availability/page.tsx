'use client';
import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, Avatar } from '@mui/material';
import { CheckCircle, Cancel, Pending, AdminPanelSettings } from '@mui/icons-material';
import { AdminGuard } from '@/app/components/RoleGuard';

const ApprovalPage = () => {
  const approvals = [
    {
      id: 1,
      title: 'Site Jakarta Selatan - Availability Improvement',
      requester: 'John Doe',
      department: 'Network Operations',
      status: 'pending',
      priority: 'high',
      submittedDate: '2024-01-15 09:00:00',
      description: 'Request for availability improvement for Jakarta Selatan site'
    },
    {
      id: 2,
      title: 'Site Bandung - Cell Down Resolution',
      requester: 'Jane Smith',
      department: 'Technical Support',
      status: 'approved',
      priority: 'medium',
      submittedDate: '2024-01-14 14:30:00',
      description: 'Approved cell down resolution for Bandung site'
    },
    {
      id: 3,
      title: 'Site Surabaya - Maintenance Request',
      requester: 'Bob Johnson',
      department: 'Maintenance',
      status: 'rejected',
      priority: 'low',
      submittedDate: '2024-01-13 11:15:00',
      description: 'Rejected maintenance request for Surabaya site'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle sx={{ fontSize: 24, color: '#4caf50' }} />;
      case 'rejected':
        return <Cancel sx={{ fontSize: 24, color: '#f44336' }} />;
      case 'pending':
        return <Pending sx={{ fontSize: 24, color: '#ff9800' }} />;
      default:
        return <Pending sx={{ fontSize: 24, color: '#757575' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const handleApprove = (id: number) => {
    console.log('Approving request:', id);
    // Implementasi approval logic
  };

  const handleReject = (id: number) => {
    console.log('Rejecting request:', id);
    // Implementasi rejection logic
  };

  const handleViewDetails = (id: number) => {
    console.log('Viewing details for request:', id);
    // Implementasi view details logic
  };

  return (
    <AdminGuard>
      <Box p={{ xs: 2, md: 4 }} sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
        {/* Header Section */}
        <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }} elevation={3}>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight={700} mb={2} sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              Approval Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
              Review and manage approval requests for availability and cell down issues
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
              Admin and Super Admin access - Manage system approvals
            </Typography>
          </Box>
        </Paper>

        {/* Approval Cards Grid */}
        <Grid container spacing={3}>
          {approvals.map((approval) => (
            <Grid item xs={12} md={6} lg={4} key={approval.id}>
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
                        {approval.title}
                      </Typography>
                      <Chip 
                        label={approval.status.toUpperCase()} 
                        size="small" 
                        color={getStatusColor(approval.status) as any}
                        icon={getStatusIcon(approval.status)}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Chip 
                      label={approval.priority.toUpperCase()} 
                      size="small" 
                      sx={{ 
                        bgcolor: getPriorityColor(approval.priority), 
                        color: 'white',
                        fontWeight: 600
                      }} 
                    />
                  </Box>

                  {/* Requester Info */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                      <AdminPanelSettings />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {approval.requester}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {approval.department}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" mb={2} sx={{ flexGrow: 1 }}>
                    {approval.description}
                  </Typography>

                  {/* Submitted Date */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Submitted:
                    </Typography>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      {approval.submittedDate}
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ mt: 'auto' }}>
                    {approval.status === 'pending' && (
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            size="small"
                            onClick={() => handleApprove(approval.id)}
                            startIcon={<CheckCircle />}
                          >
                            Approve
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            variant="contained"
                            color="error"
                            fullWidth
                            size="small"
                            onClick={() => handleReject(approval.id)}
                            startIcon={<Cancel />}
                          >
                            Reject
                          </Button>
                        </Grid>
                      </Grid>
                    )}
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={() => handleViewDetails(approval.id)}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Stats */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mt: 4, borderRadius: 3, background: 'rgba(255,255,255,0.9)' }} elevation={2}>
          <Typography variant="h6" fontWeight={600} mb={2} textAlign="center">
            Approval Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#ff9800">1</Typography>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#4caf50">1</Typography>
                <Typography variant="body2" color="text.secondary">Approved</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#f44336">1</Typography>
                <Typography variant="body2" color="text.secondary">Rejected</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2}>
                <Typography variant="h4" fontWeight={700} color="#757575">3</Typography>
                <Typography variant="body2" color="text.secondary">Total</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </AdminGuard>
  );
};

export default ApprovalPage; 