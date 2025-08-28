'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, CircularProgress, TableContainer, TablePagination, InputAdornment, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
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

const AvailabilityApprovalPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusEdit, setStatusEdit] = useState<{ [id: string]: string }>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<any | null>(null);
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
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, width: 40, maxWidth: 50, textAlign: 'center' }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Site ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Site Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Site Class</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>NOP</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Source Power</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Root Cause</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Detail Problem</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Plan Action</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Need Support</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>PIC Dept</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Remark</TableCell>
                  <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Aksi</TableCell>
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
                  <TableRow key={row.id} hover sx={{ background: idx % 2 === 0 ? '#f9fbfd' : '#fff', transition: 'background 0.2s' }}>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle', textAlign: 'center' }}>
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Category']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Site ID']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Site Name']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Site Class']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['NOP']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Source Power']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Root Cause']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Detail Problem']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Plan Action']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Need Support']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['PIC Dept']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Progress']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Status']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Remark']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '0 2px', fontSize: 13, verticalAlign: 'middle', cursor: 'default' }}>
                      <Box display="flex" gap={0.5}>
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
          <Dialog open={!!showDetail} onClose={() => setShowDetail(null)} maxWidth="md" fullWidth>
            <DialogTitle>Detail Data</DialogTitle>
            <DialogContent>
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2} mt={1}>
                {detailFields.map(field => (
                  <Box key={field}>
                    <Typography variant="caption" color="text.secondary" display="block">{field}</Typography>
                    <Typography variant="body2">{showDetail[field] || '-'}</Typography>
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetail(null)}>Tutup</Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </SuperAdminGuard>
  );
};

export default AvailabilityApprovalPage; 