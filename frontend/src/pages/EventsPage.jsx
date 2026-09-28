import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, CalendarRange, ArrowUpDown, Pencil, Trash2, Eye } from 'lucide-react';
import { useDeleteEvent, useEvents, useVenues } from '../api/hooks';
import { formatDateRange, getEventStatus } from '../utils/formatters';

const sortOptions = [
  { value: 'start_date', label: 'Start date' },
  { value: '-start_date', label: 'Start date (desc)' },
  { value: 'title', label: 'Title' },
  { value: '-created_at', label: 'Newest' },
];

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [confirmId, setConfirmId] = useState(null);
  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    venue: searchParams.get('venue') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    ordering: searchParams.get('ordering') || 'start_date',
    page: Number(searchParams.get('page') || 1),
    page_size: 12,
  }), [searchParams]);
  const { data, isLoading, isError, error, refetch } = useEvents(filters);
  const { data: venuesData } = useVenues({ page_size: 100 });
  const deleteEvent = useDeleteEvent();
  const venues = venuesData?.results ?? [];

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key); else next.set(key, value);
    next.delete('page');
    setSearchParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    updateParam('search', query);
  };

  const events = data?.results ?? [];

  return (
    <div className="page">
      <div className="container grid">
        <div className="panel pad">
          <div className="card-meta" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0 }}>Events</h1>
              <div className="muted">Search, filter, sort, and manage your event catalog.</div>
            </div>
            <Link className="btn primary" to="/events/new"><Plus size={16} /> New event</Link>
          </div>
          <div className="divider" />
          <form className="toolbar" onSubmit={submitSearch}>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Search</label>
              <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, description, or location" />
            </div>
            <div className="field">
              <label>Status</label>
              <select className="select" value={filters.status} onChange={(e) => updateParam('status', e.target.value)}><option value="">All</option><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
            </div>
            <div className="field">
              <label>Venue</label>
              <select className="select" value={filters.venue} onChange={(e) => updateParam('venue', e.target.value)}><option value="">All venues</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select>
            </div>
            <div className="field">
              <label>Ordering</label>
              <select className="select" value={filters.ordering} onChange={(e) => updateParam('ordering', e.target.value)}>{sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
            </div>
            <div className="field">
              <label>Dates</label>
              <button type="submit" className="btn secondary"><Search size={16} /> Apply</button>
            </div>
          </form>
          <div className="toolbar" style={{ marginTop: 12, gridTemplateColumns: 'repeat(4,minmax(0,1fr))' }}>
            <div className="field"><label>Start after</label><input className="input" type="date" value={filters.start_date} onChange={(e) => updateParam('start_date', e.target.value)} /></div>
            <div className="field"><label>End before</label><input className="input" type="date" value={filters.end_date} onChange={(e) => updateParam('end_date', e.target.value)} /></div>
            <div className="field"><label>Page</label><button className="btn secondary" type="button" onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(Math.max(1, filters.page - 1))); setSearchParams(next); }}><ArrowUpDown size={16} /> Prev/Next</button></div>
            <div className="field"><label>Reset</label><button className="btn secondary" type="button" onClick={() => { setQuery(''); setSearchParams({ page: '1' }); }}><SlidersHorizontal size={16} /> Clear filters</button></div>
          </div>
        </div>

        {isLoading ? <div className="loading panel pad">Loading events…</div> : isError ? <div className="error panel pad">{error?.message || 'Failed to load events'} <button className="btn secondary" onClick={() => refetch()}>Retry</button></div> : events.length === 0 ? <div className="empty panel pad">No events match your filters.</div> : <div className="grid events-grid">{events.map((event) => (<article key={event.id} className="panel card"><div className="card-body"><div className="badge">{getEventStatus(event)}</div><h3 className="card-title">{event.title}</h3><div className="card-meta"><span><CalendarRange size={14} /> {formatDateRange(event.start_date, event.end_date)}</span></div><div className="card-meta"><span>{event.venue_name || 'No venue'}</span><span>{event.registration_count ?? 0} regs</span></div><p className="muted">{event.description?.slice(0, 120) || 'No description provided.'}{event.description?.length > 120 ? '…' : ''}</p><div className="actions"><Link className="btn secondary" to={`/events/${event.id}`}><Eye size={16} /> Details</Link><Link className="btn secondary" to={`/events/${event.id}/edit`}><Pencil size={16} /> Edit</Link><button className="btn danger" onClick={() => setConfirmId(event.id)}><Trash2 size={16} /> Delete</button></div></div></article>))}</div>}
        {confirmId && <div className="panel pad"><div className="card-meta" style={{ justifyContent: 'space-between', alignItems: 'center' }}><div>Delete this event? This action cannot be undone.</div><div className="actions"><button className="btn secondary" onClick={() => setConfirmId(null)}>Cancel</button><button className="btn danger" onClick={async () => { await deleteEvent.mutateAsync(confirmId); setConfirmId(null); }}>Delete</button></div></div></div>}
      </div>
    </div>
  );
}