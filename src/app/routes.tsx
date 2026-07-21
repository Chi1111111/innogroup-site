import { createBrowserRouter, Navigate } from 'react-router';
import { Root } from './Root';
import { Home } from './pages/Home';
import { BawM8Page } from './pages/BawM8Page';
import { ChinaVehicles } from './pages/ChinaVehicles';
import { WoxAirPage, WoxNebulaPage, WoxSheraPage, WoxZenyPage } from './pages/WoxVehiclePage';
import { Services } from './pages/Services';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Finance } from './pages/Finance';
import { AdminVehicles } from './pages/AdminVehicles';
import { AdminContracts } from './pages/AdminContracts';
import { AdminCrm } from './pages/AdminCrm';
import { SignContract } from './pages/SignContract';
import { JpaucFeed } from './pages/JpaucFeed';
import { WeeklyReport } from './pages/WeeklyReport';
import { WeeklyVehicleDetail } from './pages/WeeklyVehicleDetail';
import { FindMyCar } from './pages/FindMyCar';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'vehicles/china', Component: ChinaVehicles },
      { path: 'vehicles/japan-special-order', Component: () => <Navigate to="/weekly-report" replace /> },
      { path: 'vehicles/japan-live-stock', Component: JpaucFeed },
      { path: 'vehicles/find-my-car', Component: FindMyCar },
      { path: 'weekly-report', Component: WeeklyReport },
      { path: 'weekly-report/:issue/:slug', Component: WeeklyVehicleDetail },
      { path: 'vehicles/china/baw-m8', Component: BawM8Page },
      { path: 'vehicles/china/wox-air', Component: WoxAirPage },
      { path: 'vehicles/china/wox-nebula', Component: WoxNebulaPage },
      { path: 'vehicles/china/wox-shera', Component: WoxSheraPage },
      { path: 'vehicles/china/wox-zeny', Component: WoxZenyPage },
      { path: 'services', Component: Services },
      { path: 'about', Component: About },
      { path: 'contact', Component: Contact },
      { path: 'ownership', Component: Services },
      { path: 'finance', Component: Finance },
      { path: 'jpauc-feed', Component: JpaucFeed },
      { path: 'admin', Component: AdminVehicles },
      { path: 'admin/crm', Component: AdminCrm },
      { path: 'admin/contracts', Component: AdminContracts },
      { path: 'contract/:contractId', Component: SignContract },
      { path: 'sign/:contractId', Component: SignContract },
      { path: 'zh', Component: () => <Navigate to="/" replace /> },
      { path: 'zh/services', Component: () => <Navigate to="/services" replace /> },
      { path: 'zh/finance', Component: () => <Navigate to="/finance" replace /> },
      { path: 'zh/about', Component: () => <Navigate to="/about" replace /> },
      { path: 'zh/contact', Component: () => <Navigate to="/contact" replace /> },
    ],
  },
]);
