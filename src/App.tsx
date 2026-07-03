import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import SplashScreen  from '@/components/SplashScreen/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import Home          from '@/pages/Home';
import StakingRoute  from '@/pages/Staking';
import AdminPage     from '@/pages/admin/AdminPage';
import WalletPage    from '@/pages/WalletPage';
import Leaderboard   from '@/components/Leaderboard/Leaderboard';
import Navigation    from '@/components/Navigation/Navigation';
import { initTelegram } from '@/lib/telegram';

const ADMIN_ROUTE  = import.meta.env.VITE_ADMIN_ROUTE || '/bb-nexus-7k';
const TON_MANIFEST = window.location.origin + '/tonconnect-manifest.json';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => { initTelegram(); }, []);

  return (
    <ErrorBoundary>
      <TonConnectUIProvider manifestUrl={TON_MANIFEST}>
        <div className="app-container">
          {!splashDone ? (
            <SplashScreen onComplete={() => setSplashDone(true)}/>
          ) : (
            <ErrorBoundary>
              <BrowserRouter>
                <Routes>
                  <Route path="/"            element={<Home/>}/>
                  <Route path="/leaderboard" element={
                    <div style={{display:'flex',flexDirection:'column',height:'100%',
                      background:'radial-gradient(ellipse 80% 40% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>
                      <Leaderboard/><Navigation/>
                    </div>
                  }/>
                  <Route path="/staking"     element={<StakingRoute/>}/>
                  <Route path="/wallet"      element={<WalletPage/>}/>
                  <Route path={ADMIN_ROUTE}  element={<AdminPage/>}/>
                  <Route path="*"            element={<Navigate to="/" replace/>}/>
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          )}
        </div>
      </TonConnectUIProvider>
    </ErrorBoundary>
  );
}
