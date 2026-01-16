import { DashboardStats } from './DashboardStats';
import { TopUsersTable } from './TopUsersTable';
import { RecentActivityList } from './RecentActivityList';
import { ActivityCharts } from './ActivityCharts';
import { VimeoErrorsList } from './VimeoErrorsList';
import { PlanStatsCards } from './PlanStatsCards';

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Plan Stats */}
      <section>
        <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-3">
          Nutzer nach Plan
        </h2>
        <PlanStatsCards />
      </section>

      {/* KPI Cards */}
      <section>
        <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-3">
          Übersicht
        </h2>
        <DashboardStats />
      </section>

      {/* Charts */}
      <section>
        <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-3">
          Aktivität
        </h2>
        <ActivityCharts />
      </section>

      {/* Vimeo Errors */}
      <VimeoErrorsList />

      {/* Top Users Tables */}
      <TopUsersTable />

      {/* Recent Activity */}
      <RecentActivityList />
    </div>
  );
}
