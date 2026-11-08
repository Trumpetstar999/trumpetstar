import { beforeEach, describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));
import { loadAdminDashboard } from './adminDashboard';
describe('admin dashboard correctness', () => {
  beforeEach(() => rpc.mockReset());
  it('keeps the complete 355-profile membership total, including free profiles without a membership', async () => {
    rpc.mockResolvedValue({ data: { stats: { total_users: 355 }, plans: [{plan:'FREE',count:286},{plan:'BASIC',count:13},{plan:'PRO',count:56}] }, error: null });
    const d = await loadAdminDashboard(14);
    expect(d.plans.reduce((sum,p) => sum+p.count,0)).toBe(355);
    expect(rpc).toHaveBeenCalledWith('admin_dashboard_snapshot',{p_days:14});
  });
  it('rejects incomplete plan totals instead of showing misleading counts', async () => {
    rpc.mockResolvedValue({data:{stats:{total_users:355},plans:[{plan:'FREE',count:231},{plan:'BASIC',count:13},{plan:'PRO',count:55}]},error:null});
    await expect(loadAdminDashboard(14)).rejects.toThrow('Inconsistent');
  });
  it('does not turn permission or network errors into zero metrics', async () => {
    rpc.mockResolvedValue({data:null,error:new Error('permission denied')});
    await expect(loadAdminDashboard(7)).rejects.toThrow('permission denied');
  });
});