import Header from '@/components/TopNav';
import BugReportForm from '@/components/BugReportForm';
import { motion } from 'framer-motion';

export default function ReportBugPage() {
  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="page-container max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold tracking-tight mb-1">Report a bug</h1>
          <p className="text-muted-foreground text-sm">
            Found something broken? Let us know and we&apos;ll fix it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6"
        >
          <BugReportForm />
        </motion.div>
      </main>
    </div>
  );
}
