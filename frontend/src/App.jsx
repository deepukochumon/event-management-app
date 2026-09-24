import React, { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  AppBar, Box, Button, Card, CardContent, Chip, Container, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Skeleton, Stack,
  Tab, Tabs, TextField, Toolbar, Typography, Paper, Alert, Snackbar
} from '@mui/material';
import { Add, CalendarMonth, Delete, Edit, Event, People, Search } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api' });

async function getJSON(url, params) { return (await api.get(url, { params })).data; }
async function postJSON(url, body) { return (await api.post(url, body)).data; }
async function putJSON(url, body) { return (await api.put(url, body)).data; }
async function deleteJSON(url) { return (await api.delete(url)).data; }

const emptyForm = { title: '', description: '', start_date: '', end_date: '', venue: '', capacity: 50, status: 'scheduled' };

function StatCard({ label, value, icon, color = 'primary.main' }) {
  return <Card><CardContent><Stack direction="row" spacing={2} alignItems="center"><Box sx={{ color, display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(37,99,235,.08)' }}>{icon}</Box><Box><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h4">{value}</Typography></Box></Stack></CardContent></Card>;
}

function EventDialog({ open, onClose, initial, onSave, loading }) {
  const [form, setForm] = useState(initial || emptyForm);
  React.useEffect(() => setForm(initial || emptyForm), [initial, open]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return <Dialog open={open} fullWidth maxWidth="sm" onClose={onClose}><DialogTitle>{form.id ? 'Edit Event' : 'Create Event'}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
    <TextField label="Title" value={form.title} onChange={(e)=>set('title', e.target.value)} fullWidth required />
    <TextField label="Description" value={form.description} onChange={(e)=>set('description', e.target.value)} fullWidth multiline minRows={3} />
    <Grid container spacing={2}><Grid item xs={12} sm={6}><TextField label="Start" type="datetime-local" value={form.start_date} onChange={(e)=>set('start_date', e.target.value)} fullWidth InputLabelProps={{shrink:true}} /></Grid><Grid item xs={12} sm={6}><TextField label="End" type="datetime-local" value={form.end_date} onChange={(e)=>set('end_date', e.target.value)} fullWidth InputLabelProps={{shrink:true}} /></Grid></Grid>
    <Grid container spacing={2}><Grid item xs={12} sm={6}><TextField label="Venue" value={form.venue} onChange={(e)=>set('venue', e.target.value)} fullWidth /></Grid><Grid item xs={12} sm={3}><TextField label="Capacity" type="number" value={form.capacity} onChange={(e)=>set('capacity', e.target.value)} fullWidth /></Grid><Grid item xs={12} sm={3}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={form.status} label="Status" onChange={(e)=>set('status', e.target.value)}><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="draft">Draft</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem></Select></FormControl></Grid></Grid>
  </Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={()=>onSave(form)} disabled={loading || !form.title}>{loading ? 'Saving...' : 'Save'}</Button></DialogActions></Dialog>;
}

function EventsPage() {
  const qc = useQueryClient(); const navigate = useNavigate();
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [sort, setSort] = useState('-start_date'); const [date, setDate] = useState('');
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState(null); const [snack, setSnack] = useState('');
  const { data, isLoading, error } = useQuery({ queryKey: ['events', { q, status, sort, date }], queryFn: () => getJSON('/events/', { search: q, status, ordering: sort, date }) });
  const save = useMutation({ mutationFn: (body) => editing?.id ? putJSON(`/events/${editing.id}/`, body) : postJSON('/events/', body), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['events'] }); setOpen(false); setEditing(null); setSnack('Event saved successfully'); } });
  const remove = useMutation({ mutationFn: (id) => deleteJSON(`/events/${id}/`), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['events'] }); setSnack('Event deleted'); } });
  const items = data?.results || data || [];
  const filtered = useMemo(() => items.filter((e) => !status || e.status === status), [items, status]);
  return <Container sx={{ py: 4 }}><Stack spacing={3}><Stack direction={{ xs:'column', sm:'row' }} justifyContent="space-between" alignItems={{ xs:'stretch', sm:'center' }} spacing={2}><Box><Typography variant="h4">Events</Typography><Typography color="text.secondary">Search, filter, sort and manage events.</Typography></Box><Button startIcon={<Add />} variant="contained" onClick={() => { setEditing(null); setOpen(true); }}>New Event</Button></Stack><Stack direction={{ xs:'column', sm:'row' }} spacing={2}><TextField value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search events" InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} fullWidth /><TextField select label="Status" value={status} onChange={(e)=>setStatus(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="">All</MenuItem><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="draft">Draft</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem></TextField><TextField select label="Sort" value={sort} onChange={(e)=>setSort(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="-start_date">Newest</MenuItem><MenuItem value="start_date">Oldest</MenuItem><MenuItem value="title">Title A-Z</MenuItem></TextField><TextField type="date" label="Date" value={date} onChange={(e)=>setDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 180 }} /></Stack>{error && <Alert severity="error">Failed to load events.</Alert>}{isLoading ? <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, i)=><Grid item xs={12} md={6} key={i}><Skeleton variant="rounded" height={180} /></Grid>)}</Grid> : filtered.length === 0 ? <Paper sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6">No events found</Typography><Typography color="text.secondary">Try a different search or create your first event.</Typography></Paper> : <Grid container spacing={2}>{filtered.map((event) => <Grid item xs={12} md={6} key={event.id}><Card><CardContent><Stack direction="row" justifyContent="space-between" spacing={2}><Box><Stack direction="row" spacing={1} sx={{ mb: 1 }}><Chip size="small" label={event.status} color={event.status === 'scheduled' ? 'success' : event.status === 'cancelled' ? 'error' : 'default'} /><Chip size="small" label={dayjs(event.start_date).format('MMM D, YYYY')} /></Stack><Typography variant="h6">{event.title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{event.description || 'No description provided.'}</Typography><Stack direction="row" spacing={2} sx={{ mt: 2 }}><Typography variant="body2"><Event fontSize="small" sx={{ mr: .5, verticalAlign: 'middle' }} />{dayjs(event.start_date).format('MMM D, h:mm A')}</Typography><Typography variant="body2"><People fontSize="small" sx={{ mr: .5, verticalAlign: 'middle' }} />{event.registrations_count || 0} registrations</Typography></Stack></Box><Stack direction="row" spacing={1} alignItems="flex-start"><IconButton onClick={()=>navigate(`/events/${event.id}`)}><CalendarMonth /></IconButton><IconButton onClick={()=>{ setEditing({ ...event, start_date: dayjs(event.start_date).format('YYYY-MM-DDTHH:mm'), end_date: dayjs(event.end_date).format('YYYY-MM-DDTHH:mm') }); setOpen(true); }}><Edit /></IconButton><IconButton color="error" onClick={()=>remove.mutate(event.id)}><Delete /></IconButton></Stack></Stack></CardContent></Card></Grid>)}</Grid>}<EventDialog open={open} initial={editing} loading={save.isPending} onClose={()=>setOpen(false)} onSave={(form)=>save.mutate({ ...form, capacity: Number(form.capacity) })} /><Snackbar open={!!snack} autoHideDuration={2500} onClose={()=>setSnack('')} message={snack} /></Stack></Container>;
}

function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => getJSON('/dashboard/') });
  const stats = data?.stats || {}; const upcoming = data?.upcoming_events || [];
  return <Container sx={{ py: 4 }}><Stack spacing={3}><Box><Typography variant="h4">Dashboard</Typography><Typography color="text.secondary">Overview of upcoming events, registrations and performance.</Typography></Box><Grid container spacing={2}><Grid item xs={12} md={3}><StatCard label="Upcoming Events" value={stats.upcoming_events ?? 0} icon={<Event />} /></Grid><Grid item xs={12} md={3}><StatCard label="Registrations" value={stats.total_registrations ?? 0} icon={<People />} color="secondary.main" /></Grid><Grid item xs={12} md={3}><StatCard label="Venues" value={stats.total_venues ?? 0} icon={<CalendarMonth />} /></Grid><Grid item xs={12} md={3}><StatCard label="Attendees" value={stats.total_attendees ?? 0} icon={<People />} /></Grid></Grid><Card><CardContent><Typography variant="h6" sx={{ mb: 2 }}>Upcoming events</Typography>{isLoading ? <Skeleton height={120} /> : upcoming.length ? upcoming.map((e)=><Box key={e.id} sx={{ py: 1.4, display:'flex', justifyContent:'space-between', gap: 2, borderBottom:'1px solid #e2e8f0' }}><Box><Typography fontWeight={600}>{e.title}</Typography><Typography variant="body2" color="text.secondary">{dayjs(e.start_date).format('MMM D, YYYY h:mm A')} · {e.venue_name || 'Venue TBD'}</Typography></Box><Chip size="small" label={e.status} /></Box>) : <Typography color="text.secondary">No upcoming events.</Typography>}</CardContent></Card></Stack></Container>;
}

function EventDetailsPage() { return <Container sx={{ py: 4 }}><Typography variant="h5">Event details and attendee management</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>This route is wired for the REST API and can be expanded for attendee CRUD, registration management, and calendar statistics.</Typography></Container>; }

function Layout({ children }) { return <Box><AppBar position="sticky" color="inherit" elevation={0}><Toolbar><Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>EventFlow</Typography><Button component="a" href="/" color="inherit">Dashboard</Button><Button component="a" href="/events" color="inherit">Events</Button></Toolbar></AppBar>{children}</Box>; }

export default function App() {
  return <Layout><Routes><Route path="/" element={<DashboardPage />} /><Route path="/events" element={<EventsPage />} /><Route path="/events/:id" element={<EventDetailsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Layout>;
}
