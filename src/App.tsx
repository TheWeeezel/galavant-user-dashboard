import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Changelog } from './pages/Changelog';
import { Profile } from './pages/Profile';
import { EarnPoints } from './pages/EarnPoints';
import { Report } from './pages/Report';
import { Bounty } from './pages/Bounty';
import { Roadmap } from './pages/Roadmap';
import { Leaderboard } from './pages/Leaderboard';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { PressKit } from './pages/PressKit';
import { Wallet } from './pages/Wallet';
import { GameplayLayout } from './pages/gameplay/GameplayLayout';
import { GameplayPage } from './pages/gameplay/GameplayPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/**
 * The bike shop used to be its own page. /store stays as the short link — it is in posts, and it is
 * Stripe's return address (success_url / cancel_url in the server's bike-store.ts) — and lands on the
 * market's Bike Shop tab with ?status= and ?session_id= carried along.
 */
function ToBikeShop() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set('tab', 'shop');
  return <Navigate to={`/market?${params}`} replace />;
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
          {/* The tester task track closed with the test month (server lever testing_tasks_enabled=0).
              Old links and bookmarks land on the home page rather than an empty checklist. */}
          <Route path="tasks" element={<Navigate to="/" replace />} />
          <Route path="report" element={<Report />} />
          {/* Short on purpose — the bounty rules are meant to be pasted into a post. */}
          <Route path="bounty" element={<Bounty />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="press-kit" element={<PressKit />} />
          <Route path="press" element={<Navigate to="/press-kit" replace />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="store" element={<ToBikeShop />} />
          {/* ONE market (task 7dc61fc3): the NFT "Trading Post" merged into /market. Kept so
              old links land on the merged shop rather than 404ing. */}
          <Route path="nft-market" element={<Navigate to="/market" replace />} />
          <Route path="shop" element={<ToBikeShop />} />
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
