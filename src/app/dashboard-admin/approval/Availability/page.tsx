'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, CircularProgress, TableContainer, TablePagination, InputAdornment, Chip, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { database } from '@/app/firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

const STATUS_OPTIONS = [
  { value: 'Close', label: 'Approve' },
  { value: 'Rejected', label: 'Rejected' },
];

// Helper untuk format tampilan tanggal (hanya tanggal saja)
function toDisplayDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Helper untuk truncate text dan show detail button
const TruncatedTextWithDetail = ({ text, fieldName, onShowDetail, row }: { text: string, fieldName: string, onShowDetail: (row: any, field: string) => void, row: any }) => {
  if (!text) return '-';
  
  const isLongText = text.length > 30;
  
  if (isLongText) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text.substring(0, 30)}...
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={() => onShowDetail(row, fieldName)}
          sx={{ 
            minWidth: 'auto', 
            px: 1, 
            py: 0.5, 
            fontSize: 11,
            height: 28,
            borderColor: '#1976d2',
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          Detail
        </Button>
      </Box>
    );
  }
  
  return (
    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
      {text}
    </Typography>
  );
};

const AvailabilityApprovalPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusEdit, setStatusEdit] = useState<{ [id: string]: string }>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<any | null>(null);
  const [detailField, setDetailField] = useState<string>('');
  const [remarkEdit, setRemarkEdit] = useState<{ [id: string]: string }>({});
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [filter, setFilter] = useState({
    category: '',
    siteId: '',
    siteClass: '',
    nop: '',
    status: '',
    search: '',
  });
  const [filterDraft, setFilterDraft] = useState({
    category: '',
    siteId: '',
    siteClass: '',
    nop: '',
    status: '',
    search: '',
  });
  const [filterLoading, setFilterLoading] = useState(false);

  // Debounce filter
  useEffect(() => {
    setFilterLoading(true);
    const t = setTimeout(() => {
      setFilter(filterDraft);
      setPage(0);
      setFilterLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [filterDraft]);

  useEffect(() => {
    const dbRef = ref(database);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data)
          .map(([id, value]: any) => ({ id, ...value }))
          .filter((row: any) => row.Status === 'Waiting approval');
        setRows(arr);
      } else {
        setRows([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Unique options for filter dropdowns
  const uniqueOptions = (key: string) => {
    const opts = Array.from(new Set(rows.map(r => r[key]).filter(Boolean)));
    return opts.sort();
  };

  // Filtered rows
  const filteredRows = rows.filter(row => {
    const match = (val: string, filterVal: string) => !filterVal || (val || '').toLowerCase().includes(filterVal.toLowerCase());
    const matchSearch = !filter.search || [
      row['Category'], row['Site ID'], row['Site Name'], row['Site Class'], row['NOP'], row['Source Power'], row['Root Cause'], row['Detail Problem'], row['Plan Action'], row['Need Support'], row['PIC Dept'], row['Progress'], row['Status'], row['Remark']
    ].some(val => (val || '').toString().toLowerCase().includes(filter.search.toLowerCase()));
    
    return (
      match(row['Category'], filter.category) &&
      match(row['Site ID'], filter.siteId) &&
      match(row['Site Class'], filter.siteClass) &&
      match(row['NOP'], filter.nop) &&
      matchSearch
    );
  });

  const handleStatusChange = (id: string, value: string) => {
    setStatusEdit(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (row: any) => {
    const newStatus = statusEdit[row.id];
    const newRemark = remarkEdit[row.id] || '';
    if (!newStatus) return;
    setSaving(row.id);
    const updates: any = {
      Status: newStatus,
      Remark: newRemark,
    };
    if (newStatus === 'Rejected') {
      updates.Progress = 'Identification';
      updates['PIC Dept'] = 'ENOM';
    }
    await update(ref(database, row.id), updates);
    setSaving(null);
    setStatusEdit(prev => ({ ...prev, [row.id]: '' }));
    setRemarkEdit(prev => ({ ...prev, [row.id]: '' }));
  };

  // Show detail for specific field
  const handleShowFieldDetail = (row: any, fieldName: string) => {
    setShowDetail(row);
    setDetailField(fieldName);
  };

  // Show full row detail
  const handleShowRowDetail = (row: any) => {
    setShowDetail(row);
    setDetailField('');
  };

  // Daftar field detail
  const detailFields = [
    'Category', 'Site ID', 'Site Name', 'Site Class', 'NOP', 'Source Power', 'Progress', 'Root Cause', 'PIC Dept', 'Detail Problem', 'Plan Action', 'Need Support', 'Date Close', 'Status'
  ];

  return (
    <SuperAdminGuard>
      <Box p={{ xs: 1, md: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.2 }}>
            Availability Approval
          </Typography>
          <Chip
            icon={<NotificationsIcon />}
            label={`${filteredRows.length} data Availability menunggu approval`}
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Search & Filter Bar */}
        <Paper sx={{ mb: 2, p: { xs: 1, md: 2 }, borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)' }}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} gap={2}>
            <TextField
              size="small"
              placeholder="Cari data... (semua kolom)"
              value={filterDraft.search}
              onChange={e => setFilterDraft(f => ({ ...f, search: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 220, maxWidth: 320, background: '#fff', borderRadius: 2 }}
            />
            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" flex={1}>
              <TextField select size="small" label="Category" value={filterDraft.category} onChange={e => setFilterDraft(f => ({ ...f, category: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Category').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Site ID" value={filterDraft.siteId} onChange={e => setFilterDraft(f => ({ ...f, siteId: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Site ID').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Site Class" value={filterDraft.siteClass} onChange={e => setFilterDraft(f => ({ ...f, siteClass: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Site Class').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="NOP" value={filterDraft.nop} onChange={e => setFilterDraft(f => ({ ...f, nop: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('NOP').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Status" value={filterDraft.status} onChange={e => setFilterDraft(f => ({ ...f, status: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </TextField>
            </Box>
          </Box>
        </Paper>

        {/* Table */}
        <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)' }}>
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ background: '#f7fafd' }}>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, width: 50, textAlign: 'center' }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>Site ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 150 }}>Site Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>Site Class</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>NOP</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Source Power</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Root Cause</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 150 }}>Detail Problem</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 150 }}>Plan Action</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 150 }}>Need Support</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>PIC Dept</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Remark</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 200 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center" sx={{ py: 4 }}>
                      Tidak ada data yang menunggu approval.
                    </TableCell>
                  </TableRow>
                ) : filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                  <TableRow 
                    key={row.id} 
                    hover 
                    sx={{ 
                      background: idx % 2 === 0 ? '#f9fbfd' : '#fff', 
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        background: '#e3f2fd',
                        '& .row-detail-button': {
                          opacity: 1
                        }
                      }
                    }}
                    onClick={() => handleShowRowDetail(row)}
                  >
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle', textAlign: 'center', fontWeight: 600 }}>
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <Chip 
                        label={row['Category']} 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle', fontWeight: 600, fontFamily: 'monospace' }}>
                      {row['Site ID']}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <Tooltip title={row['Site Name']} placement="top">
                        <Typography variant="body2" sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          maxWidth: 150
                        }}>
                          {row['Site Name']}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <Chip 
                        label={row['Site Class']} 
                        size="small" 
                        color={row['Site Class'] === 'GOLD' ? 'success' : 'default'} 
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      {row['NOP']}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <Chip 
                        label={row['Source Power']} 
                        size="small" 
                        color={row['Source Power'] === 'PLN' ? 'success' : row['Source Power'] === 'Corporate' ? 'info' : 'warning'} 
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      {row['Root Cause']}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <TruncatedTextWithDetail 
                        text={row['Detail Problem']} 
                        fieldName="Detail Problem"
                        onShowDetail={handleShowFieldDetail}
                        row={row}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <TruncatedTextWithDetail 
                        text={row['Plan Action']} 
                        fieldName="Plan Action"
                        onShowDetail={handleShowFieldDetail}
                        row={row}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <TruncatedTextWithDetail 
                        text={row['Need Support']} 
                        fieldName="Need Support"
                        onShowDetail={handleShowFieldDetail}
                        row={row}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      {row['PIC Dept']}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <Chip 
                        label={row['Progress']} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      <Chip 
                        label={row['Status']} 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }}>
                      {row['Remark'] || '-'}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '8px 12px', fontSize: 13, verticalAlign: 'middle' }} onClick={(e) => e.stopPropagation()}>
                      <Box display="flex" gap={1} alignItems="center">
                        <TextField
                          select
                          size="small"
                          value={statusEdit[row.id] || ''}
                          onChange={(e) => handleStatusChange(row.id, e.target.value)}
                          sx={{ minWidth: 100, '& .MuiSelect-select': { py: 0.5, px: 1, fontSize: 12 } }}
                          SelectProps={{ native: true }}
                        >
                          <option value="">Pilih Status</option>
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </TextField>
                        <TextField
                          size="small"
                          placeholder="Remark"
                          value={remarkEdit[row.id] || ''}
                          onChange={(e) => setRemarkEdit(prev => ({ ...prev, [row.id]: e.target.value }))}
                          sx={{ minWidth: 120, '& .MuiInputBase-input': { py: 0.5, px: 1, fontSize: 12 } }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleSave(row)}
                          disabled={!statusEdit[row.id] || saving === row.id}
                          sx={{ minWidth: 60, py: 0.5, px: 1, fontSize: 12 }}
                        >
                          {saving === row.id ? <CircularProgress size={16} /> : 'Save'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Show"
            sx={{ '.MuiTablePagination-toolbar': { minHeight: 40 }, '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: 13 } }}
          />
        </Paper>

        {/* Detail Dialog */}
        {showDetail && (
          <Dialog open={!!showDetail} onClose={() => { setShowDetail(null); setDetailField(''); }} maxWidth="md" fullWidth>
            <DialogTitle>
              {detailField ? `Detail ${detailField}` : 'Detail Data'}
            </DialogTitle>
            <DialogContent>
              {detailField ? (
                // Show specific field detail
                <Box mt={2}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {detailField}
                  </Typography>
                  <Paper sx={{ p: 2, background: '#f5f5f5' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {showDetail[detailField] || '-'}
                    </Typography>
                  </Paper>
                </Box>
              ) : (
                // Show full row detail
                <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} mt={1}>
                  {detailFields.map(field => (
                    <Box key={field} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, background: '#fafafa' }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>
                        {field}
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', minHeight: 20 }}>
                        {showDetail[field] || '-'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setShowDetail(null); setDetailField(''); }} variant="contained">
                Tutup
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </SuperAdminGuard>
  );
};

export default AvailabilityApprovalPage; 