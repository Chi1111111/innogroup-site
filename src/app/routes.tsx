import { createBrowserRouter, Navigate } from 'react-router';
import { Root } from './Root';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/Home')).Home }) },
      { path: 'japan-market', lazy: async () => ({ Component: (await import('./pages/JapanMarket')).JapanMarket }) },
      { path: 'japan-market/:segment', lazy: async () => ({ Component: (await import('./pages/JapanMarketEntry')).JapanMarketEntry }) },
      { path: 'japan-market/:make/:model', lazy: async () => ({ Component: (await import('./pages/JapanMarketEntry')).JapanMarketModelEntry }) },
      { path: 'vehicles/china', lazy: async () => ({ Component: (await import('./pages/ChinaVehicles')).ChinaVehicles }) },
      { path: 'vehicles/japan-special-order', Component: () => <Navigate to="/weekly-report" replace /> },
      { path: 'vehicles/find-my-car', lazy: async () => ({ Component: (await import('./pages/FindMyCar')).FindMyCar }) },
      { path: 'weekly-report', lazy: async () => ({ Component: (await import('./pages/WeeklyReport')).WeeklyReport }) },
      { path: 'selected-vehicles', lazy: async () => ({ Component: (await import('./pages/SelectedVehicles')).SelectedVehicles }) },
      { path: 'weekly-report/:issue/:slug', lazy: async () => ({ Component: (await import('./pages/WeeklyVehicleDetail')).WeeklyVehicleDetail }) },
      { path: 'vehicles/china/baw-m8', lazy: async () => ({ Component: (await import('./pages/BawM8Page')).BawM8Page }) },
      { path: 'vehicles/china/wox-air', lazy: async () => ({ Component: (await import('./pages/WoxVehiclePage')).WoxAirPage }) },
      { path: 'vehicles/china/wox-nebula', lazy: async () => ({ Component: (await import('./pages/WoxVehiclePage')).WoxNebulaPage }) },
      { path: 'vehicles/china/wox-shera', lazy: async () => ({ Component: (await import('./pages/WoxVehiclePage')).WoxSheraPage }) },
      { path: 'vehicles/china/wox-zeny', lazy: async () => ({ Component: (await import('./pages/WoxVehiclePage')).WoxZenyPage }) },
      { path: 'vehicles/china/:slug', lazy: async () => ({ Component: (await import('./pages/WoxExpansionVehiclePage')).WoxExpansionVehiclePage }) },
      { path: 'services', lazy: async () => ({ Component: (await import('./pages/Services')).Services }) },
      { path: 'about', lazy: async () => ({ Component: (await import('./pages/About')).About }) },
      { path: 'contact', lazy: async () => ({ Component: (await import('./pages/Contact')).Contact }) },
      { path: 'ownership', Component: () => <Navigate to="/services" replace /> },
      { path: 'finance', lazy: async () => ({ Component: (await import('./pages/Finance')).Finance }) },
      { path: 'privacy', lazy: async () => ({ Component: (await import('./pages/Privacy')).Privacy }) },
      {
        path: 'admin',
        lazy: async () => ({ Component: (await import('./components/AdminAuthGate')).AdminAuthGate }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import('./pages/AdminVehicles')).AdminVehicles }) },
          {
            path: 'weekly-reports',
            lazy: async () => {
              const { AdminVehicles } = await import('./pages/AdminVehicles');
              return { Component: () => <AdminVehicles mode="weekly" /> };
            },
          },
          { path: 'crm', lazy: async () => ({ Component: (await import('./pages/AdminCrm')).AdminCrm }) },
          { path: 'contracts', lazy: async () => ({ Component: (await import('./pages/AdminContracts')).AdminContracts }) },
          { path: 'invoices', lazy: async () => ({ Component: (await import('./pages/AdminInvoices')).AdminInvoices }) },
        ],
      },
      { path: 'contract/:contractId', lazy: async () => ({ Component: (await import('./pages/SignContract')).SignContract }) },
      { path: 'sign/:contractId', lazy: async () => ({ Component: (await import('./pages/SignContract')).SignContract }) },
      { path: 'zh', Component: () => <Navigate to="/" replace /> },
      { path: 'zh/services', Component: () => <Navigate to="/services" replace /> },
      { path: 'zh/finance', Component: () => <Navigate to="/finance" replace /> },
      { path: 'zh/about', Component: () => <Navigate to="/about" replace /> },
      { path: 'zh/contact', Component: () => <Navigate to="/contact" replace /> },
      { path: '404', lazy: async () => ({ Component: (await import('./pages/NotFound')).NotFound }) },
      { path: '*', lazy: async () => ({ Component: (await import('./pages/NotFound')).NotFound }) },
    ],
  },
]);
