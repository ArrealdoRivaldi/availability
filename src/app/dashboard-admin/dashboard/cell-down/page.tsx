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
  const [agingRangeFilter, setAgingRangeFilter] = useState<[number, number]>([0, 100]);
  const [selectedAgingCategory, setSelectedAgingCategory] = useState<string>('');

  useEffect(() => {
    fetchCellDownData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cellDownData, weekFilter, nopFilter, agingRangeFilter, selectedAgingCategory]);

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

    // Filter by aging down category
    if (selectedAgingCategory) {
      const agingCategories = getAgingCategories();
      const selectedCategory = agingCategories.find(cat => cat.label === selectedAgingCategory);
      
      if (selectedCategory) {
        filtered = filtered.filter(item => {
          if (item.agingDown === undefined || item.agingDown === null) return false;
          
          const aging = Number(item.agingDown);
          if (isNaN(aging)) return false;
          
          return aging >= selectedCategory.min && (selectedCategory.max === Infinity || aging <= selectedCategory.max);
        });
      }
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setWeekFilter('');
    setNopFilter('');
    setAgingRangeFilter([0, 100]);
    setSelectedAgingCategory('');
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

  // Generate dynamic aging categories based on filter range
  const getAgingCategories = () => {
    const minAging = agingRangeFilter[0];
    const maxAging = agingRangeFilter[1];
    
    // If no range is set, use default categories
    if (minAging === 0 && maxAging === 100) {
      return [
        { label: '8-30 Days', min: 8, max: 30 },
        { label: '30-60 Days', min: 30, max: 60 },
        { label: '>60 Days', min: 60, max: Infinity }
      ];
    }
    
    // Create dynamic categories based on the range
    const range = maxAging - minAging;
    const categories = [];
    
    if (range <= 30) {
      // Small range: create 3 equal parts
      const step = Math.ceil(range / 3);
      categories.push({ label: `${minAging}-${minAging + step} Days`, min: minAging, max: minAging + step });
      categories.push({ label: `${minAging + step + 1}-${minAging + step * 2} Days`, min: minAging + step + 1, max: minAging + step * 2 });
      categories.push({ label: `>${minAging + step * 2} Days`, min: minAging + step * 2 + 1, max: Infinity });
    } else if (range <= 60) {
      // Medium range: create 4 equal parts
      const step = Math.ceil(range / 4);
      categories.push({ label: `${minAging}-${minAging + step} Days`, min: minAging, max: minAging + step });
      categories.push({ label: `${minAging + step + 1}-${minAging + step * 2} Days`, min: minAging + step + 1, max: minAging + step * 2 });
      categories.push({ label: `${minAging + step * 2 + 1}-${minAging + step * 3} Days`, min: minAging + step * 2 + 1, max: minAging + step * 3 });
      categories.push({ label: `>${minAging + step * 3} Days`, min: minAging + step * 3 + 1, max: Infinity });
    } else {
      // Large range: create 5 equal parts
      const step = Math.ceil(range / 5);
      categories.push({ label: `${minAging}-${minAging + step} Days`, min: minAging, max: minAging + step });
      categories.push({ label: `${minAging + step + 1}-${minAging + step * 2} Days`, min: minAging + step + 1, max: minAging + step * 2 });
      categories.push({ label: `${minAging + step * 2 + 1}-${minAging + step * 3} Days`, min: minAging + step * 2 + 1, max: minAging + step * 3 });
      categories.push({ label: `${minAging + step * 3 + 1}-${minAging + step * 4} Days`, min: minAging + step * 3 + 1, max: minAging + step * 4 });
      categories.push({ label: `>${minAging + step * 4} Days`, min: minAging + step * 4 + 1, max: Infinity });
    }
    
    return categories;
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

    // Aging data with dynamic categories
    const agingCategories = getAgingCategories();
    const agingData = filteredData.reduce((acc, item) => {
      if (item.nop && typeof item.nop === 'string' && item.nop.trim() && item.agingDown !== undefined) {
        if (!acc[item.nop]) {
          acc[item.nop] = agingCategories.reduce((catAcc, category) => {
            catAcc[category.label] = 0;
            return catAcc;
          }, {} as Record<string, number>);
        }
        
        const aging = Number(item.agingDown);
        if (!isNaN(aging)) {
          for (const category of agingCategories) {
            if (aging >= category.min && (category.max === Infinity || aging <= category.max)) {
              acc[item.nop][category.label]++;
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
      agingData,
      agingCategories
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
                  {getUniqueWeeks().map((week) => (
                    <MenuItem key={week} value={week}>
                      {week}
                    </MenuItem>
                  ))}
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
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel sx={{ 
                  color: '#666',
                  fontWeight: 500,
                  '&.Mui-focused': { color: '#1976d2' }
                }}>
                  RANGE AGING DOWN
                </InputLabel>
                <Select
                  value={selectedAgingCategory}
                  label="RANGE AGING DOWN"
                  onChange={(e: SelectChangeEvent) => setSelectedAgingCategory(e.target.value)}
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
                    <em>All Categories</em>
                  </MenuItem>
                  {getAgingCategories().map((category) => (
                    <MenuItem key={category.label} value={category.label}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Stack spacing={2} alignItems="center">
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
                <Chip 
                  label={`${filteredData.length} of ${cellDownData.length} records`}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    backgroundColor: alpha('#1976d2', 0.1),
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    height: 32
                  }}
                />
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


      </Grid>
    </Box>
  );
}
