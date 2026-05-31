import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
