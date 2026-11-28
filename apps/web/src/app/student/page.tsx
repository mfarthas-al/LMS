import { AccountPanel } from '@/components/auth/AccountPanel';
import { WelcomeHeader } from '@/components/WelcomeHeader';

export default function Page() {
  return (
    <>
      <WelcomeHeader subtitle="Your courses and lessons will appear here." />
      <AccountPanel />
    </>
  );
}
