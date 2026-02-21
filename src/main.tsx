import axios from 'axios';
import { StrictMode } from 'react';
import moment from 'moment-timezone';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router';

import App from './app';
import config from './config';
import store from './redux/store';
import { routesSection } from './routes/sections';
import { ErrorBoundary } from './routes/components';

// ----------------------------------------------------------------------

// Axios configuration
axios.defaults.baseURL = config.BASE_URL;

axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Timezone'] = moment.tz.guess();

const token = localStorage.getItem('jwtToken');
if (token) {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
}

axios.interceptors.request.use(
  (requestConfig) => {
    const activeToken = localStorage.getItem('jwtToken');
    if (activeToken) {
      requestConfig.headers.Authorization = `Bearer ${activeToken}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);


import { showAlert } from './redux/slices/alertSlice';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config && error.config.skipAuthRedirect) {
        return Promise.reject(error);
      }

      // Clear storage
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userName');

      // Redirect to login
      window.location.replace('/sign-in');
    } else {
      // Global error alert
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      store.dispatch(showAlert({ message, severity: 'error' }));
    }
    return Promise.reject(error);
  }
);


// ----------------------------------------------------------------------

const router = createBrowserRouter([
  {
    Component: () => (
      <App>
        <Outlet />
      </App>
    ),
    errorElement: <ErrorBoundary />,
    children: routesSection,
  },
]);

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);

