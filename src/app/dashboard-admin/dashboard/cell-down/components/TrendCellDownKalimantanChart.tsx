'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

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

const ChartJSBarChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
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
        // Destroy existing chart
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          chartInstance.current = new window.Chart(ctx, {
            type: 'bar',
            data: {
              labels: data.map(d => `Week ${d.week}`),
              datasets: [
                {
                  label: 'Total',
                  data: data.map(d => d.total),
                  backgroundColor: '#1976d2',
                  borderColor: '#1976d2',
                  borderWidth: 1,
                },
                {
                  label: 'Close',
                  data: data.map(d => d.close),
                  backgroundColor: '#ff9800',
                  borderColor: '#ff9800',
                  borderWidth: 1,
                },
                {
                  label: 'Progress',
                  data: data.map(d => d.progress),
                  backgroundColor: '#4caf50',
                  borderColor: '#4caf50',
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
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
                    generateLabels: function(chart: any) {
                      const datasets = chart.data.datasets;
                      return datasets.map((dataset: any, index: number) => ({
                        text: dataset.label,
                        fillStyle: dataset.backgroundColor,
                        strokeStyle: dataset.borderColor,
                        lineWidth: dataset.borderWidth,
                        pointStyle: 'circle',
                        datasetIndex: index
                      }));
                    }
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
                      return context[0].label || '';
                    },
                    label: function(context: any) {
                      const datasetLabel = context.dataset.label || '';
                      const value = context.parsed.y;
                      
                      if (datasetLabel === 'Progress') {
                        return `${datasetLabel}: ${value.toFixed(1)}%`;
                      }
                      return `${datasetLabel}: ${value}`;
                    },
                    afterBody: function(context: any) {
                      const weekData = context[0];
                      const total = weekData.chart.data.datasets[0].data[weekData.dataIndex];
                      const close = weekData.chart.data.datasets[1].data[weekData.dataIndex];
                      const open = total - close;
                      return [
                        `Open: ${open}`,
                        `Completion Rate: ${((close / total) * 100).toFixed(1)}%`
                      ];
                    }
                  }
                },
                datalabels: {
                  display: function(context: any) {
                    const value = context.parsed.y;
                    const dataIndex = context.dataIndex;
                    const datasetIndex = context.datasetIndex;
                    
                    // Only show labels for significant values and reduce density drastically
                    if (value === 0) return false;
                    
                    // For Total dataset (index 0): Show every 4th label and only if value > 800
                    if (datasetIndex === 0) {
                      return dataIndex % 4 === 0 && value > 800;
                    }
                    
                    // For Close dataset (index 1): Show every 4th label and only if value > 300
                    if (datasetIndex === 1) {
                      return dataIndex % 4 === 0 && value > 300;
                    }
                    
                    // For Progress dataset (index 2): Don't show data labels, too cluttered
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
                  formatter: (value: number, context: any) => {
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
                    maxRotation: 90,
                    minRotation: 90,
                    font: {
                      size: 8,
                    },
                    maxTicksLimit: 12, // Drastically reduce visible ticks
                    callback: function(value: any, index: number, ticks: any[]): string {
                      // Access labels from the chart data directly
                      const labels = data.map(d => `Week ${d.week}`);
                      if (!labels || index >= labels.length) return '';
                      
                      // Show every 3rd label to significantly reduce crowding
                      return index % 3 === 0 ? labels[index] : '';
                    }
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
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

const TrendCellDownKalimantanChart: React.FC<TrendCellDownKalimantanChartProps> = ({ data }) => {
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
        })
        // Limit to latest 16 weeks for better readability
        .slice(-16);

      return chartData;
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  };

  const chartData = processChartData();


  return (
    <Card sx={{ 
      borderRadius: 2, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      height: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
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
        </Box>
        
        {chartData && chartData.length > 0 ? (
          <ChartJSBarChart data={chartData} />
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
