import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import axios from 'axios';
import {
  CalendarDays,
  Search,
  Plus,
  Users,
  MapPin,
  Clock3,
  Trash2,
  Pencil,
  BarChart3,
  CalendarRange,
  BadgeCheck,
} from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api' });

async function getJSON(url, params) {
  const { data } = await api.get(url, { params });
  return data;
}

const statusColor = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'error';
  if (s === 'draft') return 'default';
  return 'primary';
};

function Metric({ title, value, helper, icon, color = 'primary' }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
            {helper ? <Typography variant="caption" color="text.secondary">{helper}</Typography> : null}
          </Box>
          <Box sx={{ width: 52, height: 52, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: `${color}.light`, color: `${color}.main` }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EventFormDialog({ open, onClose, initialValues, onSubmit, loading }) {
  const [values, setValues] = useState(initialValues);
  React.useEffect(() => setValues(initialValues), [initialValues, open]);
  const setField = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const submit = () => onSubmit({ ...values, capacity: Number(values.capacity || 0) });
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{values.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Title" value={values.title} onChange={setField('title')} fullWidth required />
          <TextField label="Description" value={values.description} onChange={setField('description')} fullWidth multiline minRows={3} />
          <TextField label="Venue ID" value={values.venue} onChange={setField('venue')} fullWidth helperText="Enter venue identifier from the API" />
          <TextField label="Start Date" type="date" value={values.start_date} onChange={setField('start_date')} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="End Date" type="date" value={values.end_date} onChange={setField('end_date')} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Capacity" type="number" value={values.capacity} onChange={setField('capacity')} fullWidth />
          <TextField select label="Status" value={values.status} onChange={setField('status')} fullWidth>
            {['draft', 'published', 'completed', 'cancelled'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={submit} variant="contained" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-start_date');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const params = useMemo(() => ({
    search: search || undefined,
    status: status || undefined,
    ordering: sort,
    start_date_after: fromDate ? fromDate.format('YYYY-MM-DD') : undefined,
    start_date_before: toDate ? toDate.format('YYYY-MM-DD') : undefined,
    page_size: 24,
  }), [search, status, sort, fromDate, toDate]);

  const eventsQuery = useQuery({ queryKey: ['events', params], queryFn: () => getJSON('/events/', params) });
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: () => getJSON('/dashboard/') });
  const selectedEventQuery = useQuery({ queryKey: ['event', selectedId], queryFn: () => getJSON(`/events/${selectedId}/`), enabled: !!selectedId });
  const statsQuery = useQuery({ queryKey: ['stats'], queryFn: () => getJSON('/statistics/') });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/events/', payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/events/${id}/`, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setDialogOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/events/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); if (selectedId) setSelectedId(null); },
  });

  const openCreate = () => { setEditing({ title: '', description: '', venue: '', start_date: dayjs().add(1, 'day').format('YYYY-MM-DD'), end_date: dayjs().add(1, 'day').format('YYYY-MM-DD'), capacity: 100, status: 'draft' }); setDialogOpen(true); };
  const openEdit = (event) => { setEditing({ id: event.id, title: event.title, description: event.description || '', venue: event.venue?.id || event.venue || '', start_date: dayjs(event.start_date).format('YYYY-MM-DD'), end_date: dayjs(event.end_date).format('YYYY-MM-DD'), capacity: event.capacity, status: event.status }); setDialogOpen(true); };
  const submit = (payload) => { if (payload.id) updateMutation.mutate(payload); else createMutation.mutate(payload); };

  const events = eventsQuery.data?.results || eventsQuery.data || [];
  const dashboard = dashboardQuery.data || {};
  const selected = selectedEventQuery.data;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(14px)', bgcolor: 'rgba(246,247,251,0.85)', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
          <Toolbar>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'white' }}><CalendarDays size={20} /></Box>
              <Box>
                <Typography variant="h6">EventFlow</Typography>
                <Typography variant="caption" color="text.secondary">Management dashboard</Typography>
              </Box>
            </Stack>
            <Button startIcon={<Plus size={16} />} variant="contained" onClick={openCreate}>New Event</Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ py: 3 }}>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid item xs={12} md={3}><Metric title="Upcoming events" value={dashboard.upcoming_events ?? '—'} helper="Next 30 days" icon={<CalendarRange size={24} />} /></Grid>
            <Grid item xs={12} md={3}><Metric title="Registrations" value={dashboard.total_registrations ?? '—'} helper="All active registrations" icon={<Users size={24} />} color="secondary" /></Grid>
            <Grid item xs={12} md={3}><Metric title="Venues" value={dashboard.total_venues ?? '—'} helper="Configured locations" icon={<MapPin size={24} />} color="success" /></Grid>
            <Grid item xs={12} md={3}><Metric title="Attendance rate" value={`${dashboard.attendance_rate ?? 0}%`} helper="Completion metric" icon={<BadgeCheck size={24} />} color="warning" /></Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                    <TextField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }} />
                    <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}>
                      <MenuItem value="">All</MenuItem>
                      {['draft', 'published', 'completed', 'cancelled'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                    <TextField select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 180 }}>
                      <MenuItem value="-start_date">Newest first</MenuItem>
                      <MenuItem value="start_date">Oldest first</MenuItem>
                      <MenuItem value="title">Title A-Z</MenuItem>
                      <MenuItem value="-capacity">Capacity high-low</MenuItem>
                    </TextField>
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
                    <DatePicker label="From" value={fromDate} onChange={setFromDate} slotProps={{ textField: { fullWidth: true } }} />
                    <DatePicker label="To" value={toDate} onChange={setToDate} slotProps={{ textField: { fullWidth: true } }} />
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6">Events</Typography>
                    {eventsQuery.isFetching ? <CircularProgress size={18} /> : null}
                  </Stack>
                  {eventsQuery.isError ? <Alert severity="error">Failed to load events.</Alert> : null}
                  {eventsQuery.isLoading ? (
                    <Stack spacing={1.5}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={92} />)}</Stack>
                  ) : events.length === 0 ? (
                    <Alert severity="info">No events match your filters.</Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {events.map((event) => (
                        <Card key={event.id} variant="outlined" sx={{ cursor: 'pointer', borderColor: selectedId === event.id ? 'primary.main' : 'divider' }} onClick={() => setSelectedId(event.id)}>
                          <CardContent>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                              <Box sx={{ flex: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <Typography variant="h6">{event.title}</Typography>
                                  <Chip size="small" label={event.status} color={statusColor(event.status)} />
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{event.description || 'No description provided.'}</Typography>
                                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                  <Typography variant="caption" color="text.secondary"><Clock3 size={14} style={{ verticalAlign: 'middle' }} /> {dayjs(event.start_date).format('MMM D, YYYY')}</Typography>
                                  <Typography variant="caption" color="text.secondary"><MapPin size={14} style={{ verticalAlign: 'middle' }} /> {event.venue_name || event.venue?.name || 'Venue TBD'}</Typography>
                                  <Typography variant="caption" color="text.secondary"><Users size={14} style={{ verticalAlign: 'middle' }} /> {event.registration_count ?? 0} registrations</Typography>
                                </Stack>
                              </Box>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Tooltip title="Edit"><IconButton onClick={(e) => { e.stopPropagation(); openEdit(event); }}><Pencil size={16} /></IconButton></Tooltip>
                                <Tooltip title="Delete"><IconButton color="error" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(event.id); }}><Trash2 size={16} /></IconButton></Tooltip>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                    <Tab label="Details" />
                    <Tab label="Stats" />
                  </Tabs>
                  <Divider sx={{ my: 2 }} />
                  {tab === 0 ? (
                    selected ? (
                      <Stack spacing={1.2}>
                        <Typography variant="h6">{selected.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{selected.description || 'No description.'}</Typography>
                        <Chip label={selected.status} color={statusColor(selected.status)} sx={{ width: 'fit-content' }} />
                        <Typography variant="body2"><strong>Venue:</strong> {selected.venue_name || selected.venue?.name || '—'}</Typography>
                        <Typography variant="body2"><strong>Start:</strong> {dayjs(selected.start_date).format('MMM D, YYYY')}</Typography>
                        <Typography variant="body2"><strong>End:</strong> {dayjs(selected.end_date).format('MMM D, YYYY')}</Typography>
                        <Typography variant="body2"><strong>Capacity:</strong> {selected.capacity}</Typography>
                        <Typography variant="body2"><strong>Registrations:</strong> {selected.registration_count ?? 0}</Typography>
                      </Stack>
                    ) : <Alert severity="info">Select an event to view details and registrations.</Alert>
                  ) : (
                    <Stack spacing={2}>
                      <Metric title="Total events" value={statsQuery.data?.total_events ?? '—'} icon={<BarChart3 size={24} />} />
                      <Metric title="Avg registrations" value={statsQuery.data?.average_registrations ?? '—'} icon={<Users size={24} />} color="secondary" />
                      <Metric title="Capacity utilization" value={`${statsQuery.data?.capacity_utilization ?? 0}%`} icon={<BadgeCheck size={24} />} color="success" />
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Calendar Snapshot</Typography>
                  <Stack spacing={1}>
                    {(dashboard.calendar?.slice?.(0, 5) || []).map((item) => (
                      <Stack key={item.date} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{dayjs(item.date).format('MMM D')}</Typography>
                        <Chip size="small" label={`${item.count} events`} />
                      </Stack>
                    ))}
                    {!dashboard.calendar?.length ? <Alert severity="info">No upcoming calendar entries.</Alert> : null}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>

        <EventFormDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          initialValues={editing || { title: '', description: '', venue: '', start_date: dayjs().format('YYYY-MM-DD'), end_date: dayjs().format('YYYY-MM-DD'), capacity: 100, status: 'draft' }}
          onSubmit={submit}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Box>
    </LocalizationProvider>
  );
}
