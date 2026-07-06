import PageLayout from '@/components/PageLayout';
import StakingPageComponent from '@/components/Staking/StakingPage';

export default function StakingRoute() {
  return (
    <PageLayout title="Pre-Launch Staking" subtitle="Stake TON to earn guaranteed yields at TGE" showWallet>
      <StakingPageComponent/>
    </PageLayout>
  );
}
