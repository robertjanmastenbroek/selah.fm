'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  color: string;
  delay: number;
}

export default function StatCard({ label, value, icon: Icon, color, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 text-center cursor-default
                 hover:bg-white/[0.05] hover:border-white/[0.10] transition-colors duration-200"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay * 0.05 + 0.15, type: 'spring', stiffness: 500 }}
      >
        <Icon size={16} className={`mx-auto mb-2 ${color} group-hover:scale-110 transition-transform duration-200`} />
      </motion.div>
      <motion.div
        className="text-2xl font-bold tracking-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay * 0.05 + 0.25 }}
      >
        {value.toLocaleString()}
      </motion.div>
      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{label}</div>
    </motion.div>
  );
}
