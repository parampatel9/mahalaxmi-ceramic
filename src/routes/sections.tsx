import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

import { AuthGuard } from './components';

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const BlogPage = lazy(() => import('src/pages/blog'));
export const UserPage = lazy(() => import('src/pages/user'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const ProductsPage = lazy(() => import('src/pages/products'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));
export const ClientsPage = lazy(() => import('src/pages/clients'));
export const ClientNewPage = lazy(() => import('src/pages/client-new'));
export const ClientEditPage = lazy(() => import('src/pages/client-edit'));
export const ClientItemsPage = lazy(() => import('src/pages/client-items'));
export const ClientItemNewPage = lazy(() => import('src/pages/client-item-new'));
export const ItemTypesPage = lazy(() => import('src/pages/item-types'));
export const ItemTypeNewPage = lazy(() => import('src/pages/item-type-new'));
export const ItemTypeEditPage = lazy(() => import('src/pages/item-type-edit'));
export const CustomersPage = lazy(() => import('src/pages/customers'));
export const CustomerNewPage = lazy(() => import('src/pages/customer-new'));
export const CustomerEditPage = lazy(() => import('src/pages/customer-edit'));
export const ClientHistoryPage = lazy(() => import('src/pages/client-history'));
export const ClientClientHistoryPage = lazy(() => import('src/pages/client-client-history'));
export const DayBillsPage = lazy(() => import('src/pages/day-bills'));
export const ClientPendingPaymentPage = lazy(() => import('src/pages/client-pending-payment'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'user', element: <UserPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/new', element: <ClientNewPage /> },
      { path: 'clients/:clientId/edit', element: <ClientEditPage /> },
      { path: 'clients/:clientId/items', element: <ClientItemsPage /> },
      { path: 'clients/:clientId/history', element: <ClientClientHistoryPage /> },
      { path: 'clients/pending-payments', element: <ClientPendingPaymentPage /> },
      { path: 'day-bills', element: <DayBillsPage /> },
      { path: 'clients/:clientId/items/new', element: <ClientItemNewPage /> },
      { path: 'clients/:clientId/items/:itemId/edit', element: <ClientItemNewPage /> },
      { path: 'item-types', element: <ItemTypesPage /> },
      { path: 'item-types/new', element: <ItemTypeNewPage /> },
      { path: 'item-types/:itemTypeId/edit', element: <ItemTypeEditPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/new', element: <CustomerNewPage /> },
      { path: 'customers/:customerId/edit', element: <CustomerEditPage /> },
      { path: 'client-history', element: <ClientHistoryPage /> },
    ],
  },
  {
    path: 'sign-in',
    element: (
      <AuthLayout>
        <SignInPage />
      </AuthLayout>
    ),
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
