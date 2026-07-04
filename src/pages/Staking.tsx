import { useState } from 'react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import PageLayout from '@/components/PageLayout';
import StakingPageComponent from '@/components/Staking/StakingPage';

export default function StakingRoute() {
  const { userProfile, isLoading } = useTelegramUser();
  const [balance, setBalance] = useState<number | null>(null);
  return (
    <PageLayout title="Pre-Launch Staking" subtitle="Lock coins before TGE to earn yields" showWallet>
      {isLoading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200}}>
          <div style={{width:28,height:28,border:'2px solid #9A9A9A',borderTopColor:'transparent',
            borderRadius:'50%',animation:'bb-spin 0.8s linear infinite'}}/>
          <style>{'@keyframes bb-spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      ) : (
        <StakingPageComponent
          telegramId={userProfile?.telegramId ?? ''}
          balance={balance ?? userProfile?.balance ?? 0}
          onStaked={setBalance}
        />
      )}
    </PageLayout>
  );
}
