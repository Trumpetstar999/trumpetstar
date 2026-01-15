import { DashboardStats } from './DashboardStats';
import { TopUsersTable } from './TopUsersTable';
import { RecentActivityList } from './RecentActivityList';
import { ActivityCharts } from './ActivityCharts';
import { VimeoErrorsList } from './VimeoErrorsList';

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Übersicht über Nutzeraktivitäten</p>
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
