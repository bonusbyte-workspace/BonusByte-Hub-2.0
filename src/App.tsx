import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TonConnectUIProvider, TonConnectButton } from '@tonconnect/ui-react';
import SplashScreen  from '@/components/SplashScreen/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import Home          from '@/pages/Home';
import StakingPage   from '@/pages/Staking';
import AdminPage     from '@/pages/admin/AdminPage';
import Leaderboard   from '@/components/Leaderboard/Leaderboard';
import Navigation    from '@/components/Navigation/Navigation';
import { initTelegram } from '@/lib/telegram';

const ADMIN_ROUTE  = import.meta.env.VITE_ADMIN_ROUTE || '/bb-nexus-7k';
const TON_MANIFEST = `${window.location.origin}/tonconnect-manifest.json`;

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    initTelegram();
  }, []);

  return (
    <ErrorBoundary>
      <TonConnectUIProvider manifestUrl={TON_MANIFEST}>
        <div className="app-container">
          {!splashDone ? (
            <SplashScreen onComplete={() => setSplashDone(true)} />
          ) : (
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
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

                  <Route
                    path="/wallet"
                    element={
                      <div className="flex flex-col h-full"
                        style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, #0D1A2E 0%, #000000 100%)' }}>
                        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
                          <img src="/logo.png" alt="BonusByte" style={{ width: 64, height: 64, objectFit: 'contain', opacity: 0.85 }} />
                          <div className="text-center">
                            <h2 className="text-xl font-black mb-1"
                              style={{
                                background: 'linear-gradient(135deg,#8C8C8C 0%,#E8E8E8 50%,#9A9A9A 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}>
                              TON Wallet
                            </h2>
                            <p style={{ color: '#5A6A79', fontSize: 14 }}>
                              Connect to link your staking rewards
                            </p>
                          </div>
                          <div style={{ transform: 'scale(1.15)', marginTop: 8 }}>
                            <TonConnectButton />
                          </div>
                          <div style={{
                            width: '100%', borderRadius: 12, padding: '16px',
                            background: 'linear-gradient(145deg,#1A1A1D,#111113)',
                            border: '1px solid rgba(192,192,192,0.1)',
                          }}>
                            <p style={{ color: '#5A6A79', fontSize: 11, textAlign: 'center', lineHeight: 1.6 }}>
                              Connecting your TON wallet enables staking rewards and future airdrops.
                            </p>
                          </div>
                        </div>
                        <Navigation />
                      </div>
                    }
                  />

                  <Route path={ADMIN_ROUTE} element={<AdminPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          )}
        </div>
      </TonConnectUIProvider>
    </ErrorBoundary>
  );
}
