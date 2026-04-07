import { Navigate, createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { Home } from './pages/Home';
import { Vehicles } from './pages/Vehicles';
import { Services } from './pages/Services';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Finance } from './pages/Finance';
import { Stories } from './pages/Stories';
import { SITE_FEATURES } from '../config/siteFeatures';

function StoriesRedirect() {
  return <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'vehicles', Component: Vehicles },
      { path: 'services', Component: Services },
      { path: 'about', Component: About },
      {
        path: 'stories',
        Component: SITE_FEATURES.stories ? Stories : StoriesRedirect,
      },
      { path: 'contact', Component: Contact },
      { path: 'ownership', Component: Services },
      { path: 'finance', Component: Finance },
    ],
  },
]);
