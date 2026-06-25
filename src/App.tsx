import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import SplashScreen from '@/components/SplashScreen/SplashScreen';
import Home          from '@/pages/Home';
import StakingPage   from '@/pages/Staking';
import AdminPage     from '@/pages/admin/AdminPage';
import Leaderboard   from '@/components/Leaderboard/Leaderboard';
import Navigation    from '@/components/Navigation/Navigation';
import { initTelegram } from '@/lib/telegram';

// The admin route comes from env — obfuscated from public UI but encoded in bundle
const ADMIN_ROUTE = import.meta.env.VITE_ADMIN_ROUTE || '/bb-nexus-7k';

// TonConnect manifest must be publicly accessible
const TON_MANIFEST = `${window.location.origin}/tonconnect-manifest.json`;

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Initialize Telegram WebApp on first mount
    initTelegram();
  }, []);

  return (
    <TonConnectUIProvider manifestUrl={TON_MANIFEST}>
      <div className="app-container">
        {!splashDone ? (
          <SplashScreen onComplete={() => setSplashDone(true)} />
        ) : (
          <BrowserRouter>
            <Routes>
              {/* ── Public routes ── */}
              <Route path="/" element={<Home />} />

              <Route
                path="/leaderboard"
                element={
                  <div className="flex flex-col h-full"
                    style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, #0D1A2E 0%, #000000 100%)' }}>
                    <Leaderboard />
                    <Navigation />
                  </div>
                }
              />

              <Route path="/staking" element={<StakingPage />} />

              {/* Wallet tab — TON connect UI opens inline */}
              <Route
                path="/wallet"
                element={
                  <div className="flex flex-col h-full items-center justify-center gap-4"
                    style={{ background: '#000' }}>
                    <p className="chrome-text text-xl font-black">TON Wallet</p>
                    <p className="text-steel-400 text-sm">Connect your wallet to link your staking rewards</p>
                    <TonConnectUIProvider manifestUrl={TON_MANIFEST}>
                      <div style={{ transform: 'scale(1.2)' }}>
                        {/* TON button rendered inline */}
                      </div>
                    </TonConnectUIProvider>
                    <Navigation />
                  </div>
                }
              />

              {/* ── Hidden admin gateway — zero public links ── */}
              <Route path={ADMIN_ROUTE} element={<AdminPage />} />

              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        )}
      </div>
    </TonConnectUIProvider>
  );
}
