import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { Home } from './pages/Home';
import { Vehicles } from './pages/Vehicles';
import { Services } from './pages/Services';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Finance } from './pages/Finance';
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
      { path: 'services', Component: Services },
      { path: 'about', Component: About },
      { path: 'contact', Component: Contact },
      { path: 'ownership', Component: Services },
      { path: 'finance', Component: Finance },
      { path: 'zh', Component: ChineseHome },
      { path: 'zh/vehicles', Component: ChineseVehicles },
      { path: 'zh/services', Component: ChineseServices },
      { path: 'zh/finance', Component: ChineseFinance },
      { path: 'zh/about', Component: ChineseAbout },
      { path: 'zh/contact', Component: ChineseContact },
    ],
  },
]);
