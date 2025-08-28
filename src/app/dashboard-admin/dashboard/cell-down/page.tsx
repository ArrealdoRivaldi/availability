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
  alpha
} from '@mui/material';
import { Refresh as RefreshIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { Chart } from 'react-google-charts';
import { CellDownData, mapFirestoreData, extractWeekFromTimestamp } from '../../../../utils/cellDownDataMapper';

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
      filtered = filtered.filter(item => 
        item.week && typeof item.week === 'string' && item.week.toLowerCase().includes(weekFilter.toLowerCase())
      );
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
    const weeks = cellDownData
      .map(item => item.week)
      .filter(week => week && typeof week === 'string' && week.trim())
      .filter((week, index, arr) => arr.indexOf(week) === index)
      .sort();
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

  // Process data for charts and tables using filtered data
  const processData = () => {
    if (!filteredData.length) return {};

    // Group by week
    const weeklyData = filteredData.reduce((acc, item) => {
      if (!item.week || typeof item.week !== 'string') return acc;
      if (!acc[item.week]) {
        acc[item.week] = { total: 0, progress: 0, status: 0 };
      }
      acc[item.week].total++;
      if (item.progress && typeof item.progress === 'string' && item.progress.toLowerCase() === 'done') acc[item.week].progress++;
      if (item.status && typeof item.status === 'string' && item.status.toLowerCase() === 'close') acc[item.week].status++;
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

    // Aging data
    const agingData = filteredData.reduce((acc, item) => {
      if (item.nop && typeof item.nop === 'string' && item.nop.trim() && item.agingDown !== undefined) {
        if (!acc[item.nop]) {
          acc[item.nop] = { '8-30': 0, '30-60': 0, '>60': 0 };
        }
        if (item.agingDown >= 8 && item.agingDown <= 30) {
          acc[item.nop]['8-30']++;
        } else if (item.agingDown > 30 && item.agingDown <= 60) {
          acc[item.nop]['30-60']++;
        } else if (item.agingDown > 60) {
          acc[item.nop]['>60']++;
        }
      }
      return acc;
    }, {} as Record<string, { '8-30': number; '30-60': number; '>60': number }>);

    return {
      weeklyData,
      rootCauseData,
      picDeptData,
      siteClassData,
      nopData,
      agingData
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
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1, color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
              Filters
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666' }}>Filter by Week</InputLabel>
                <Select
                  value={weekFilter}
                  label="Filter by Week"
                  onChange={(e: SelectChangeEvent) => setWeekFilter(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
                  }}
                >
                  <MenuItem value="">
                    <em>All Weeks</em>
                  </MenuItem>
                  {getUniqueWeeks().map((week) => (
                    <MenuItem key={week} value={week}>
                      {week}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666' }}>Filter by NOP</InputLabel>
                <Select
                  value={nopFilter}
                  label="Filter by NOP"
                  onChange={(e: SelectChangeEvent) => setNopFilter(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' }
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
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={clearFilters}
                  size="small"
                  sx={{ 
                    borderColor: '#e0e0e0',
                    color: '#666',
                    '&:hover': { borderColor: '#1976d2', color: '#1976d2' }
                  }}
                >
                  Clear Filters
                </Button>
                <Chip 
                  label={`${filteredData.length} of ${cellDownData.length} records`}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    backgroundColor: alpha('#1976d2', 0.1),
                    borderColor: '#1976d2',
                    color: '#1976d2'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Trend Cell Down Chart */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Trend Cell Down
              </Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="300px"
                data={
                  Object.keys(data.weeklyData || {}).length > 0 
                    ? [
                        ['Week', 'Cell Down', 'Progress', 'Status'],
                        ...Object.entries(data.weeklyData || {}).map(([week, counts]) => [
                          week,
                          counts.total,
                          counts.progress,
                          counts.status
                        ])
                      ]
                    : [['Week', 'Cell Down', 'Progress', 'Status'], ['No Data', 0, 0, 0]]
                }
                options={{
                  title: '',
                  chartArea: { width: '70%', height: '75%' },
                  hAxis: { 
                    title: 'Week', 
                    titleTextStyle: { fontSize: 12, color: '#666' },
                    textStyle: { fontSize: 11, color: '#666' }
                  },
                  vAxis: { 
                    title: 'Count', 
                    titleTextStyle: { fontSize: 12, color: '#666' },
                    textStyle: { fontSize: 11, color: '#666' }
                  },
                  seriesType: 'bars',
                  series: { 1: { type: 'bars' }, 2: { type: 'bars' } },
                  colors: ['#1976d2', '#ff9800', '#4caf50'],
                  legend: { 
                    position: 'top',
                    textStyle: { fontSize: 12, color: '#666' }
                  },
                  fontSize: 11,
                  backgroundColor: 'transparent',
                  bar: { groupWidth: '70%' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Root Cause Chart */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Root Cause Distribution
              </Typography>
              <Chart
                chartType="BarChart"
                width="100%"
                height="300px"
                data={
                  Object.keys(data.rootCauseData || {}).length > 0
                    ? [
                        ['Root Cause', 'Count'],
                        ...Object.entries(data.rootCauseData || {}).map(([cause, count]) => [
                          cause,
                          count
                        ])
                      ]
                    : [['Root Cause', 'Count'], ['No Data', 0]]
                }
                options={{
                  title: '',
                  chartArea: { width: '70%', height: '75%' },
                  hAxis: { 
                    title: 'Count', 
                    titleTextStyle: { fontSize: 12, color: '#666' },
                    textStyle: { fontSize: 11, color: '#666' }
                  },
                  vAxis: { 
                    title: 'Root Cause', 
                    titleTextStyle: { fontSize: 12, color: '#666' },
                    textStyle: { fontSize: 11, color: '#666' }
                  },
                  colors: ['#1976d2'],
                  legend: { 
                    position: 'top',
                    textStyle: { fontSize: 12, color: '#666' }
                  },
                  fontSize: 11,
                  backgroundColor: 'transparent',
                  bar: { groupWidth: '70%' }
                }}
              />
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

        {/* Cell Down Progress by ENOM Closed Alarm */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                Cell Down Progress by ENOM Closed Alarm
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>NOP</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Cell Down</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>Progress</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>ENOM Closed</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.nopData || {}).map(([nop, counts]) => {
                      const percentage = counts.total > 0 ? ((counts.status / counts.total) * 100).toFixed(2) : '0.00';
                      return (
                        <TableRow key={nop} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{nop}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{counts.total}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{counts.progress}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{counts.status}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1976d2' }}>{percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Grand Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.nopData || {}).reduce((a, b) => a + b.total, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.nopData || {}).reduce((a, b) => a + b.progress, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.nopData || {}).reduce((a, b) => a + b.status, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {(() => {
                          const total = Object.values(data.nopData || {}).reduce((a, b) => a + b.total, 0);
                          const status = Object.values(data.nopData || {}).reduce((a, b) => a + b.status, 0);
                          return total > 0 ? ((status / total) * 100).toFixed(2) : '0.00';
                        })()}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Aging Table */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
                NOP Aging Analysis
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: '#f0f0f0' } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>NOP</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>8-30 Days</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>30-60 Days</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem' }}>&gt;60 Days</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.agingData || {}).map(([nop, aging]) => (
                      <TableRow key={nop} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                        <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{nop}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{aging['8-30']}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{aging['30-60']}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{aging['>60']}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Grand Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.agingData || {}).reduce((a, b) => a + b['8-30'], 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.agingData || {}).reduce((a, b) => a + b['30-60'], 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {Object.values(data.agingData || {}).reduce((a, b) => a + b['>60'], 0)}
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
