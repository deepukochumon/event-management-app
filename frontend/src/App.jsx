import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  Dashboard,
  Event,
  Group,
  LocationOn,
  Search,
  Tune,
  Delete,
  Edit,
  Refresh,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' });

const fetcher = async (url) => (await api.get(url)).data;

function StatCard({ label, value, icon, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: `${color}.soft`, display: 'grid', placeItems: 'center' }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h5">{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EventDialog({ open, onClose, initialValue, onSubmit, venues = [], loading = false }) {
  const [form, setForm] = useState(initialValue || {
    title: '', description: '', venue: '', start_date: '', end_date: '', status: 'scheduled', capacity: 100,
  });
  React.useEffect(() => { setForm(initialValue || { title: '', description: '', venue: '', start_date: '', end_date: '', status: 'scheduled', capacity: 100 }); }, [initialValue, open]);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialValue?.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} fullWidth required />
          <TextField label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} fullWidth multiline minRows={3} />
          <TextField select label="Venue" value={form.venue} onChange={(e) => update('venue', e.target.value)} fullWidth>
            {venues.map((v) => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Start" type="datetime-local" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="End" type="datetime-local" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth><InputLabel>Status</InputLabel><Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="draft">Draft</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem><MenuItem value="completed">Completed</MenuItem></Select></FormControl>
            <TextField label="Capacity" type="number" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} fullWidth />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(form)} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function DashboardView({ events, registrations, venues }) {
  const upcoming = useMemo(() => events.filter((e) => isAfter(parseISO(e.start_date), startOfDay(new Date()))).slice(0, 5), [events]);
  const stats = useMemo(() => {
    const total = events.length;
    const upcomingCount = events.filter((e) => isAfter(parseISO(e.start_date), startOfDay(new Date()))).length;
    const registered = registrations.reduce((sum, r) => sum + (r.count || 1), 0);
    return { total, upcomingCount, registered, venues: venues.length };
  }, [events, registrations, venues]);
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Total Events" value={stats.total} icon={<Event />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Upcoming" value={stats.upcomingCount} icon={<CalendarMonth />} color="secondary" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Registrations" value={stats.registered} icon={<Group />} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Venues" value={stats.venues} icon={<LocationOn />} /></Grid>
      </Grid>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Upcoming Events</Typography>
        <Stack spacing={1.5}>{upcoming.map((e) => <Box key={e.id}><Typography fontWeight={700}>{e.title}</Typography><Typography variant="body2" color="text.secondary">{format(parseISO(e.start_date), 'PPp')} • {e.venue_name}</Typography><Divider sx={{ mt: 1 }} /></Box>)}</Stack>
      </Paper>
    </Stack>
  );
}

export default function App() {
  const qc = useQueryClient();
  const [page, setPage] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('-start_date');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({ queryKey: ['events', search, status, sort], queryFn: () => fetcher(`/events/?search=${encodeURIComponent(search)}&status=${status}&ordering=${sort}`) });
  const { data: venues = [] } = useQuery({ queryKey: ['venues'], queryFn: () => fetcher('/venues/') });
  const { data: registrations = [] } = useQuery({ queryKey: ['registrations'], queryFn: () => fetcher('/registrations/') });
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: () => fetcher('/dashboard/summary/') });

  const createMut = useMutation({ mutationFn: (payload) => api.post('/events/', payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setDialogOpen(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, payload }) => api.put(`/events/${id}/`, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id) => api.delete(`/events/${id}/`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); } });

  const submitEvent = (payload) => {
    const body = { ...payload, venue: payload.venue || null };
    if (editing?.id) updateMut.mutate({ id: editing.id, payload: body }); else createMut.mutate(body);
  };

  const body = page === 'dashboard' ? (
    <DashboardView events={dashboard?.recent_events || events} registrations={dashboard?.registrations || registrations} venues={venues} />
  ) : (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events" fullWidth InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          <FormControl sx={{ minWidth: 160 }}><InputLabel>Status</InputLabel><Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}><MenuItem value="all">All</MenuItem><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="draft">Draft</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem><MenuItem value="completed">Completed</MenuItem></Select></FormControl>
          <FormControl sx={{ minWidth: 180 }}><InputLabel>Sort</InputLabel><Select value={sort} label="Sort" onChange={(e) => setSort(e.target.value)}><MenuItem value="-start_date">Newest</MenuItem><MenuItem value="start_date">Oldest</MenuItem><MenuItem value="title">Title A-Z</MenuItem><MenuItem value="-capacity">Capacity High-Low</MenuItem></Select></FormControl>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}>New Event</Button>
        </Stack>
      </Paper>
      {eventsLoading ? <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={12} md={6} key={i}><Skeleton variant="rounded" height={140} /></Grid>)}</Grid> : eventsError ? <Alert severity="error">Failed to load events.</Alert> : events.length === 0 ? <Paper sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No events found</Typography><Typography color="text.secondary">Try adjusting your search or filters.</Typography></Paper> : <Grid container spacing={2}>{events.map((event) => <Grid item xs={12} md={6} key={event.id}><Card><CardContent><Stack direction="row" justifyContent="space-between" gap={2}><Box><Typography variant="h6">{event.title}</Typography><Typography variant="body2" color="text.secondary">{format(parseISO(event.start_date), 'PPp')} • {event.venue_name || 'TBD'}</Typography><Typography variant="body2" sx={{ mt: 1 }}>{event.description}</Typography><Stack direction="row" spacing={1} sx={{ mt: 2 }}><Chip size="small" label={event.status} /><Chip size="small" label={`Capacity ${event.capacity}`} /></Stack></Box><Stack direction="row" spacing={1}><IconButton onClick={() => { setEditing(event); setDialogOpen(true); }}><Edit /></IconButton><IconButton onClick={() => deleteMut.mutate(event.id)} color="error"><Delete /></IconButton></Stack></Stack></CardContent></Card></Grid>)}</Grid>}
    </Stack>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>EventFlow</Typography>
          <Button color="inherit" onClick={() => qc.invalidateQueries() } startIcon={<Refresh />}>Refresh</Button>
          <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }} startIcon={<Add />}>Add Event</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={2.4}>
            <Paper sx={{ p: 1 }}>
              <List>
                {[{ key: 'dashboard', label: 'Dashboard', icon: <Dashboard /> }, { key: 'events', label: 'Events', icon: <Event /> }, { key: 'calendar', label: 'Calendar', icon: <CalendarMonth /> }].map((item) => <ListItemButton key={item.key} selected={page === item.key} onClick={() => setPage(item.key)}><ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.label} /></ListItemButton>)}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={9.6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4" gutterBottom>{page === 'dashboard' ? 'Dashboard' : page === 'events' ? 'Event Management' : 'Calendar View'}</Typography>
                <Typography color="text.secondary">Manage events, venues, attendees, and registrations from one place.</Typography>
              </Box>
              {page === 'calendar' ? <Paper sx={{ p: 3 }}><Typography variant="h6" gutterBottom>Calendar</Typography><Typography color="text.secondary">A simple calendar summary of upcoming events.</Typography><Stack spacing={1.5} sx={{ mt: 2 }}>{events.slice(0, 10).map((e) => <Box key={e.id}><Typography fontWeight={700}>{format(parseISO(e.start_date), 'MMM d, yyyy')}</Typography><Typography>{e.title}</Typography></Box>)}</Stack></Paper> : body}
            </Stack>
          </Grid>
        </Grid>
      </Container>
      <EventDialog open={dialogOpen || Boolean(editing)} onClose={() => { setDialogOpen(false); setEditing(null); }} initialValue={editing} onSubmit={submitEvent} venues={venues} loading={createMut.isPending || updateMut.isPending} />
      {(createMut.isError || updateMut.isError || deleteMut.isError) && <Alert severity="error" sx={{ position: 'fixed', bottom: 16, right: 16 }}>{(createMut.error || updateMut.error || deleteMut.error)?.message || 'Action failed.'}</Alert>}
    </Box>
  );
}
