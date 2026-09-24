import React, { useMemo, useState } from 'react';
import { AppBar, Box, Button, Container, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Stack, Tab, Tabs, TextField, Toolbar, Typography, Alert, Chip, Divider, Paper, Grid, Card, CardContent, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Add, CalendarMonth, Dashboard, Delete, Edit, Event as EventIcon, People, Refresh, Search } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api' });
const today = new Date();

const fetcher = async (url) => (await api.get(url)).data;

function useEvents(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('search', filters.q);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.sort) params.set('ordering', filters.sort);
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => fetcher(`/events/?${params.toString()}`),
  });
}

function StatCard({ label, value, icon, accent }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography color="text.secondary" variant="body2">{label}</Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 800 }}>{value}</Typography>
          </Box>
          <AvatarIcon icon={icon} accent={accent} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function AvatarIcon({ icon, accent }) {
  return <Box sx={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: `${accent}.50`, color: `${accent}.700` }}>{icon}</Box>;
}

function EventFormDialog({ open, onClose, event }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(event || { title: '', description: '', start_date: '', end_date: '', venue: '', status: 'scheduled', capacity: 100 });

  React.useEffect(() => { setForm(event || { title: '', description: '', start_date: '', end_date: '', venue: '', status: 'scheduled', capacity: 100 }); }, [event, open]);

  const mutation = useMutation({
    mutationFn: (payload) => event ? api.put(`/events/${event.id}/`, payload) : api.post('/events/', payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); onClose(); },
  });

  const submit = (e) => { e.preventDefault(); mutation.mutate(form); };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={submit} sx={{ mt: 1, display: 'grid', gap: 2 }}>
          <TextField label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Description" multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField type="datetime-local" label="Start" InputLabelProps={{ shrink: true }} fullWidth required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <TextField type="datetime-local" label="End" InputLabelProps={{ shrink: true }} fullWidth required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Venue" fullWidth value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            <TextField select label="Status" fullWidth value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['scheduled', 'draft', 'cancelled', 'completed'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
          <TextField type="number" label="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          {mutation.isError && <Alert severity="error">Unable to save event.</Alert>}
          <Stack direction="row" justifyContent="flex-end" spacing={1}><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save'}</Button></Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState({ q: '', status: 'all', sort: '-start_date', start_date: '', end_date: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => fetcher('/dashboard/') });
  const eventsQuery = useEvents(filters);
  const deleteMutation = useMutation({ mutationFn: (id) => api.delete(`/events/${id}/`), onSuccess: () => { eventsQuery.refetch(); dashboard.refetch(); } });

  const events = eventsQuery.data?.results || eventsQuery.data || [];
  const upcoming = useMemo(() => events.filter((e) => isAfter(parseISO(e.start_date), startOfDay(today))).slice(0, 5), [events]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(12px)', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar><EventIcon sx={{ mr: 1, color: 'primary.main' }} /><Typography variant="h6" sx={{ flexGrow: 1 }}>EventFlow</Typography><Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}>New Event</Button></Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Event Management Dashboard</Typography>
            <Typography color="text.secondary">Manage events, attendees, registrations, venues, and performance insights in one place.</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><StatCard label="Upcoming Events" value={dashboard.data?.upcoming_events ?? '—'} icon={<CalendarMonth />} accent="primary" /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Registrations" value={dashboard.data?.total_registrations ?? '—'} icon={<People />} accent="secondary" /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Active Events" value={dashboard.data?.active_events ?? '—'} icon={<Dashboard />} accent="primary" /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Venues" value={dashboard.data?.venues ?? '—'} icon={<EventIcon />} accent="secondary" /></Grid>
          </Grid>
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <TextField fullWidth placeholder="Search events" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                <TextField select label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} sx={{ minWidth: 160 }}>{['all', 'draft', 'scheduled', 'cancelled', 'completed'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
                <TextField select label="Sort" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} sx={{ minWidth: 180 }}>{[{k:'-start_date',l:'Newest first'},{k:'start_date',l:'Oldest first'},{k:'title',l:'Title A-Z'}].map((s) => <MenuItem key={s.k} value={s.k}>{s.l}</MenuItem>)}</TextField>
                <Button variant="outlined" startIcon={<Refresh />} onClick={() => eventsQuery.refetch()}>Refresh</Button>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField type="date" label="Start date" InputLabelProps={{ shrink: true }} value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
                <TextField type="date" label="End date" InputLabelProps={{ shrink: true }} value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
              </Stack>
            </Stack>
          </Paper>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}><Tab label="Events" /><Tab label="Calendar" /><Tab label="Insights" /></Tabs>
          {eventsQuery.isLoading ? <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box> : eventsQuery.isError ? <Alert severity="error">Failed to load events. Please check the backend API.</Alert> : null}
          {tab === 0 && (
            <Paper>
              {events.length === 0 ? <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No events found</Typography><Typography color="text.secondary">Try adjusting filters or create a new event.</Typography></Box> : <Table><TableHead><TableRow><TableCell>Event</TableCell><TableCell>Dates</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{events.map((event) => <TableRow key={event.id}><TableCell><Typography fontWeight={700}>{event.title}</Typography><Typography variant="body2" color="text.secondary">{event.venue_name || event.venue || 'No venue'}</Typography></TableCell><TableCell>{format(parseISO(event.start_date), 'PP p')} — {format(parseISO(event.end_date), 'PP p')}</TableCell><TableCell><Chip label={event.status} size="small" /></TableCell><TableCell align="right"><IconButton onClick={() => { setEditing(event); setDialogOpen(true); }}><Edit /></IconButton><IconButton color="error" onClick={() => deleteMutation.mutate(event.id)}><Delete /></IconButton></TableCell></TableRow>)}</TableBody></Table>}
            </Paper>
          )}
          {tab === 1 && <Paper sx={{ p: 3 }}><Typography variant="h6">Calendar View</Typography><Divider sx={{ my: 2 }} />{upcoming.map((event) => <Box key={event.id} sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}><Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={700}>{event.title}</Typography><Typography variant="body2" color="text.secondary">{format(parseISO(event.start_date), 'PP p')}</Typography></Box><Chip label={event.status} size="small" /></Stack></Box>)}{upcoming.length === 0 && <Typography color="text.secondary">No upcoming events.</Typography>}</Paper>}
          {tab === 2 && <Paper sx={{ p: 3 }}><Typography variant="h6">Statistics</Typography><Divider sx={{ my: 2 }} /><Grid container spacing={2}><Grid item xs={12} md={6}><Card><CardContent><Typography fontWeight={700}>Registrations by status</Typography><Box sx={{ mt: 2, display: 'grid', gap: 1 }}>{(dashboard.data?.registration_status_breakdown || []).map((item) => <Box key={item.status} sx={{ display: 'flex', justifyContent: 'space-between' }}><span>{item.status}</span><strong>{item.count}</strong></Box>)}</Box></CardContent></Card></Grid><Grid item xs={12} md={6}><Card><CardContent><Typography fontWeight={700}>Recent activity</Typography><Box sx={{ mt: 2, display: 'grid', gap: 1 }}>{(dashboard.data?.recent_events || []).map((item) => <Box key={item.id}><Typography fontWeight={600}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{format(parseISO(item.start_date), 'PP')}</Typography></Box>)}</Box></CardContent></Card></Grid></Grid></Paper>}
        </Stack>
      </Container>
      <EventFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} event={editing} />
    </Box>
  );
}
