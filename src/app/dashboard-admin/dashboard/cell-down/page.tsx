'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  alpha,
  Stack
} from '@mui/material';
import { Refresh as RefreshIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { Chart } from 'react-google-charts';
import { CellDownData, mapFirestoreData, extractWeekFromTimestamp } from '../../../../utils/cellDownDataMapper';
import TrendCellDownKalimantanChart from './components/TrendCellDownKalimantanChart';

export default function CellDownDashboardPage() {
  const [cellDownData, setCellDownData] = useState<CellDownData[]>([]);
  const [filteredData, setFilteredData] = useState<CellDownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekFilter, setWeekFilter] = useState<string>('');
  const [nopFilter, setNopFilter] = useState<string>('');

  useEffect(() => {
    fetchCellDownData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cellDownData, weekFilter, nopFilter]);

  const fetchCellDownData = async () => {
    try {
      console.log('Fetching cell down data...');
      const q = query(collection(db, 'data_celldown'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: CellDownData[] = [];
      
      console.log(`Found ${querySnapshot.size} documents`);
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        console.log('Document data:', docData);
        const mappedData = mapFirestoreData(docData, doc.id);
         
        // Extract week from createdAt timestamp if not already present
        if (!mappedData.week && mappedData.createdAt) {
          mappedData.week = extractWeekFromTimestamp(mappedData.createdAt);
        }
        
        // Fallback: if still no week, create a default one
        if (!mappedData.week) {
          const now = new Date();
          const year = now.getFullYear();
          const weekNumber = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
          mappedData.week = `Week ${weekNumber}, ${year}`;
        }
        
        data.push(mappedData);
      });
      
      console.log('Processed data:', data);
      setCellDownData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cellDownData];

    if (weekFilter) {
      filtered = filtered.filter(item => {
        if (!item.week) return false;
        
        // Handle both string and number week formats
        let itemWeek = '';
        if (typeof item.week === 'string') {
          itemWeek = item.week.trim();
        } else if (typeof item.week === 'number') {
          itemWeek = `W${item.week}`;
        }
        
        return itemWeek === weekFilter;
      });
    }

    if (nopFilter) {
      filtered = filtered.filter(item => 
        item.nop && typeof item.nop === 'string' && item.nop.toLowerCase().includes(nopFilter.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setWeekFilter('');
    setNopFilter('');
  };

  // Get unique values for filter options
  const getUniqueWeeks = () => {
    console.log('getUniqueWeeks called with cellDownData length:', cellDownData.length);
    console.log('Sample cellDownData:', cellDownData.slice(0, 3).map(item => ({ week: item.week, weekType: typeof item.week, createdAt: item.createdAt })));
    
    const weeks = cellDownData
      .map(item => {
        let weekValue = null;
        
        // Handle different week formats
        if (item.week) {
          if (typeof item.week === 'string' && item.week.trim()) {
            weekValue = item.week.trim();
            console.log(`Using existing week string: ${weekValue}`);
          } else if (typeof item.week === 'number') {
            weekValue = `W${item.week}`;
            console.log(`Converting number week to string: ${weekValue}`);
          }
        }
        
        // If no week but we have createdAt, try to extract it
        if (!weekValue && item.createdAt) {
          const extractedWeek = extractWeekFromTimestamp(item.createdAt);
          if (extractedWeek) {
            weekValue = extractedWeek;
            console.log(`Extracted week from createdAt: ${weekValue}`);
          }
        }
        
        return weekValue;
      })
      .filter(week => week && week.trim())
      .filter((week, index, arr) => arr.indexOf(week) === index)
      .sort((a, b) => {
        // Sort weeks properly (W1, W2, W3, etc.)
        const aNum = parseInt(a.replace('W', ''));
        const bNum = parseInt(b.replace('W', ''));
        return aNum - bNum;
      });
    
    console.log('Final available weeks:', weeks);
    
    // If no weeks found, create some default ones for testing
    if (weeks.length === 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const defaultWeeks = [
        `W1`,
        `W2`,
        `W3`,
        `W4`,
        `W5`
      ];
      console.log('No weeks found, using default weeks:', defaultWeeks);
      return defaultWeeks;
    }
    
    return weeks;
  };

  const getUniqueNOPs = () => {
    const nops = cellDownData
      .map(item => item.nop)
      .filter(nop => nop && typeof nop === 'string' && nop.trim())
      .filter((nop, index, arr) => arr.indexOf(nop) === index)
      .sort();
    return nops;
  };

  // Generate aging categories for remaining open tables
  const getRemainingOpenAgingCategories = () => {
    return [
      { label: '1-3 Days', min: 1, max: 3 },
      { label: '4-7 Days', min: 4, max: 7 },
      { label: '8-30 Days', min: 8, max: 30 },
      { label: '30-60 Days', min: 30, max: 60 },
      { label: '>60 Days', min: 60, max: Infinity }
    ];
  };

  // Process data for charts and tables using filtered data
  const processData = () => {
    if (!filteredData.length) return {};

    // Group by week
    const weeklyData = filteredData.reduce((acc, item) => {
      if (!item.week) return acc;
      
      // Handle both string and number week formats
      let weekKey = '';
      if (typeof item.week === 'string') {
        weekKey = item.week.trim();
      } else if (typeof item.week === 'number') {
        weekKey = `W${item.week}`;
      } else {
        return acc;
      }
      
      if (!acc[weekKey]) {
        acc[weekKey] = { total: 0, progress: 0, status: 0 };
      }
      acc[weekKey].total++;
      if (item.progress && typeof item.progress === 'string' && item.progress.toLowerCase() === 'done') acc[weekKey].progress++;
      if (item.status && typeof item.status === 'string' && item.status.toLowerCase() === 'close') acc[weekKey].status++;
      return acc;
    }, {} as Record<string, { total: number; progress: number; status: number }>);

    // Root cause data
    const rootCauseData = filteredData.reduce((acc, item) => {
      if (item.rootCause && typeof item.rootCause === 'string' && item.rootCause.trim()) {
        acc[item.rootCause] = (acc[item.rootCause] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // PIC Dept data
    const picDeptData = filteredData.reduce((acc, item) => {
      if (item.picDept && typeof item.picDept === 'string' && item.picDept.trim()) {
        acc[item.picDept] = (acc[item.picDept] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Site Class data
    const siteClassData = filteredData.reduce((acc, item) => {
      if (item.siteClass && typeof item.siteClass === 'string' && item.siteClass.trim()) {
        acc[item.siteClass] = (acc[item.siteClass] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // NOP data
    const nopData = filteredData.reduce((acc, item) => {
      if (item.nop && typeof item.nop === 'string' && item.nop.trim()) {
        if (!acc[item.nop]) {
          acc[item.nop] = { total: 0, progress: 0, status: 0 };
        }
        acc[item.nop].total++;
        if (item.progress && typeof item.progress === 'string' && item.progress.toLowerCase() === 'done') acc[item.nop].progress++;
        if (item.status && typeof item.status === 'string' && item.status.toLowerCase() === 'close') acc[item.nop].status++;
      }
      return acc;
    }, {} as Record<string, { total: number; progress: number; status: number }>);


    // Remaining Open data processing
    const remainingOpenAgingCategories = getRemainingOpenAgingCategories();
    
    // Filter for open items only
    const openItems = filteredData.filter(item => 
      item.status && typeof item.status === 'string' && item.status.toLowerCase() !== 'close'
    );

    // Remaining Open By NOP
    const remainingOpenByNOP = openItems.reduce((acc, item) => {
      if (item.nop && typeof item.nop === 'string' && item.nop.trim() && item.agingDown !== undefined) {
        if (!acc[item.nop]) {
          acc[item.nop] = remainingOpenAgingCategories.reduce((catAcc, category) => {
            catAcc[category.label] = 0;
            return catAcc;
          }, {} as Record<string, number>);
        }
        
        const aging = Number(item.agingDown);
        if (!isNaN(aging)) {
          for (const category of remainingOpenAgingCategories) {
            if (aging >= category.min && (category.max === Infinity || aging <= category.max)) {
              acc[item.nop][category.label]++;
              break;
            }
          }
        }
      }
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Remaining Open By Site Class
    const remainingOpenBySiteClass = openItems.reduce((acc, item) => {
      if (item.siteClass && typeof item.siteClass === 'string' && item.siteClass.trim() && item.agingDown !== undefined) {
        if (!acc[item.siteClass]) {
          acc[item.siteClass] = remainingOpenAgingCategories.reduce((catAcc, category) => {
            catAcc[category.label] = 0;
            return catAcc;
          }, {} as Record<string, number>);
        }
        
        const aging = Number(item.agingDown);
        if (!isNaN(aging)) {
          for (const category of remainingOpenAgingCategories) {
            if (aging >= category.min && (category.max === Infinity || aging <= category.max)) {
              acc[item.siteClass][category.label]++;
              break;
            }
          }
        }
      }
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Remaining Open By Root Cause
    const remainingOpenByRootCause = openItems.reduce((acc, item) => {
      if (item.rootCause && typeof item.rootCause === 'string' && item.rootCause.trim() && item.agingDown !== undefined) {
        if (!acc[item.rootCause]) {
          acc[item.rootCause] = remainingOpenAgingCategories.reduce((catAcc, category) => {
            catAcc[category.label] = 0;
            return catAcc;
          }, {} as Record<string, number>);
        }
        
        const aging = Number(item.agingDown);
        if (!isNaN(aging)) {
          for (const category of remainingOpenAgingCategories) {
            if (aging >= category.min && (category.max === Infinity || aging <= category.max)) {
              acc[item.rootCause][category.label]++;
              break;
            }
          }
        }
      }
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Remaining Open By Progress
    const remainingOpenByProgress = openItems.reduce((acc, item) => {
      if (item.progress && typeof item.progress === 'string' && item.progress.trim() && item.agingDown !== undefined) {
        if (!acc[item.progress]) {
          acc[item.progress] = remainingOpenAgingCategories.reduce((catAcc, category) => {
            catAcc[category.label] = 0;
            return catAcc;
          }, {} as Record<string, number>);
        }
        
        const aging = Number(item.agingDown);
        if (!isNaN(aging)) {
          for (const category of remainingOpenAgingCategories) {
            if (aging >= category.min && (category.max === Infinity || aging <= category.max)) {
              acc[item.progress][category.label]++;
              break;
            }
          }
        }
      }
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return {
      weeklyData,
      rootCauseData,
      picDeptData,
      siteClassData,
      nopData,
      remainingOpenByNOP,
      remainingOpenBySiteClass,
      remainingOpenByRootCause,
      remainingOpenByProgress,
      remainingOpenAgingCategories
    };
  };

  const data = processData();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!cellDownData.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">No data available. Please check your Firestore collection.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 2, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
            Cell Down Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and analyze cell down incidents across network operations
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={fetchCellDownData} 
            sx={{ 
              backgroundColor: '#1976d2', 
              color: 'white',
              '&:hover': { backgroundColor: '#1565c0' }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filter Section */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid rgba(25, 118, 210, 0.1)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              backgroundColor: alpha('#1976d2', 0.1),
              mr: 2
            }}>
              <FilterIcon sx={{ color: '#1976d2', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              color: '#1a1a1a',
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Filters
            </Typography>
          </Box>
          
          <Divider sx={{ 
            mb: 3, 
            borderColor: alpha('#1976d2', 0.2),
            '&::before, &::after': {
              borderColor: alpha('#1976d2', 0.2)
            }
          }} />
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel sx={{ 
                  color: '#666',
                  fontWeight: 500,
                  '&.Mui-focused': { color: '#1976d2' }
                }}>
                  Filter by Week
                </InputLabel>
                <Select
                  value={weekFilter}
                  label="Filter by Week"
                  onChange={(e: SelectChangeEvent) => setWeekFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': { 
                      borderColor: '#e0e0e0',
                      borderWidth: 2
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': { 
                      borderColor: '#1976d2',
                      borderWidth: 2
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                      borderWidth: 2
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>All Weeks</em>
                  </MenuItem>
                  {(() => {
                    const weeks = getUniqueWeeks();
                    console.log('Rendering weeks in Select:', weeks);
                    return weeks.map((week) => (
                      <MenuItem key={week} value={week}>
                        {week}
                      </MenuItem>
                    ));
                  })()}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel sx={{ 
                  color: '#666',
                  fontWeight: 500,
                  '&.Mui-focused': { color: '#1976d2' }
                }}>
                  Filter by NOP
                </InputLabel>
                <Select
                  value={nopFilter}
                  label="Filter by NOP"
                  onChange={(e: SelectChangeEvent) => setNopFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': { 
                      borderColor: '#e0e0e0',
                      borderWidth: 2
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': { 
                      borderColor: '#1976d2',
                      borderWidth: 2
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                      borderWidth: 2
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>All NOPs</em>
                  </MenuItem>
                  {getUniqueNOPs().map((nop) => (
                    <MenuItem key={nop} value={nop}>
                      {nop}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack spacing={2} alignItems="flex-end">
                <Button 
                  variant="outlined" 
                  onClick={clearFilters}
                  size="medium"
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    borderColor: '#e0e0e0',
                    color: '#666',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { 
                      borderColor: '#1976d2', 
                      color: '#1976d2',
                      backgroundColor: alpha('#1976d2', 0.05)
                    }
                  }}
                >
                  Clear Filters
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Trend Cell Down Kalimantan Chart */}
        <Grid item xs={12}>
          <TrendCellDownKalimantanChart data={cellDownData} />
        </Grid>


        {/* Summary Cell Down Table */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Summary Cell Down
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>NOP</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Open</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Close</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.nopData || {}).map(([nop, counts]) => {
                      const openCount = counts.total - counts.status;
                      const progress = counts.total > 0 ? ((counts.status / counts.total) * 100).toFixed(0) : '0';
                      return (
                        <TableRow key={nop} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{nop}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{counts.total}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{openCount}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{counts.status}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1976d2' }}>{progress}%</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>TOTAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.nopData || {}).reduce((a, b) => a + b.total, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.nopData || {}).reduce((a, b) => a + (b.total - b.status), 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.nopData || {}).reduce((a, b) => a + b.status, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {(() => {
                          const total = Object.values(data.nopData || {}).reduce((a, b) => a + b.total, 0);
                          const status = Object.values(data.nopData || {}).reduce((a, b) => a + b.status, 0);
                          return total > 0 ? ((status / total) * 100).toFixed(0) : '0';
                        })()}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* PIC Dept and Site Class Tables */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                PIC Department
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Department</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.picDeptData || {}).map(([pic, count]) => (
                      <TableRow key={pic} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                        <TableCell sx={{ fontSize: '0.875rem' }}>{pic || '(blank)'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{count}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Grand Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.picDeptData || {}).reduce((a, b) => a + b, 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Site Classification
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Site Class</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.siteClassData || {}).map(([siteClass, count]) => (
                      <TableRow key={siteClass} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                        <TableCell sx={{ fontSize: '0.875rem' }}>{siteClass}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{count}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Grand Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.siteClassData || {}).reduce((a, b) => a + b, 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Remaining Open By NOP */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Remaining Open By NOP
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>NOP</TableCell>
                      {data.remainingOpenAgingCategories?.map((category) => (
                        <TableCell key={category.label} align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>
                          {category.label}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.remainingOpenByNOP || {}).map(([nop, aging]) => {
                      const total = Object.values(aging).reduce((a, b) => a + b, 0);
                      return (
                        <TableRow key={nop} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{nop}</TableCell>
                          {data.remainingOpenAgingCategories?.map((category) => (
                            <TableCell key={category.label} align="right" sx={{ fontSize: '0.875rem' }}>
                              {aging[category.label] || 0}
                            </TableCell>
                          ))}
                          <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{total}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>TOTAL</TableCell>
                      {data.remainingOpenAgingCategories?.map((category) => (
                        <TableCell key={category.label} align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {Object.values(data.remainingOpenByNOP || {}).reduce((a, b) => a + (b[category.label] || 0), 0)}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.remainingOpenByNOP || {}).reduce((a, b) => a + Object.values(b).reduce((c, d) => c + d, 0), 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Remaining Open By Site Class */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Remaining Open By Site Class
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Site Class</TableCell>
                      {data.remainingOpenAgingCategories?.map((category) => (
                        <TableCell key={category.label} align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>
                          {category.label}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.remainingOpenBySiteClass || {}).map(([siteClass, aging]) => {
                      const total = Object.values(aging).reduce((a, b) => a + b, 0);
                      return (
                        <TableRow key={siteClass} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{siteClass}</TableCell>
                          {data.remainingOpenAgingCategories?.map((category) => (
                            <TableCell key={category.label} align="right" sx={{ fontSize: '0.875rem' }}>
                              {aging[category.label] || 0}
                            </TableCell>
                          ))}
                          <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{total}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>TOTAL</TableCell>
                      {data.remainingOpenAgingCategories?.map((category) => (
                        <TableCell key={category.label} align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {Object.values(data.remainingOpenBySiteClass || {}).reduce((a, b) => a + (b[category.label] || 0), 0)}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.remainingOpenBySiteClass || {}).reduce((a, b) => a + Object.values(b).reduce((c, d) => c + d, 0), 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Remaining Open By Root Cause */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Remaining Open By Root Cause
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Root Cause</TableCell>
                      {data.remainingOpenAgingCategories?.map((category) => (
                        <TableCell key={category.label} align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>
                          {category.label}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.remainingOpenByRootCause || {}).map(([rootCause, aging]) => {
                      const total = Object.values(aging).reduce((a, b) => a + b, 0);
                      return (
                        <TableRow key={rootCause} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{rootCause}</TableCell>
                          {data.remainingOpenAgingCategories?.map((category) => (
                            <TableCell key={category.label} align="right" sx={{ fontSize: '0.875rem' }}>
                              {aging[category.label] || 0}
                            </TableCell>
                          ))}
                          <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{total}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>TOTAL</TableCell>
                      {data.remainingOpenAgingCategories?.map((category) => (
                        <TableCell key={category.label} align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {Object.values(data.remainingOpenByRootCause || {}).reduce((a, b) => a + (b[category.label] || 0), 0)}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.remainingOpenByRootCause || {}).reduce((a, b) => a + Object.values(b).reduce((c, d) => c + d, 0), 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Remaining Open By Progress */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Remaining Open By Progress
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Progress</TableCell>
                      {data.remainingOpenAgingCategories?.map((category) => (
                        <TableCell key={category.label} align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>
                          {category.label}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.remainingOpenByProgress || {}).map(([progress, aging]) => {
                      const total = Object.values(aging).reduce((a, b) => a + b, 0);
                      return (
                        <TableRow key={progress} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{progress}</TableCell>
                          {data.remainingOpenAgingCategories?.map((category) => (
                            <TableCell key={category.label} align="right" sx={{ fontSize: '0.875rem' }}>
                              {aging[category.label] || 0}
                            </TableCell>
                          ))}
                          <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{total}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>TOTAL</TableCell>
                      {data.remainingOpenAgingCategories?.map((category) => (
                        <TableCell key={category.label} align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {Object.values(data.remainingOpenByProgress || {}).reduce((a, b) => a + (b[category.label] || 0), 0)}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.remainingOpenByProgress || {}).reduce((a, b) => a + Object.values(b).reduce((c, d) => c + d, 0), 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}
