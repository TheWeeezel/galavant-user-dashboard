import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Changelog } from './pages/Changelog';
import { Profile } from './pages/Profile';
import { EarnPoints } from './pages/EarnPoints';
import { Tasks } from './pages/Tasks';
import { Report } from './pages/Report';
import { Roadmap } from './pages/Roadmap';
import { Leaderboard } from './pages/Leaderboard';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Wallet } from './pages/Wallet';
import Store from './pages/Store';
import { GameplayLayout } from './pages/gameplay/GameplayLayout';
import { GameplayPage } from './pages/gameplay/GameplayPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
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
          <Route path="profile" element={<Profile />} />
          <Route path="earn" element={<EarnPoints />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="report" element={<Report />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="store" element={<Store />} />
          {/* ONE market (task 7dc61fc3): the NFT "Trading Post" merged into /market. Kept so
              old links land on the merged shop rather than 404ing. */}
          <Route path="nft-market" element={<Navigate to="/market" replace />} />
          <Route path="shop" element={<Navigate to="/store" replace />} />
          {/* ENJ staking is the only staking — /staking kept so old links still land */}
          {/* Staking now lives inside the Wallet (account) page. */}
          <Route path="staking" element={<Navigate to="/wallet" replace />} />
          <Route path="enj-staking" element={<Navigate to="/wallet" replace />} />
          <Route path="gameplay" element={<GameplayLayout />}>
            <Route index element={<GameplayPage />} />
            <Route path=":sectionSlug/:pageSlug" element={<GameplayPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
