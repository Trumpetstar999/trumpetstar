import { DashboardStats } from './DashboardStats';
import { TopUsersTable } from './TopUsersTable';
import { RecentActivityList } from './RecentActivityList';
import { ActivityCharts } from './ActivityCharts';

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

      {/* Top Users Tables */}
      <TopUsersTable />

      {/* Recent Activity */}
      <RecentActivityList />
    </div>
  );
}
