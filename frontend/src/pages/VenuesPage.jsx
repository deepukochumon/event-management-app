import React from 'react';
import { useVenues } from '../api/hooks';

export default function VenuesPage() {
  const { data, isLoading, isError, error } = useVenues({ page_size: 100 });
  const venues = data?.results ?? [];

  return (
    <div className="page"><div className="container"><div className="panel pad"><h1 style={{ marginTop: 0 }}>Venues</h1><p className="muted">Browse available locations used by events.</p>{isLoading ? <div className="loading">Loading venues…</div> : isError ? <div className="error">{error?.message || 'Failed to load venues'}</div> : venues.length === 0 ? <div className="empty">No venues available.</div> : <div className="grid events-grid">{venues.map((venue) => (<div key={venue.id} className="panel card"><div className="card-body"><h3 className="card-title">{venue.name}</h3><div className="muted">{venue.address || 'No address provided'}</div><div className="card-meta" style={{ marginTop: 10 }}><span>Capacity {venue.capacity ?? '—'}</span><span>{venue.city || ''}</span></div></div></div>))}</div>}</div></div></div>
  );
}