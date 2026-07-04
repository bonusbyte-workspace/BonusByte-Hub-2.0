import { ReactNode } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import Navigation from '@/components/Navigation/Navigation';

interface PageLayoutProps {
  children:    ReactNode;
  title?:      string;
  subtitle?:   string;
  showWallet?: boolean;
}

export default function PageLayout({ children, title, subtitle, showWallet = false }: PageLayoutProps) {
  const { userProfile } = useTelegramUser();
  return (
    <div style={{position:'relative',display:'flex',flexDirection:'column',height:'100%',
      background:'radial-gradient(ellipse 80% 50% at 50% 0%,#0D1A2E 0%,#000 100%)'}}>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        paddingTop:'max(48px,calc(env(safe-area-inset-top,0px) + 48px))',
        paddingLeft:20,paddingRight:20,paddingBottom:8,flexShrink:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <img src="/logo.png" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
          <div>
            <p style={{color:'#D0D0D0',fontSize:12,fontWeight:700,lineHeight:1,margin:0}}>
              {userProfile?.firstName ?? 'Player'}
            </p>
            <p style={{color:'#5A6A79',fontSize:10,margin:0}}>Lv {userProfile?.tapLevel ?? 1}</p>
          </div>
        </div>
        {showWallet && <TonConnectButton/>}
      </div>

      {(title || subtitle) && (
        <div style={{padding:'0 20px 12px',flexShrink:0}}>
          {title && <h2 style={{fontSize:20,fontWeight:900,margin:'0 0 2px',
            background:'linear-gradient(135deg,#8C8C8C,#E8E8E8,#9A9A9A)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{title}</h2>}
          {subtitle && <p style={{color:'#5A6A79',fontSize:12,margin:0}}>{subtitle}</p>}
        </div>
      )}

      <div style={{flex:1,overflowY:'auto',overflowX:'hidden',paddingBottom:80,
        WebkitOverflowScrolling:'touch'}}>
        {children}
      </div>

      <Navigation/>
    </div>
  );
}
