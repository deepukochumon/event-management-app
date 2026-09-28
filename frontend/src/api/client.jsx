import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (payload) => api.post('/auth/register/', payload),
  me: () => api.get('/auth/me/'),
};

export const eventsAPI = {
  list: (params) => api.get('/events/', { params }),
  retrieve: (id) => api.get(`/events/${id}/`),
  create: (data) => api.post('/events/', data),
  update: (id, data) => api.put(`/events/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`/events/${id}/`, data),
  remove: (id) => api.delete(`/events/${id}/`),
  dashboard: () => api.get('/events/dashboard/'),
  calendar: (params) => api.get('/events/calendar/', { params }),
};

export const venuesAPI = {
  list: (params) => api.get('/venues/', { params }),
  create: (data) => api.post('/venues/', data),
  update: (id, data) => api.put(`/venues/${id}/`, data),
  remove: (id) => api.delete(`/venues/${id}/`),
};

export const attendeesAPI = {
  list: (params) => api.get('/attendees/', { params }),
  create: (data) => api.post('/attendees/', data),
  update: (id, data) => api.put(`/attendees/${id}/`, data),
  remove: (id) => api.delete(`/attendees/${id}/`),
};

export const registrationsAPI = {
  list: (params) => api.get('/registrations/', { params }),
  create: (data) => api.post('/registrations/', data),
  update: (id, data) => api.put(`/registrations/${id}/`, data),
  remove: (id) => api.delete(`/registrations/${id}/`),
};
