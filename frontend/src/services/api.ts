import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agams_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If 401 occurs and we haven't already retried this request, attempt silent auto-auth
    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await axios.post('/api/auth/login', {
            email: 'head@agams.airport',
            password: 'password123',
          });
          const newToken = res.data.access_token;
          if (newToken) {
            localStorage.setItem('agams_token', newToken);
            localStorage.setItem('agams_user', JSON.stringify(res.data));
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            isRefreshing = false;
            return api(originalRequest);
          }
        } catch (authErr) {
          console.warn('Silent re-authentication failed', authErr);
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

