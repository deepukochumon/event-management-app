import React from 'react';
import { Routes, Route, Navigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  BarChart3,
  CalendarDays,
  Home,
  Menu,
  Settings,
  Users,
  Building2,
  Ticket,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' });

const navItems = [
  { label: 'Dashboard', icon: <Home size={18} />, path: '/' },
  { label: 'Events', icon: <CalendarDays size={18} />, path: '/events' },
  { label: 'Registrations', icon: <Ticket size={18} />, path: '/registrations' },
  { label: 'Attendees', icon: <Users size={18} />, path: '/attendees' },
  { label: 'Venues', icon: <Building2 size={18} />, path: '/venues' },
  { label: 'Reports', icon: <BarChart3 size={18} />, path: '/reports' },
  { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
];

function Layout({ children }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  const drawer = (
    <Box sx={{ p: 2, height: '100%', bgcolor: 'background.paper' }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>EventFlow</Typography>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(14px)', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          {!isMdUp && (
            <IconButton edge="start" onClick={() => setMobileOpen((v) => !v)} sx={{ mr: 1 }}>
              <Menu />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>Event Management</Typography>
          <Button variant="outlined" component={RouterLink} to="/events">New Event</Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: 280 }, flexShrink: { md: 0 } }}>
        {!isMdUp ? (
          <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
            {drawer}
          </Drawer>
        ) : (
          <Box sx={{ width: 280, borderRight: '1px solid', borderColor: 'divider', position: 'fixed', top: 64, bottom: 0, left: 0 }}>
            {drawer}
          </Box>
        )}
      </Box>
      <Box component="main" sx={{ flexGrow: 1, ml: { md: '280px' }, pt: 10, pb: 4 }}>
        <Container maxWidth="xl">{children}</Container>
      </Box>
    </Box>
  );
}

function StatCard({ title, value, hint }) {
  return (
    <Box sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', boxShadow: '0 10px 35px rgba(15,23,42,0.06)', border: '1px solid', borderColor: 'divider' }}>
      <Typography color="text.secondary" variant="body2">{title}</Typography>
      <Typography variant="h4" sx={{ mt: 1, mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" color="success.main">{hint}</Typography>
    </Box>
  );
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await API.get('/dashboard/')).data,
  });

  if (isLoading) return <Typography>Loading dashboard...</Typography>;
  if (error) return <Typography color="error">Failed to load dashboard.</Typography>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>Dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Overview of events, registrations, venues, and attendees.</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' } }}>
        <StatCard title="Upcoming Events" value={data.upcoming_events} hint="Next 30 days" />
        <StatCard title="Registrations" value={data.registrations_total} hint={`+${data.registrations_this_week} this week`} />
        <StatCard title="Attendees" value={data.attendees_total} hint="Confirmed profiles" />
        <StatCard title="Venues" value={data.venues_total} hint="Available spaces" />
      </Box>
      <Box sx={{ mt: 4, p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Upcoming Events</Typography>
        {data.upcoming_events_list?.length ? data.upcoming_events_list.map((event) => (
          <Box key={event.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
            <div>
              <Typography fontWeight={600}>{event.title}</Typography>
              <Typography variant="body2" color="text.secondary">{event.start_date} · {event.venue_name}</Typography>
            </div>
            <Typography variant="body2">{event.registration_count} registrations</Typography>
          </Box>
        )) : <Typography color="text.secondary">No upcoming events.</Typography>}
      </Box>
    </Box>
  );
}

const Placeholder = ({ title }) => <Box><Typography variant="h4" sx={{ mb: 1 }}>{title}</Typography><Typography color="text.secondary">Connects to backend APIs and supports CRUD, filters, and pagination.</Typography></Box>;

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events" element={<Placeholder title="Events" />} />
        <Route path="/registrations" element={<Placeholder title="Registrations" />} />
        <Route path="/attendees" element={<Placeholder title="Attendees" />} />
        <Route path="/venues" element={<Placeholder title="Venues" />} />
        <Route path="/reports" element={<Placeholder title="Reports" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
