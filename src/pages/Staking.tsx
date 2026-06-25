import { useState } from 'react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import StakingPageComponent from '@/components/Staking/StakingPage';
import Navigation from '@/components/Navigation/Navigation';

export default function StakingPage() {
  const { userProfile, isLoading } = useTelegramUser();
  const [balance, setBalance] = useState(userProfile?.balance ?? 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-chrome-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, #0D1A2E 0%, #000000 100%)' }}
    >
      <StakingPageComponent
        telegramId={userProfile?.telegramId ?? ''}
        balance={balance}
        onStaked={setBalance}
      />
      <Navigation />
    </div>
  );
}
