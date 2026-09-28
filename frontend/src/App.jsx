import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventFormPage from './pages/EventFormPage';
import VenuesPage from './pages/VenuesPage';
import AttendeesPage from './pages/AttendeesPage';

function NavButton({ to, label }) {
  return (
    <Button color="inherit" href={to} sx={{ textTransform: 'none', fontWeight: 600 }}>
      {label}
    </Button>
  );
}

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef4ff 0%, #f4f7fb 100%)' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)' }}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
            EventFlow
          </Typography>
          <NavButton to="/" label="Dashboard" />
          <NavButton to="/events" label="Events" />
          <NavButton to="/venues" label="Venues" />
          <NavButton to="/attendees" label="Attendees" />
          <Button variant="contained" color="secondary" href="/events/new" sx={{ textTransform: 'none', fontWeight: 700 }}>
            Create Event
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/new" element={<EventFormPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/events/:eventId/edit" element={<EventFormPage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/attendees" element={<AttendeesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}
