import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateEvent, useEvent, useUpdateEvent, useVenues } from '../api/hooks';

const blankEvent = { title: '', description: '', venue: '', start_date: '', end_date: '', capacity: '', status: 'draft', event_type: 'conference' };

export default function EventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: event } = useEvent(id, { enabled: isEdit });
  const { data: venuesData } = useVenues({ page_size: 100 });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const [form, setForm] = useState(blankEvent);
  const [error, setError] = useState('');

  const venues = venuesData?.results ?? [];
  useMemo(() => { if (event && isEdit) setForm({ title: event.title || '', description: event.description || '', venue: event.venue || '', start_date: event.start_date?.slice(0, 16) || '', end_date: event.end_date?.slice(0, 16) || '', capacity: event.capacity ?? '', status: event.status || 'draft', event_type: event.event_type || 'conference' }); }, [event, isEdit]);

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const submit = async (e) => { e.preventDefault(); setError(''); if (!form.title.trim()) return setError('Title is required.'); if (!form.start_date) return setError('Start date is required.'); const payload = { ...form, capacity: form.capacity === '' ? null : Number(form.capacity) }; try { if (isEdit) await updateEvent.mutateAsync({ id, data: payload }); else await createEvent.mutateAsync(payload); navigate('/events'); } catch (err) { setError(err?.response?.data?.detail || err.message || 'Unable to save event'); } };

  return (
    <div className="page"><div className="container"><div className="panel pad"><h1 style={{ marginTop: 0 }}>{isEdit ? 'Edit event' : 'Create event'}</h1>{error && <div className="error">{error}</div>}<form className="form-grid" onSubmit={submit}><div className="field"><label>Title</label><input className="input" value={form.title} onChange={onChange('title')} required /></div><div className="field"><label>Venue</label><select className="select" value={form.venue} onChange={onChange('venue')}><option value="">Select venue</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select></div><div className="field"><label>Start date</label><input className="input" type="datetime-local" value={form.start_date} onChange={onChange('start_date')} required /></div><div className="field"><label>End date</label><input className="input" type="datetime-local" value={form.end_date} onChange={onChange('end_date')} /></div><div className="field"><label>Status</label><select className="select" value={form.status} onChange={onChange('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></div><div className="field"><label>Type</label><select className="select" value={form.event_type} onChange={onChange('event_type')}><option value="conference">Conference</option><option value="workshop">Workshop</option><option value="meetup">Meetup</option><option value="webinar">Webinar</option></select></div><div className="field span-2"><label>Description</label><textarea rows="5" className="input" value={form.description} onChange={onChange('description')} /></div><div className="field"><label>Capacity</label><input className="input" type="number" value={form.capacity} onChange={onChange('capacity')} min="0" /></div><div className="field" style={{ alignSelf: 'end' }}><button className="btn primary" type="submit">{isEdit ? 'Update event' : 'Create event'}</button></div></form></div></div></div>
  );
}