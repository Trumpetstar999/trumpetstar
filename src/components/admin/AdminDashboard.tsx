import { motion } from 'framer-motion';
import { DashboardStats } from './DashboardStats';
import { TopUsersTable } from './TopUsersTable';
import { RecentActivityList } from './RecentActivityList';
import { ActivityCharts } from './ActivityCharts';
import { VimeoErrorsList } from './VimeoErrorsList';
import { PlanStatsCards } from './PlanStatsCards';
import { LandingPageViewsCard } from './LandingPageViewsCard';

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' as const, delay },
  },
});

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-widest mb-3 flex items-center gap-2">
    <span className="inline-block w-3 h-px bg-[#D1D5DB]" />
    {children}
    <span className="flex-1 h-px bg-[#F3F4F6]" />
  </h2>
);

export function AdminDashboard() {
  return (
    <div className="space-y-8">

      <motion.section variants={fadeUp(0)} initial="hidden" animate="show">
        <SectionLabel>Nutzer nach Plan</SectionLabel>
        <PlanStatsCards />
      </motion.section>

      <motion.section variants={fadeUp(0.12)} initial="hidden" animate="show">
        <SectionLabel>Übersicht</SectionLabel>
        <DashboardStats />
      </motion.section>

      <motion.section variants={fadeUp(0.20)} initial="hidden" animate="show">
        <SectionLabel>Landingpage-Aufrufe</SectionLabel>
        <LandingPageViewsCard />
      </motion.section>

      <motion.section variants={fadeUp(0.24)} initial="hidden" animate="show">
        <SectionLabel>Aktivität</SectionLabel>
        <ActivityCharts />
      </motion.section>

      <motion.section variants={fadeUp(0.36)} initial="hidden" animate="show">
        <VimeoErrorsList />
      </motion.section>

      <motion.section variants={fadeUp(0.44)} initial="hidden" animate="show">
        <TopUsersTable />
      </motion.section>

      <motion.section variants={fadeUp(0.52)} initial="hidden" animate="show">
        <RecentActivityList />
      </motion.section>

    </div>
  );
}
