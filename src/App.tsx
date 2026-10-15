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
import { TermsOfSale } from './pages/TermsOfSale';
import { RefundPolicy } from './pages/RefundPolicy';
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
 * The bike shop used to be its own page, then a tab of the market; now its starter packs sit on top
 * of the market. /store stays as the short link — it is in posts, and older Stripe sessions return
 * to it (new ones return to /market directly, bike-store.ts) — with ?status= and ?session_id=
 * carried along.
 */
function ToBikeShop() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  // The shop is no longer a tab: its starter packs sit on top of the market (owner 2026-10-15).
  params.delete('tab');
  const query = params.toString();
  return <Navigate to={query ? `/market?${query}` : '/market'} replace />;
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
          <Route path="terms" element={<TermsOfSale />} />
          <Route path="refunds" element={<RefundPolicy />} />
          <Route path="refund" element={<Navigate to="/refunds" replace />} />
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
