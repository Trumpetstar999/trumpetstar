import { supabase } from '@/integrations/supabase/client';

export interface DashboardDay { date: string; logins: number; active: number; stars: number; registrations: number; views: number }
export interface DashboardPerson { id: string; display_name: string | null; count: number; last_activity: string }
export interface DashboardSnapshot {
  generated_at: string; timezone: string;
  stats: Record<'total_users' | 'total_stars' | 'active_today' | 'active_this_week' | 'new_today' | 'new_this_week' | 'new_this_month' | 'views_today' | 'views_this_week' | 'views_this_month', number>;
  plans: { plan: string; count: number }[];
  days: DashboardDay[]; top_logins: DashboardPerson[]; top_stars: DashboardPerson[];
  recent: { id: string; display_name: string | null; action: string; created_at: string }[];
}
export async function loadAdminDashboard(days: number): Promise<DashboardSnapshot> {
  const { data, error } = await supabase.rpc('admin_dashboard_snapshot', { p_days: days });
  if (error) throw error;
  if (!data || typeof data !== 'object' || Array.isArray(data) || !('stats' in data)) throw new Error('Invalid dashboard response');
  const snapshot = data as unknown as DashboardSnapshot;
  if (snapshot.plans.reduce((sum, p) => sum + p.count, 0) !== snapshot.stats.total_users) throw new Error('Inconsistent membership totals');
  return snapshot;
}