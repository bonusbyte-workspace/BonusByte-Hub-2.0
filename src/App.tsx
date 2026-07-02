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
const TON_MANIFEST = window.location.origin + '/tonconnect-manifest.json';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => { initTelegram(); }, []);

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
                  <Route path="/leaderboard" element={
                    <div className="flex flex-col h-full"
                      style={{background:'radial-gradient(ellipse 80% 40% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>
                      <Leaderboard /><Navigation />
                    </div>
                  }/>
                  <Route path="/staking" element={<StakingPage />} />
                  <Route path="/wallet" element={
                    <div className="flex flex-col h-full" style={{background:'#000'}}>
                      <div style={{flex:1,display:'flex',flexDirection:'column',
                        alignItems:'center',justifyContent:'center',gap:20,padding:'0 24px'}}>
                        <img src="/logo.png" alt="" style={{width:56,opacity:0.8}} />
                        <div style={{textAlign:'center'}}>
                          <h2 style={{fontSize:20,fontWeight:900,color:'#E8E8E8',marginBottom:6}}>
                            TON Wallet
                          </h2>
                          <p style={{fontSize:13,color:'#5A6A79'}}>
                            Connect to link your staking rewards
                          </p>
                        </div>
                        <TonConnectButton />
                      </div>
                      <Navigation />
                    </div>
                  }/>
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
