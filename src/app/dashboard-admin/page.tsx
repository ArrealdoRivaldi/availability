'use client';
import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CardActionArea, Avatar } from '@mui/material';
import { 
  Assessment, 
  Timeline, 
  Analytics, 
  Dashboard as DashboardIcon,
  TrendingUp,
  BarChart,
  PieChart,
  TableChart
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const DashboardLanding = () => {
  const router = useRouter();

  const dashboardCards = [
    {
      title: 'Availability Dashboard',
      description: 'Monitor availability metrics, progress tracking, and performance analytics',
      icon: <Assessment sx={{ fontSize: 40, color: '#1976d2' }} />,
      color: '#1976d2',
      path: '/dashboard-admin/dashboard/Availability',
      features: ['Status Distribution', 'Progress Stepper', 'Dept PIC Analysis', 'NOP & Root Cause Tables']
    },
    {
      title: 'Cell Down Dashboard',
      description: 'Track cell down incidents, resolution progress, and downtime analytics',
      icon: <Timeline sx={{ fontSize: 40, color: '#388e3c' }} />,
      color: '#388e3c',
      path: '/dashboard-admin/dashboard/Cell Down',
      features: ['Incident Tracking', 'Resolution Time', 'Impact Analysis', 'Performance Metrics']
    },
    {
      title: 'Analytics Overview',
      description: 'Comprehensive data analysis and reporting dashboard',
      icon: <Analytics sx={{ fontSize: 40, color: '#f57c00' }} />,
      color: '#f57c00',
      path: '/dashboard-admin/dashboard/Analytics',
      features: ['Data Visualization', 'Trend Analysis', 'Custom Reports', 'Export Options']
    },
    {
      title: 'Performance Metrics',
      description: 'Real-time performance monitoring and KPI tracking',
      icon: <TrendingUp sx={{ fontSize: 40, color: '#7b1fa2' }} />,
      color: '#7b1fa2',
      path: '/dashboard-admin/dashboard/Performance',
      features: ['KPI Dashboard', 'Real-time Monitoring', 'Alert System', 'Historical Data']
    },
    {
      title: 'Data Management',
      description: 'Manage and organize dashboard data and configurations',
      icon: <TableChart sx={{ fontSize: 40, color: '#d32f2f' }} />,
      color: '#d32f2f',
      path: '/dashboard-admin/data',
      features: ['Data Import/Export', 'Configuration Settings', 'User Management', 'System Logs']
    },
    {
      title: 'Approval System',
      description: 'Manage approval workflows and decision processes',
      icon: <BarChart sx={{ fontSize: 40, color: '#00838f' }} />,
      color: '#00838f',
      path: '/dashboard-admin/approval',
      features: ['Workflow Management', 'Approval Queue', 'Decision Tracking', 'Audit Trail']
    }
  ];

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <Box p={{ xs: 2, md: 4 }} sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      {/* Header Section */}
      <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }} elevation={3}>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight={700} mb={2} sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            Dashboard Admin Portal
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
            Welcome to the comprehensive dashboard management system
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
            Select a dashboard below to access detailed analytics and management tools
          </Typography>
        </Box>
      </Paper>

      {/* Dashboard Cards Grid */}
      <Grid container spacing={3}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
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
              <CardActionArea 
                onClick={() => handleCardClick(card.path)}
                sx={{ height: '100%', p: 0 }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Icon and Title */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: `${card.color}15`, mr: 2, width: 60, height: 60 }}>
                      {card.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} color={card.color}>
                      {card.title}
                    </Typography>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" mb={3} sx={{ flexGrow: 1 }}>
                    {card.description}
                  </Typography>

                  {/* Features List */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.primary">
                      Key Features:
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {card.features.map((feature, idx) => (
                        <Typography 
                          key={idx} 
                          component="li" 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ mb: 0.5, fontSize: '0.875rem' }}
                        >
                          {feature}
                        </Typography>
                      ))}
                    </Box>
                  </Box>

                  {/* Action Indicator */}
                  <Box 
                    sx={{ 
                      mt: 2, 
                      pt: 2, 
                      borderTop: '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Click to access
                    </Typography>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: card.color,
                        animation: 'pulse 2s infinite'
                      }} 
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats Section */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 4, borderRadius: 3, background: 'rgba(255,255,255,0.9)' }} elevation={2}>
        <Typography variant="h6" fontWeight={600} mb={2} textAlign="center">
          Quick Access
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center" p={2}>
              <Typography variant="h4" fontWeight={700} color="#1976d2">6</Typography>
              <Typography variant="body2" color="text.secondary">Available Dashboards</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center" p={2}>
              <Typography variant="h4" fontWeight={700} color="#388e3c">24/7</Typography>
              <Typography variant="body2" color="text.secondary">Real-time Access</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center" p={2}>
              <Typography variant="h4" fontWeight={700} color="#f57c00">100%</Typography>
              <Typography variant="body2" color="text.secondary">Data Accuracy</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center" p={2}>
              <Typography variant="h4" fontWeight={700} color="#7b1fa2">∞</Typography>
              <Typography variant="body2" color="text.secondary">Customization</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default DashboardLanding; 