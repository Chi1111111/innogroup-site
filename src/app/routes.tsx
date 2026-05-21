import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { Home } from './pages/Home';
import { Vehicles } from './pages/Vehicles';
import { BawM8Page } from './pages/BawM8Page';
import { ChinaVehicles } from './pages/ChinaVehicles';
import { Services } from './pages/Services';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Finance } from './pages/Finance';
import { AdminVehicles } from './pages/AdminVehicles';
import { AdminContracts } from './pages/AdminContracts';
import { SignContract } from './pages/SignContract';
import { JpaucFeed } from './pages/JpaucFeed';
import {
  ChineseAbout,
  ChineseContact,
  ChineseFinance,
  ChineseHome,
  ChineseServices,
  ChineseVehicles,
} from './pages/ChinesePages';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'vehicles', Component: Vehicles },
      { path: 'vehicles/china', Component: ChinaVehicles },
      { path: 'vehicles/china/baw-m8', Component: BawM8Page },
      { path: 'vehicles/baw-m8', Component: BawM8Page },
      { path: 'services', Component: Services },
      { path: 'about', Component: About },
      { path: 'contact', Component: Contact },
      { path: 'ownership', Component: Services },
      { path: 'finance', Component: Finance },
      { path: 'jpauc-feed', Component: JpaucFeed },
      { path: 'admin', Component: AdminVehicles },
      { path: 'admin/contracts', Component: AdminContracts },
      { path: 'contract/:contractId', Component: SignContract },
      { path: 'sign/:contractId', Component: SignContract },
      { path: 'zh', Component: ChineseHome },
      { path: 'zh/vehicles', Component: ChineseVehicles },
      { path: 'zh/services', Component: ChineseServices },
      { path: 'zh/finance', Component: ChineseFinance },
      { path: 'zh/about', Component: ChineseAbout },
      { path: 'zh/contact', Component: ChineseContact },
    ],
  },
]);
