import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Changelog } from './pages/Changelog';
import { GameplayLayout } from './pages/gameplay/GameplayLayout';
import { GameplayPage } from './pages/gameplay/GameplayPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="market" element={<Marketplace />} />
          <Route path="changelog" element={<Changelog />} />
          <Route path="gameplay" element={<GameplayLayout />}>
            <Route index element={<GameplayPage />} />
            <Route path=":sectionSlug/:pageSlug" element={<GameplayPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
