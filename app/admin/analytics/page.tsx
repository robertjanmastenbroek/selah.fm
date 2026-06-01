import AnalyticsDashboard from './AnalyticsClient';

export const metadata = {
  title: 'Analytics Dashboard — Selah.fm Admin',
  description: 'Real-time page view tracking and traffic attribution',
};

export default function AdminAnalyticsPage() {
  return <AnalyticsDashboard />;
}
