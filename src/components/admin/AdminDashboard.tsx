import { DashboardStats } from './DashboardStats';
import { TopUsersTable } from './TopUsersTable';
import { RecentActivityList } from './RecentActivityList';
import { ActivityCharts } from './ActivityCharts';
import { VimeoErrorsList } from './VimeoErrorsList';
import { PlanStatsCards } from './PlanStatsCards';

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Übersicht über Nutzeraktivitäten</p>
      </div>

      {/* Plan Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Nutzer nach Plan</h2>
        <PlanStatsCards />
      </div>

      {/* KPI Cards */}
      <DashboardStats />

      {/* Charts */}
      <ActivityCharts />

      {/* Vimeo Errors - Admin visibility */}
      <VimeoErrorsList />

      {/* Top Users Tables */}
      <TopUsersTable />

      {/* Recent Activity */}
      <RecentActivityList />
    </div>
  );
}
