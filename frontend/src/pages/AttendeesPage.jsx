import React from 'react';
import { useAttendees } from '../api/hooks';

export default function AttendeesPage() {
  const { data, isLoading, isError, error } = useAttendees({ page_size: 100 });
  const attendees = data?.results ?? [];

  return (
    <div className="page"><div className="container"><div className="panel pad"><h1 style={{ marginTop: 0 }}>Attendees</h1><p className="muted">Registered people and contact details.</p>{isLoading ? <div className="loading">Loading attendees…</div> : isError ? <div className="error">{error?.message || 'Failed to load attendees'}</div> : attendees.length === 0 ? <div className="empty">No attendees found.</div> : <table className="table"><thead><tr><th>Name</th><th>Email</th><th>Organization</th><th>Registrations</th></tr></thead><tbody>{attendees.map((attendee) => (<tr key={attendee.id}><td>{attendee.name}</td><td>{attendee.email}</td><td>{attendee.organization || '—'}</td><td>{attendee.registration_count ?? 0}</td></tr>))}</tbody></table>}</div></div></div>
  );
}