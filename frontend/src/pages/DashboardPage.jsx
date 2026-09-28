import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CalendarDays, Users, MapPin, Ticket, TrendingUp, ArrowRight, CircleAlert } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { useDashboard, useUpcomingEvents } from '../api/hooks';
import { formatDateRange, formatDateTime, getEventStatus } from '../utils/formatters';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StatCard = ({ icon: Icon, label, value, hint, tone = 'primary' }) => (
  <div className="panel stat">
    <div className="card-meta" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <div className="badge" style={tone === 'success' ? { background: '#dcfce7', color: '#166534' } : tone === 'warning' ? { background: '#fef3c7', color: '#92400e' } : tone === 'danger' ? { background: '#fee2e2', color: '#b91c1c' } : undefined}>
        <Icon size={16} /> {label}
      </div>
    </div>
    <div className="value">{value}</div>
    <div className="muted">{hint}</div>
  </div>
);

export default function DashboardPage() {
  const { data: dashboard, isLoading, isError, error, refetch } = useDashboard();
  const { data: upcomingData } = useUpcomingEvents({ page_size: 5 });
  const upcoming = upcomingData?.results ?? [];

  if (isLoading) return <div className="loading panel pad">Loading dashboard…</div>;
  if (isError) return <div className="error panel pad"><CircleAlert style={{ verticalAlign: 'middle', marginRight: 8 }} />{error?.message || 'Failed to load dashboard'} <button className="btn secondary" onClick={() => refetch()}>Retry</button></div>;

  const stats = dashboard?.stats || {};
  const eventTypeChart = {
    labels: dashboard?.event_type_breakdown?.map((item) => item.label) || [],
    datasets: [{ data: dashboard?.event_type_breakdown?.map((item) => item.value) || [], backgroundColor: ['#2563eb', '#7c3aed', '#0ea5e9', '#22c55e', '#f59e0b'] }],
  };
  const registrationsChart = {
    labels: dashboard?.registrations_by_month?.map((item) => item.label) || [],
    datasets: [{ label: 'Registrations', data: dashboard?.registrations_by_month?.map((item) => item.value) || [], backgroundColor: '#2563eb' }],
  };

  return (
    <div className="page">
      <div className="container grid" style={{ gap: 20 }}>
        <section className="hero">
          <div className="panel hero-card">
            <div className="badge" style={{ marginBottom: 16 }}><TrendingUp size={16} /> Event operations</div>
            <h1 className="hero-title">Manage events, attendees, venues, and registrations in one place.</h1>
            <p className="muted" style={{ fontSize: '1.05rem', maxWidth: 720 }}>Track upcoming events, monitor registrations, and keep your team aligned with a clean workflow built on a real REST API.</p>
            <div className="actions" style={{ marginTop: 18 }}>
              <Link className="btn primary" to="/events">Browse events <ArrowRight size={16} /></Link>
              <Link className="btn secondary" to="/events/new">Create event</Link>
            </div>
          </div>
          <div className="panel pad grid" style={{ gridTemplateRows: 'repeat(3,1fr)' }}>
            <div className="card-meta"><CalendarDays size={18} /> <strong>{stats.upcoming_events ?? 0}</strong> upcoming events</div>
            <div className="card-meta"><Ticket size={18} /> <strong>{stats.total_registrations ?? 0}</strong> registrations</div>
            <div className="card-meta"><Users size={18} /> <strong>{stats.total_attendees ?? 0}</strong> attendees</div>
          </div>
        </section>

        <section className="stat-grid">
          <StatCard icon={CalendarDays} label="Events" value={stats.total_events ?? 0} hint="Total events in the system" />
          <StatCard icon={Ticket} label="Registrations" value={stats.total_registrations ?? 0} hint="Confirmed attendee registrations" tone="success" />
          <StatCard icon={Users} label="Attendees" value={stats.total_attendees ?? 0} hint="Unique attendees" tone="warning" />
          <StatCard icon={MapPin} label="Venues" value={stats.total_venues ?? 0} hint="Locations available for booking" tone="danger" />
        </section>

        <section className="two-col">
          <div className="panel pad">
            <div className="card-meta" style={{ justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0 }}>Upcoming events</h2>
                <div className="muted">Next events and scheduling details</div>
              </div>
              <Link className="btn secondary" to="/events">View all</Link>
            </div>
            <div className="divider" />
            {upcoming.length === 0 ? <div className="empty">No upcoming events found.</div> : <div className="list-stack">{upcoming.map((event) => (<div key={event.id} className="panel pad" style={{ boxShadow: 'none' }}><div className="badge">{getEventStatus(event)}</div><h3 className="card-title"><Link to={`/events/${event.id}`}>{event.title}</Link></h3><div className="card-meta"><span>{formatDateRange(event.start_date, event.end_date)}</span><span>{event.venue_name || 'No venue'}</span></div><div className="card-meta" style={{ marginTop: 8 }}><span>{event.registration_count ?? 0} registrations</span><span>Created {formatDateTime(event.created_at)}</span></div></div>))}</div>}
          </div>
          <div className="panel pad">
            <h2 style={{ marginTop: 0 }}>Quick insights</h2>
            <div className="chart-wrap"><Doughnut data={eventTypeChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
          </div>
        </section>

        <section className="two-col">
          <div className="panel pad">
            <h2 style={{ marginTop: 0 }}>Registrations over time</h2>
            <div className="chart-wrap"><Bar data={registrationsChart} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>
          <div className="panel pad">
            <h2 style={{ marginTop: 0 }}>System summary</h2>
            <div className="list-stack">
              <div className="card-meta"><BarChart3 size={18} /> API-driven dashboard metrics</div>
              <div className="card-meta"><CircleAlert size={18} /> Proper loading, error, and empty states</div>
              <div className="card-meta"><MapPin size={18} /> Venue-aware event coordination</div>
              <div className="card-meta"><Users size={18} /> Attendee and registration management</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}