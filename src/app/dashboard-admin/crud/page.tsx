"use client";
import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, CircularProgress, Slide, Fade, Tooltip, TableContainer, TablePagination, InputAdornment } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { database } from '@/app/firebaseConfig';
import { ref, onValue, push, update, remove } from "firebase/database";
// @ts-ignore
import ExcelJS from 'exceljs';
import { TransitionProps } from '@mui/material/transitions';
import SearchIcon from '@mui/icons-material/Search';

const DATA_COLUMNS = [
  { id: 'Category', label: 'Category' },
  { id: 'Site ID', label: 'Site ID' },
  { id: 'Site Name', label: 'Site Name' },
  { id: 'Site Class', label: 'Site Class' },
  { id: 'NOP', label: 'NOP' },
  { id: 'Source Power', label: 'Source Power' },
  { id: 'Root Cause', label: 'Root Cause' },
  { id: 'Detail Problem', label: 'Detail Problem' },
  { id: 'Plan Action', label: 'Plan Action' },
  { id: 'Need Support', label: 'Need Support' },
  { id: 'PIC Dept', label: 'PIC Dept' },
  { id: 'Progress', label: 'Progress' },
  { id: 'Status', label: 'Status' },
  { id: 'Remark', label: 'Remark' },
];

// Tambahkan constant untuk opsi filter (ambil dari data/page.tsx)
const ROOT_CAUSE_OPTIONS = [
  'Power - Regular',
  'Power - Sewadaya',
  'Power - SPS',
  'Transport',
  'Radio',
  'Others',
];
const PIC_DEPT_OPTIONS = [
  'ENOM',
  'Power',
  'Transport',
  'NOP',
  'NOS',
  'Radio',
  'IM',
  'Project',
  'Engineering',
];
const PROGRESS_OPTIONS = [
  { value: 'Identification', label: '1. Identification' },
  { value: 'Plan Action', label: '2. Plan Action' },
  { value: 'Assessment', label: '3. Assessment' },
  { value: 'Justification', label: '4. Justification / RAB / BOQ' },
  { value: 'Waiting Budget', label: '5. Waiting Budget' },
  { value: 'Waiting PO', label: '6. Waiting PO' },
  { value: 'Have Program', label: '7. Have Program' },
  { value: 'Execution', label: '8. Execution' },
  { value: 'Done', label: '9. Done' },
];
const STATUS_OPTIONS = ['Open', 'Waiting approval', 'Close', 'Rejected'];

function isSuperAdmin() {
  // Jangan gunakan localStorage di SSR, gunakan state di komponen utama
  return false;
}

// Komponen transition untuk Dialog (slide up)
const TransitionUp = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CrudPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState<'add'|'edit'>('add');
  const [formData, setFormData] = useState<any>({});
  const [editId, setEditId] = useState<string|null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, color?: string}>({open: false, message: ''});
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSuperAdminState, setIsSuperAdminState] = useState<boolean | null>(null);
  // Filter states
  const [filter, setFilter] = useState({
    category: '',
    siteId: '',
    siteName: '',
    siteClass: '',
    nop: '',
    sourcePower: '',
    status: '',
    dateStart: '',
    dateEnd: '',
    picDept: '',
    progress: '',
    rootCause: '',
    search: '',
  });
  const [filterDraft, setFilterDraft] = useState({
    category: '',
    siteId: '',
    siteName: '',
    siteClass: '',
    nop: '',
    sourcePower: '',
    status: '',
    dateStart: '',
    dateEnd: '',
    picDept: '',
    progress: '',
    rootCause: '',
    search: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDetail, setShowDetail] = useState<any | null>(null);
  // Debounce filter
  useEffect(() => {
    const t = setTimeout(() => {
      setFilter(filterDraft);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [filterDraft]);
  // Unique options
  const uniqueOptions = (key: string) => {
    const opts = Array.from(new Set(rows.map(r => r[key]).filter(Boolean)));
    return opts.sort();
  };
  // Filtered rows
  const filteredRows = rows.filter(row => {
    const match = (val: string, filterVal: string) => !filterVal || (val || '').toLowerCase().includes(filterVal.toLowerCase());
    const matchStatus = !filter.status || (row['Status'] || '').toLowerCase() === filter.status.toLowerCase();
    const matchSearch = !filter.search || DATA_COLUMNS.some(col => (row[col.id] || '').toString().toLowerCase().includes(filter.search.toLowerCase()));
    return (
      match(row['Category'], filter.category) &&
      match(row['Site ID'], filter.siteId) &&
      match(row['Site Name'], filter.siteName) &&
      match(row['NOP'], filter.nop) &&
      matchStatus &&
      matchSearch
    );
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSuperAdminState(localStorage.getItem('userRole') === 'super_admin');
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdminState) return;
    const dbRef = ref(database);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data).map(([id, value]: any) => ({ id, ...value }));
        setRows(arr);
      } else {
        setRows([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isSuperAdminState]);

  if (isSuperAdminState === false) {
    return <Box p={4}><Typography color="error" fontWeight={700} fontSize={20}>Akses ditolak. Hanya untuk super admin.</Typography></Box>;
  }
  if (isSuperAdminState === null) {
    return null; // Atau loading spinner
  }

  // CRUD Handlers
  const handleOpenForm = (mode: 'add'|'edit', row?: any) => {
    setFormMode(mode);
    setFormData(row || {});
    setEditId(row?.id || null);
    setOpenForm(true);
  };
  const handleCloseForm = () => {
    setOpenForm(false);
    setFormData({});
    setEditId(null);
  };
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };
  const handleFormSubmit = async () => {
    // Validasi minimal: semua kolom wajib diisi
    for (const col of DATA_COLUMNS) {
      if (!formData[col.id] || String(formData[col.id]).trim() === '') {
        setSnackbar({open:true, message:`Field '${col.label}' wajib diisi!`, color:'error'});
        return;
      }
    }
    setLoading(true);
    if (formMode === 'add') {
      await push(ref(database), formData);
      setSnackbar({open:true, message:'Data berhasil ditambahkan!', color:'success'});
    } else if (formMode === 'edit' && editId) {
      await update(ref(database, editId), formData);
      setSnackbar({open:true, message:'Data berhasil diupdate!', color:'success'});
    }
    setLoading(false);
    setOpenForm(false);
    setFormData({});
    setEditId(null);
  };
  const handleDelete = async (id: string) => {
    setLoading(true);
    await remove(ref(database, id));
    setSnackbar({open:true, message:'Data berhasil dihapus!', color:'success'});
    setLoading(false);
  };

  // Upload Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const rows = text.split(/\r?\n/).filter(Boolean);
        const headers = rows[0].split(',');
        const json = rows.slice(1).map(row => {
          const values = row.split(',');
          const obj: any = {};
          headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim() || '');
          return obj;
        });
        setUploadData(json);
        setUploadLoading(false);
        setUploadDialog(true);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const buffer = evt.target?.result;
        if (!buffer || !(buffer instanceof ArrayBuffer)) {
          setUploadLoading(false);
          setSnackbar({open:true, message:'Gagal membaca file Excel', color:'error'});
          return;
        }
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        const headers: string[] = [];
        const json: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            row.eachCell((cell, colNumber) => {
              headers.push(String(cell.value).trim());
            });
          } else {
            const obj: any = {};
            row.eachCell((cell, colNumber) => {
              obj[headers[colNumber - 1]] = cell.value;
            });
            json.push(obj);
          }
        });
        setUploadData(json);
        setUploadLoading(false);
        setUploadDialog(true);
      };
      reader.readAsArrayBuffer(file);
    }
  };
  const handleUploadImport = async () => {
    setUploadLoading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    const chunkSize = 25;
    const total = uploadData.length;
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = uploadData.slice(i, i + chunkSize);
      for (const row of chunk) {
        await push(ref(database), row);
      }
      setUploadProgress(Math.min(100, Math.round(((i + chunk.length) / total) * 100)));
      await new Promise(res => setTimeout(res, 200)); // animasi progress
    }
    setUploadLoading(false);
    setUploadProgress(100);
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadDialog(false);
      setUploadData([]);
      setUploadSuccess(false);
      setUploadProgress(0);
      setSnackbar({open:true, message:'Data berhasil diimport!', color:'success'});
    }, 1200);
  };

  return (
    <Box p={{ xs: 1, md: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>CRUD Data (Super Admin Only)</Typography>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)' }}>
        {/* Tombol Tambah & Upload */}
        <Box display="flex" gap={2} mb={2}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm('add')} sx={{ borderRadius: 2 }}>Tambah Data</Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 2 }}>Upload Excel/CSV</Button>
          <input type="file" accept=".xlsx,.csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        </Box>
        {/* Filter Bar */}
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} gap={2} mb={2}>
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
            <TextField select size="small" label="Site Name" value={filterDraft.siteName} onChange={e => setFilterDraft(f => ({ ...f, siteName: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 120 }} InputLabelProps={{ shrink: true }}>
              <option value="">All</option>
              {uniqueOptions('Site Name').map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </TextField>
            <TextField select size="small" label="Site Class" value={filterDraft.siteClass} onChange={e => setFilterDraft(f => ({ ...f, siteClass: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
              <option value="">All</option>
              {uniqueOptions('Site Class').map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </TextField>
            <TextField select size="small" label="NOP" value={filterDraft.nop} onChange={e => setFilterDraft(f => ({ ...f, nop: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
              <option value="">All</option>
              {uniqueOptions('NOP').map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </TextField>
            <TextField select size="small" label="Source Power" value={filterDraft.sourcePower} onChange={e => setFilterDraft(f => ({ ...f, sourcePower: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
              <option value="">All</option>
              {uniqueOptions('Source Power').map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </TextField>
            <TextField select size="small" label="Status" value={filterDraft.status} onChange={e => setFilterDraft(f => ({ ...f, status: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
              <option value="">All</option>
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </TextField>
            <Box display="flex" alignItems="center" gap={1}>
              <TextField size="small" label="Date Close" type="date" value={filterDraft.dateStart} onChange={e => setFilterDraft(f => ({ ...f, dateStart: e.target.value }))} sx={{ minWidth: 130 }} InputLabelProps={{ shrink: true }} />
              <Typography variant="body2" color="text.secondary">to</Typography>
              <TextField size="small" label="" type="date" value={filterDraft.dateEnd} onChange={e => setFilterDraft(f => ({ ...f, dateEnd: e.target.value }))} sx={{ minWidth: 130 }} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField select size="small" label="PIC Dept" value={filterDraft.picDept} onChange={e => setFilterDraft(f => ({ ...f, picDept: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
              <option value="">All</option>
              {PIC_DEPT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </TextField>
            <TextField select size="small" label="Progress" value={filterDraft.progress} onChange={e => setFilterDraft(f => ({ ...f, progress: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 120 }} InputLabelProps={{ shrink: true }}>
              <option value="">All</option>
              {PROGRESS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </TextField>
            <TextField select size="small" label="Root Cause" value={filterDraft.rootCause || ''} onChange={e => setFilterDraft(f => ({ ...f, rootCause: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 120 }} InputLabelProps={{ shrink: true }}>
              <option value="">All</option>
              <option value="blank">Blank</option>
              {ROOT_CAUSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </TextField>
            <Button variant="outlined" size="small" color="inherit" sx={{ ml: 1, minWidth: 80, fontWeight: 600, borderRadius: 2 }} onClick={() => { setFilterDraft({ category: '', siteId: '', siteName: '', siteClass: '', nop: '', sourcePower: '', status: '', dateStart: '', dateEnd: '', picDept: '', progress: '', rootCause: '', search: '' }); setPage(0); }}>Reset</Button>
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)', maxHeight: 520 }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow sx={{ background: '#f7fafd' }}>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, width: 40, maxWidth: 50, textAlign: 'center' }}>No</TableCell>
                {DATA_COLUMNS.map(col => (
                  <TableCell key={col.id} sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>{col.label}</TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={DATA_COLUMNS.length+2} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow><TableCell colSpan={DATA_COLUMNS.length+2} align="center" sx={{ py: 4 }}>Tidak ada data.</TableCell></TableRow>
              ) : filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow key={row.id} hover sx={{ background: idx % 2 === 0 ? '#f9fbfd' : '#fff', transition: 'background 0.2s', cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={e => {
                  if (["BUTTON", "SVG", "PATH"].indexOf((e.target as HTMLElement).tagName) === -1) setShowDetail(row);
                }}>
                  <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle', textAlign: 'center' }}>{page * rowsPerPage + idx + 1}</TableCell>
                  {DATA_COLUMNS.map(col => (
                    <TableCell key={col.id} sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row[col.id]}</TableCell>
                  ))}
                  <TableCell sx={{ border: '1px solid #e0e0e0', padding: '0 2px', fontSize: 13, verticalAlign: 'middle', cursor: 'default' }}>
                    <IconButton color="primary" onClick={ev => { ev.stopPropagation(); handleOpenForm('edit', row); }}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={ev => { ev.stopPropagation(); handleDelete(row.id); }}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="flex-end" alignItems="center" mt={1}>
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
        </Box>
      </Paper>
      {/* Modal Form Tambah/Edit */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth TransitionComponent={TransitionUp}>
        <DialogTitle>{formMode === 'add' ? 'Tambah Data' : 'Edit Data'}</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {DATA_COLUMNS.map(col => (
              <TextField
                key={col.id}
                label={col.label}
                value={formData[col.id] || ''}
                onChange={e => handleFormChange(col.id, e.target.value)}
                fullWidth
                sx={{ flex: '1 1 220px', minWidth: 180 }}
                required
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Batal</Button>
          <Button onClick={handleFormSubmit} variant="contained">Simpan</Button>
        </DialogActions>
      </Dialog>
      {/* Modal Upload Preview */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="lg" fullWidth TransitionComponent={Fade}>
        <DialogTitle>Preview Data Upload</DialogTitle>
        <DialogContent dividers>
          {/* Progress Bar & Success Animation */}
          {(uploadLoading || uploadProgress > 0) && (
            <Box mb={2}>
              <Box sx={{ width: '100%', height: 16, bgcolor: '#e3eafc', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <Box sx={{ width: `${uploadProgress}%`, height: '100%', bgcolor: uploadSuccess ? '#43a047' : '#1976d2', transition: 'width 0.4s' }} />
                {uploadSuccess && (
                  <Box sx={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
                    ✓ Sukses!
                  </Box>
                )}
              </Box>
              {!uploadSuccess && <Typography fontSize={13} color="text.secondary" mt={0.5}>{uploadProgress}%</Typography>}
            </Box>
          )}
          {uploadLoading ? <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress size={40} /></Box> : (
            <Box sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: '0 1px 4px rgba(30,58,138,0.04)', animation: 'fadeIn 0.7s' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {DATA_COLUMNS.map(col => <TableCell key={col.id} sx={{ fontWeight: 700 }}>{col.label}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadData.length === 0 ? (
                    <TableRow><TableCell colSpan={DATA_COLUMNS.length} align="center">Tidak ada data.</TableCell></TableRow>
                  ) : uploadData.map((row, idx) => (
                    <TableRow key={idx} sx={{ background: idx % 2 === 0 ? '#f5fafd' : '#fff', transition: 'background 0.3s' }}>
                      {DATA_COLUMNS.map(col => <TableCell key={col.id}>{row[col.id]}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Batal</Button>
          <Button onClick={handleUploadImport} variant="contained" disabled={uploadLoading || uploadSuccess} sx={{ position: 'relative', overflow: 'hidden' }}>
            {uploadLoading && <CircularProgress size={18} sx={{ position: 'absolute', left: 10, top: 10 }} />}
            Import
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal Detail Data */}
      {showDetail && (
        <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 8, minWidth: 320, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Detail Data</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {DATA_COLUMNS.map(col => (
                  <tr key={col.id}>
                    <th style={{ width: 140, border: '1px solid #e0e0e0', padding: 8, textAlign: 'left' }}>{col.label}</th>
                    <td style={{ border: '1px solid #e0e0e0', padding: 8 }}>{showDetail[col.id] ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 18 }}>
              <button onClick={() => setShowDetail(null)} style={{ padding: '6px 18px', borderRadius: 4, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
      {/* Snackbar Notifikasi */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({open:false, message:''})}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        ContentProps={{ sx: { background: snackbar.color === 'error' ? '#e53935' : '#43a047', fontWeight: 600 } }}
      />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
      `}</style>
    </Box>
  );
};

export default CrudPage; 