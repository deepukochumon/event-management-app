import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Ticket, Pencil, Trash2, CircleAlert } from 'lucide-react';
import { useDeleteEvent, useEvent, useRegistrations, useCreateRegistration, useDeleteRegistration } from '../api/hooks';
import { formatDateTime, formatDateRange, getEventStatus } from '../utils/formatters';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event, isLoading, isError, error, refetch } = useEvent(id);
  const { data: regsData } = useRegistrations({ event: id, page_size: 100 });
  const createRegistration = useCreateRegistration();
  const deleteRegistration = useDeleteRegistration();
  const deleteEvent = useDeleteEvent();
  const [attendeeId, setAttendeeId] = useState('');

  if (isLoading) return <div className="loading panel pad">Loading event…</div>;
  if (isError) return <div className="error panel pad"><CircleAlert size={16} /> {error?.message || 'Failed to load event'} <button className="btn secondary" onClick={() => refetch()}>Retry</button></div>;
  if (!event) return <div className="empty panel pad">Event not found.</div>;

  const registrations = regsData?.results ?? [];

  return (
    <div className="page">
      <div className="container two-col">
        <div className="grid">
          <div className="panel pad">
            <div className="badge">{getEventStatus(event)}</div>
            <h1 style={{ marginBottom: 8 }}>{event.title}</h1>
            <div className="card-meta"><span><CalendarDays size={14} /> {formatDateRange(event.start_date, event.end_date)}</span><span><MapPin size={14} /> {event.venue_name || 'No venue'}</span></div>
            <p style={{ marginTop: 16 }}>{event.description || 'No description available.'}</p>
            <div className="card-meta"><span><Users size={14} /> {event.registration_count ?? 0} registrations</span><span><Ticket size={14} /> Capacity {event.capacity ?? 'Unlimited'}</span></div>
            <div className="divider" />
            <div className="actions"><Link className="btn secondary" to={`/events/${event.id}/edit`}><Pencil size={16} /> Edit</Link><button className="btn danger" onClick={async () => { await deleteEvent.mutateAsync(event.id); navigate('/events'); }}><Trash2 size={16} /> Delete</button></div>
          </div>
          <div className="panel pad">
            <h2 style={{ marginTop: 0 }}>Add registration</h2>
            <div className="field"><label>Attendee ID</label><input className="input" value={attendeeId} onChange={(e) => setAttendeeId(e.target.value)} placeholder="Enter attendee id" /></div>
            <div className="actions" style={{ marginTop: 12 }}><button className="btn primary" onClick={async () => { await createRegistration.mutateAsync({ attendee: attendeeId, event: event.id }); setAttendeeId(''); }}>Register attendee</button></div>
            <div className="divider" />
            <h3>Registrations</h3>
            {registrations.length === 0 ? <div className="empty">No registrations yet.</div> : <div className="list-stack">{registrations.map((reg) => (<div key={reg.id} className="panel pad" style={{ boxShadow: 'none' }}><div className="card-meta" style={{ justifyContent: 'space-between' }}><strong>{reg.attendee_name || reg.attendee}</strong><button className="btn danger" onClick={async () => deleteRegistration.mutateAsync(reg.id)}>Remove</button></div><div className="muted">Registered {formatDateTime(reg.created_at)}</div></div>))}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}