'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

// TypeScript declarations for Chart.js CDN
declare global {
  interface Window {
    Chart: any;
    ChartDataLabels: any;
  }
}

interface CellDownData {
  id: string;
  week?: number | string;
  progress?: string;
  status?: string;
  rootCause?: string;
  picDept?: string; 
  siteClass?: string;
  nop?: string;
  agingDown?: number;
  createdAt?: any;
}

interface TrendCellDownKalimantanChartProps {
  data: CellDownData[];
}

interface ChartData {
  week: string;
  total: number;
  close: number;
  progress: number;
}

const ChartJSBarChart: React.FC<{ data: ChartData[]; visibleStart: number; visibleCount: number }> = ({ 
  data, 
  visibleStart, 
  visibleCount 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    // Load Chart.js from CDN
    const loadChartJS = () => {
      return new Promise((resolve) => {
        if (window.Chart) {
          resolve(window.Chart);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
        script.onload = () => resolve(window.Chart);
        document.head.appendChild(script);
      });
    };

    const loadDataLabelsPlugin = () => {
      return new Promise((resolve) => {
        if (window.Chart && window.Chart.register) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js';
          script.onload = () => {
            if (window.ChartDataLabels) {
              window.Chart.register(window.ChartDataLabels);
            }
            resolve(true);
          };
          document.head.appendChild(script);
        } else {
          resolve(true);
        }
      });
    };

    const createChart = async () => {
      await loadChartJS();
      await loadDataLabelsPlugin();

      if (canvasRef.current && window.Chart) {
        // Destroy existing chart instance properly
        if (chartInstance.current) {
          try {
            chartInstance.current.destroy();
            chartInstance.current = null;
          } catch (error) {
            console.warn('Error destroying chart:', error);
          }
        }

        const ctx = canvasRef.current.getContext('2d');
        if (ctx && data && data.length > 0) {
          // Get visible data slice
          const visibleData = data.slice(visibleStart, visibleStart + visibleCount);
          
          // Validate data structure before creating chart
          const validatedData = visibleData.map(d => ({
            week: d.week || 'Unknown',
            total: typeof d.total === 'number' ? d.total : 0,
            close: typeof d.close === 'number' ? d.close : 0,
            progress: typeof d.progress === 'number' ? d.progress : 0
          }));

          chartInstance.current = new window.Chart(ctx, {
            type: 'bar',
            data: {
              labels: validatedData.map(d => `Week ${d.week}`),
              datasets: [
                {
                  label: 'Total',
                  data: validatedData.map(d => d.total),
                  backgroundColor: '#1976d2',
                  borderColor: '#1976d2',
                  borderWidth: 1,
                },
                {
                  label: 'Close',
                  data: validatedData.map(d => d.close),
                  backgroundColor: '#ff9800',
                  borderColor: '#ff9800',
                  borderWidth: 1,
                },
                {
                  label: 'Progress (%)',
                  data: validatedData.map(d => d.progress),
                  backgroundColor: '#4caf50',
                  borderColor: '#4caf50',
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                intersect: false,
                mode: 'index'
              },
              plugins: {
                legend: {
                  position: 'top',
                  align: 'center',
                  labels: {
                    usePointStyle: true,
                    padding: 25,
                    font: {
                      size: 13,
                      weight: 'bold',
                    },
                  },
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleColor: '#fff',
                  bodyColor: '#fff',
                  borderColor: '#ddd',
                  borderWidth: 1,
                  cornerRadius: 8,
                  displayColors: true,
                  callbacks: {
                    title: function(context: any) {
                      return context[0]?.label || '';
                    },
                    label: function(context: any) {
                      const datasetLabel = context.dataset?.label || '';
                      const value = context.parsed?.y || 0;
                      
                      if (datasetLabel === 'Progress (%)') {
                        return `${datasetLabel}: ${value.toFixed(1)}%`;
                      }
                      return `${datasetLabel}: ${value}`;
                    },
                    afterBody: function(context: any) {
                      if (context && context[0]) {
                        const weekData = context[0];
                        const total = weekData.chart.data.datasets[0].data[weekData.dataIndex] || 0;
                        const close = weekData.chart.data.datasets[1].data[weekData.dataIndex] || 0;
                        const open = total - close;
                        return [
                          `Open: ${open}`,
                          `Completion Rate: ${total > 0 ? ((close / total) * 100).toFixed(1) : 0}%`
                        ];
                      }
                      return [];
                    }
                  }
                },
                datalabels: {
                  display: function(context: any) {
                    const value = context.parsed?.y || 0;
                    const dataIndex = context.dataIndex || 0;
                    const datasetIndex = context.datasetIndex || 0;
                    
                    // Only show labels for significant values
                    if (value === 0) return false;
                    
                    // For Total dataset (index 0): Show every 2nd label and only if value > 50
                    if (datasetIndex === 0) {
                      return dataIndex % 2 === 0 && value > 50;
                    }
                    
                    // For Close dataset (index 1): Show every 2nd label and only if value > 20
                    if (datasetIndex === 1) {
                      return dataIndex % 2 === 0 && value > 20;
                    }
                    
                    // For Progress dataset (index 2): Don't show data labels
                    return false;
                  },
                  color: '#fff',
                  font: {
                    size: 9,
                    weight: 'bold',
                  },
                  anchor: 'center',
                  align: 'center',
                  offset: 0,
                  formatter: (value: number) => {
                    return value.toString();
                  },
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Week',
                    font: {
                      size: 14,
                      weight: 'bold',
                    },
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                      size: 10,
                    },
                    maxTicksLimit: visibleCount,
                  },
                  grid: {
                    display: false,
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Count',
                    font: {
                      size: 14,
                      weight: 'bold',
                    },
                  },
                  beginAtZero: true,
                  grid: {
                    color: '#f0f0f0',
                    lineWidth: 1,
                  },
                  ticks: {
                    font: {
                      size: 11,
                    },
                  },
                },
              },
            },
          });
        }
      }
    };

    createChart();

    // Cleanup
    return () => {
      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
          chartInstance.current = null;
        } catch (error) {
          console.warn('Error destroying chart during cleanup:', error);
        }
      }
    };
  }, [data, visibleStart, visibleCount]);

  return (
    <Box sx={{ height: 500, width: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

const TrendCellDownKalimantanChart: React.FC<TrendCellDownKalimantanChartProps> = ({ data }) => {
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleCount] = useState(12); // Show 12 weeks at a time

  // Process data for the chart - this should show ALL weeks regardless of filters
  const processChartData = (): ChartData[] => {
    try {
      if (!data || data.length === 0) {
        return [];
      }

      // Group data by week
      const weeklyData = data.reduce((acc, item) => {
        if (!item || !item.week) return acc;
        
        // Convert week to string, handling both number and string types
        const week = typeof item.week === 'number' ? item.week.toString() : item.week.toString().trim();
        if (!week) return acc;
        
        if (!acc[week]) {
          acc[week] = { total: 0, close: 0 };
        }
        
        acc[week].total++;
        if (item.status && typeof item.status === 'string' && item.status.toLowerCase() === 'close') {
          acc[week].close++;
        }
        
        return acc;
      }, {} as Record<string, { total: number; close: number }>);

      // Convert to chart data format for ChartJS
      const chartData = Object.entries(weeklyData)
        .sort(([a], [b]) => {
          // Sort by week number, handling both "W1", "W2" format and numeric format
          const aNum = a.startsWith('W') ? parseInt(a.substring(1)) : parseInt(a);
          const bNum = b.startsWith('W') ? parseInt(b.substring(1)) : parseInt(b);
          return aNum - bNum;
        })
        .map(([week, counts]) => {
          const progress = counts.total > 0 ? (counts.close / counts.total) * 100 : 0;
          
          return {
            week: week,
            total: counts.total,
            close: counts.close,
            progress: Math.round(progress * 100) / 100
          };
        });

      return chartData;
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  };

  const chartData = processChartData();
  const maxStart = Math.max(0, chartData.length - visibleCount);

  const handlePrevious = () => {
    setVisibleStart(prev => Math.max(0, prev - visibleCount));
  };

  const handleNext = () => {
    setVisibleStart(prev => Math.min(maxStart, prev + visibleCount));
  };

  const canGoPrevious = visibleStart > 0;
  const canGoNext = visibleStart < maxStart;

  return (
    <Card sx={{ 
      borderRadius: 2, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      height: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          mb: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: '#1a1a1a',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Trend Cell Down Kalimantan
          </Typography>
          
          {/* Navigation Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {chartData.length > 0 ? `${visibleStart + 1}-${Math.min(visibleStart + visibleCount, chartData.length)} of ${chartData.length} weeks` : 'No data'}
            </Typography>
            
            <Tooltip title="Previous weeks">
              <span>
                <IconButton 
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                  size="small"
                  sx={{ 
                    backgroundColor: canGoPrevious ? '#1976d2' : '#e0e0e0',
                    color: canGoPrevious ? 'white' : '#9e9e9e',
                    '&:hover': { 
                      backgroundColor: canGoPrevious ? '#1565c0' : '#e0e0e0' 
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0',
                      color: '#9e9e9e'
                    }
                  }}
                >
                  <ChevronLeft />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Next weeks">
              <span>
                <IconButton 
                  onClick={handleNext}
                  disabled={!canGoNext}
                  size="small"
                  sx={{ 
                    backgroundColor: canGoNext ? '#1976d2' : '#e0e0e0',
                    color: canGoNext ? 'white' : '#9e9e9e',
                    '&:hover': { 
                      backgroundColor: canGoNext ? '#1565c0' : '#e0e0e0' 
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0',
                      color: '#9e9e9e'
                    }
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
        
        {chartData && chartData.length > 0 ? (
          <ChartJSBarChart 
            data={chartData} 
            visibleStart={visibleStart}
            visibleCount={visibleCount}
          />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 500,
            backgroundColor: '#f5f5f5',
            borderRadius: 1
          }}>
            <Typography variant="h6" color="text.secondary">
              No Data Available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendCellDownKalimantanChart;
