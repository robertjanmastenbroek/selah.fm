import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Selah.fm',
  description: 'Privacy Policy for Selah.fm — CPM marketplace for music promotion.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <Link href="/" className="text-muted-foreground text-sm hover:text-foreground mb-8 inline-block">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="text-muted-foreground text-sm space-y-6">
          <p><strong className="text-foreground">Last updated:</strong> May 2026</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">1. What we collect</h2>
          <p>We collect your email address, display name, Google account information (when using Google sign-in), and social media handles you connect. We use Stripe for payments and do not store full payment card details.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">2. How we use your data</h2>
          <p>We use your data to operate the Selah.fm marketplace — showing your campaigns and submissions, processing payouts, and communicating about your account. We do not sell your personal data.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">3. Third-party services</h2>
          <p>We use Stripe for payments, Google for authentication, and Railway for hosting. Each has their own privacy policies. We may access TikTok, Instagram, or YouTube APIs when you connect accounts for view verification.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">4. Cookies</h2>
          <p>We use essential cookies for authentication and security. We do not use tracking cookies or analytics cookies.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">5. Data retention</h2>
          <p>We retain your data as long as your account is active. You can request deletion by contacting contact@selah.fm.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">6. Your rights</h2>
          <p>You have the right to access, correct, and delete your personal data. Contact us to exercise these rights.</p>

          <h2 className="text-foreground font-semibold text-lg mt-8">7. Contact</h2>
          <p>Privacy questions: contact@selah.fm</p>
        </div>
      </div>
    </main>
  );
}
