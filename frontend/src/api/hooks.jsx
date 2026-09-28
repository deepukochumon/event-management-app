import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

const qs = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, v));
      return;
    }
    search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const unwrap = (response) => response?.data ?? response;

export const useDashboardStats = () => useQuery({
  queryKey: ['dashboard', 'stats'],
  queryFn: async () => unwrap(await api.get('/dashboard/stats/')),
});

export const useEvents = (params) => {
  const query = useMemo(() => params, [JSON.stringify(params || {})]);
  return useQuery({
    queryKey: ['events', query],
    queryFn: async () => unwrap(await api.get(`/events/${qs(query)}`)),
    keepPreviousData: true,
  });
};

export const useEvent = (id) => useQuery({
  queryKey: ['events', id],
  queryFn: async () => unwrap(await api.get(`/events/${id}/`)),
  enabled: !!id,
});

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => unwrap(await api.post('/events/', payload)),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => unwrap(await api.put(`/events/${id}/`, payload)),
    onSuccess: async (_, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['events'] }),
        qc.invalidateQueries({ queryKey: ['events', vars.id] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => unwrap(await api.delete(`/events/${id}/`)),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
};

export const useVenues = (params = {}) => useQuery({
  queryKey: ['venues', params],
  queryFn: async () => unwrap(await api.get(`/venues/${qs(params)}`)),
});

export const useAttendees = (params = {}) => useQuery({
  queryKey: ['attendees', params],
  queryFn: async () => unwrap(await api.get(`/attendees/${qs(params)}`)),
});

export const useRegistrations = (params = {}) => useQuery({
  queryKey: ['registrations', params],
  queryFn: async () => unwrap(await api.get(`/registrations/${qs(params)}`)),
});

export const useCreateRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => unwrap(await api.post('/registrations/', payload)),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['registrations'] }),
        qc.invalidateQueries({ queryKey: ['events'] }),
        qc.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
};

export const useDeleteRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => unwrap(await api.delete(`/registrations/${id}/`)),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['registrations'] }),
  });
};
