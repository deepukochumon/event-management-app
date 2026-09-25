import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import axios from 'axios';
import {
  CalendarDays,
  ChevronDown,
  Edit,
  Eye,
  Filter,
  LayoutDashboard,
  ListFilter,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_BASE });

const statusColors = {
  draft: 'default',
  published: 'primary',
  ongoing: 'success',
  completed: 'secondary',
  cancelled: 'error',
};

async function getDashboard() {
  const { data } = await api.get('/dashboard/');
  return data;
}
async function getEvents(params) {
  const { data } = await api.get('/events/', { params });
  return data;
}
async function getVenues() {
  const { data } = await api.get('/venues/');
  return data;
}
async function createEvent(payload) {
  const { data } = await api.post('/events/', payload);
  return data;
}
async function updateEvent({ id, payload }) {
  const { data } = await api.patch(`/events/${id}/`, payload);
  return data;
}
async function deleteEvent(id) {
  await api.delete(`/events/${id}/`);
}

function StatCard({ label, value, helper, icon }) {
  return (
    <Paper sx={{ p: 2.5, height: '100%' }} elevation={0} variant="outlined">
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
          {helper ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{helper}</Typography> : null}
        </Box>
        <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}>{icon}</Avatar>
      </Stack>
    </Paper>
  );
}

function EventDialog({ open, onClose, event, venues, onSave, saving }) {
  const [form, setForm] = useState(event || {
    title: '',
    description: '',
    venue: '',
    start_date: dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
    end_date: dayjs().add(1, 'day').add(2, 'hour').format('YYYY-MM-DDTHH:mm'),
    status: 'draft',
    capacity: 100,
  });

  React.useEffect(() => {
    setForm(event || {
      title: '',
      description: '',
      venue: '',
      start_date: dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
      end_date: dayjs().add(1, 'day').add(2, 'hour').format('YYYY-MM-DDTHH:mm'),
      status: 'draft',
      capacity: 100,
    });
  }, [event, open]);

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const handleDate = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value ? dayjs(value).format('YYYY-MM-DDTHH:mm') : '' }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={form.title} onChange={handleChange('title')} fullWidth required />
          <TextField label="Description" value={form.description} onChange={handleChange('description')} fullWidth multiline minRows={3} />
          <TextField select label="Venue" value={form.venue} onChange={handleChange('venue')} fullWidth>
            {venues.map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
          </TextField>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Start date" value={dayjs(form.start_date)} onChange={handleDate('start_date')} />
            <DatePicker label="End date" value={dayjs(form.end_date)} onChange={handleDate('end_date')} />
          </LocalizationProvider>
          <Stack direction="row" spacing={2}>
            <TextField select label="Status" value={form.status} onChange={handleChange('status')} fullWidth>
              {['draft', 'published', 'ongoing', 'completed', 'cancelled'].map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>
            <TextField type="number" label="Capacity" value={form.capacity} onChange={handleChange('capacity')} fullWidth inputProps={{ min: 1 }} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function App() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-start_date');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const dashboardQ = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const venuesQ = useQuery({ queryKey: ['venues'], queryFn: getVenues });
  const eventsQ = useQuery({
    queryKey: ['events', { search, status, sort, dateFrom, dateTo }],
    queryFn: () => getEvents({ search, status, ordering: sort, start_date_after: dateFrom ? dayjs(dateFrom).format('YYYY-MM-DD') : undefined, start_date_before: dateTo ? dayjs(dateTo).format('YYYY-MM-DD') : undefined, page_size: 100 }),
  });

  const saveMutation = useMutation({
    mutationFn: async (form) => (editing ? updateEvent({ id: editing.id, payload: form }) : createEvent(form)),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['events'] }); await qc.invalidateQueries({ queryKey: ['dashboard'] }); setDialogOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['events'] }); await qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });

  const events = eventsQ.data?.results ?? [];
  const stats = dashboardQ.data?.stats ?? {};
  const upcoming = useMemo(() => events.filter((e) => dayjs(e.start_date).isAfter(dayjs().subtract(1, 'day'))).slice(0, 6), [events]);

  const handleSave = async (form) => saveMutation.mutateAsync({ ...form, venue: Number(form.venue), capacity: Number(form.capacity) });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(12px)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>E</Avatar>
            <Box>
              <Typography variant="h6">EventFlow</Typography>
              <Typography variant="caption" color="text.secondary">Manage events, registrations, venues</Typography>
            </Box>
          </Stack>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => { setEditing(null); setDialogOpen(true); }}>Create Event</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">Dashboard</Typography>
              <Typography color="text.secondary">Track upcoming events, registrations, and venue operations.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip icon={<LayoutDashboard size={16} />} label={`${stats.upcoming_events ?? 0} upcoming`} />
              <Chip icon={<Users size={16} />} label={`${stats.total_registrations ?? 0} registrations`} />
              <Chip icon={<CalendarDays size={16} />} label={`${stats.total_events ?? 0} events`} />
            </Stack>
          </Stack>

          {dashboardQ.isLoading ? <CircularProgress /> : dashboardQ.isError ? <Alert severity="error">Failed to load dashboard.</Alert> : null}

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={3}><StatCard label="Upcoming Events" value={stats.upcoming_events ?? 0} helper="Next 30 days" icon={<CalendarDays size={18} />} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Registrations" value={stats.total_registrations ?? 0} helper="Across all events" icon={<Users size={18} />} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Venues" value={stats.total_venues ?? 0} helper="Managed locations" icon={<Filter size={18} />} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Capacity Used" value={`${stats.capacity_utilization ?? 0}%`} helper="Average occupancy" icon={<Eye size={18} />} /></Grid>
          </Grid>

          <Paper elevation={0} variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }} />
                <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
                  <MenuItem value="">All statuses</MenuItem>
                  {Object.keys(statusColors).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 220 }}>
                  <MenuItem value="-start_date">Newest first</MenuItem>
                  <MenuItem value="start_date">Oldest first</MenuItem>
                  <MenuItem value="title">Title A-Z</MenuItem>
                  <MenuItem value="-title">Title Z-A</MenuItem>
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker label="From" value={dateFrom} onChange={setDateFrom} slotProps={{ textField: { fullWidth: true } }} />
                  <DatePicker label="To" value={dateTo} onChange={setDateTo} slotProps={{ textField: { fullWidth: true } }} />
                </LocalizationProvider>
                <Button variant="outlined" startIcon={<ListFilter size={18} />} onClick={() => { setSearch(''); setStatus(''); setSort('-start_date'); setDateFrom(null); setDateTo(null); }}>Reset Filters</Button>
              </Stack>
            </Stack>
          </Paper>

          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Events" />
            <Tab label="Upcoming" />
          </Tabs>

          {eventsQ.isLoading ? <CircularProgress /> : eventsQ.isError ? <Alert severity="error">Failed to load events.</Alert> : null}

          {tab === 0 ? (
            <Grid container spacing={2.5}>
              {events.length === 0 ? <Grid item xs={12}><Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>No events found.</Paper></Grid> : events.map((event) => (
                <Grid item xs={12} md={6} lg={4} key={event.id}>
                  <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box>
                          <Typography variant="h6">{event.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{event.venue_name}</Typography>
                        </Box>
                        <Chip size="small" label={event.status} color={statusColors[event.status] || 'default'} />
                      </Stack>
                      <Typography variant="body2" sx={{ minHeight: 42 }}>{event.description || 'No description provided.'}</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label={dayjs(event.start_date).format('MMM D, YYYY h:mm A')} />
                        <Chip label={`Capacity ${event.capacity}`} />
                        <Chip label={`${event.registration_count ?? 0} regs`} />
                      </Stack>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Edit"><IconButton onClick={() => { setEditing(event); setDialogOpen(true); }}><Edit size={18} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton color="error" onClick={() => deleteMutation.mutate(event.id)}><Trash2 size={18} /></IconButton></Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={2.5}>
              {upcoming.map((event) => (
                <Grid item xs={12} md={6} key={event.id}>
                  <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="h6">{event.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{dayjs(event.start_date).format('dddd, MMM D • h:mm A')}</Typography>
                      </Box>
                      <Button size="small" variant="outlined">Details</Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>

      <EventDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        event={editing}
        venues={venuesQ.data || []}
        onSave={handleSave}
        saving={saveMutation.isPending}
      />
    </Box>
  );
}
