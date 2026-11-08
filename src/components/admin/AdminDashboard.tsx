import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCw, Users, UserCheck, Star, TrendingUp, Globe, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { adminDashboardCopy } from '@/i18n/admin-dashboard';
import { loadAdminDashboard, type DashboardPerson } from '@/lib/adminDashboard';
import { VimeoErrorsList } from './VimeoErrorsList';
import { landingViewMeasurement } from '@/lib/landingViewMeasurement';

const colors = ['var(--admin-text-muted)', 'var(--admin-warning)', 'var(--admin-accent)'];
export function AdminDashboard() {
  const [days, setDays] = useState(14);
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = adminDashboardCopy[language];
  const query = useQuery({ queryKey: ['admin-dashboard', user?.id, days], queryFn: () => loadAdminDashboard(days), enabled: !!user, staleTime: 60000 });
  const d = query.data;
  const number = (n: number) => n.toLocaleString(language);
  const time = (date: string) => new Intl.DateTimeFormat(language, { timeZone: 'Europe/Vienna', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  const chartData = d?.days.map(day => ({ ...day, label: day.date.slice(8) + '.' + day.date.slice(5,7) })) ?? [];
  const tooltip = { background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--admin-text-primary)' };
  const axis = { fontSize: 11, fill: 'var(--admin-text-secondary)' };
  function ranking(title: string, people: DashboardPerson[]) {
    return <section className="admin-card p-5 min-w-0"><h2 className="font-semibold mb-4">{title}</h2>{people.length === 0 ? <p className="text-muted-foreground text-sm">{t.empty}</p> : <ol className="space-y-3">{people.map((person, i) => <li key={person.id} className="flex items-center gap-3 text-sm"><span className="text-muted-foreground w-5 tabular-nums">{i+1}</span><span className="min-w-0 flex-1 truncate">{person.display_name || t.unknown}</span><span className="font-semibold tabular-nums">{number(person.count)}</span></li>)}</ol>}</section>;
  }
  return <div className="space-y-6 min-w-0 admin-dashboard">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1" role="group" aria-label={t.days}>{[7,14,30,90].map(n => <Button key={n} size="sm" variant={days === n ? 'default' : 'outline'} onClick={() => setDays(n)} aria-pressed={days === n}>{n} {t.days}</Button>)}</div>
      <Button variant="outline" size="sm" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={`w-4 h-4 mr-2 ${query.isFetching ? 'animate-spin' : ''}`} />{t.refresh}</Button>
    </div>
    {query.isError && <div role="alert" className="admin-card p-4 flex items-center gap-2 text-destructive"><AlertCircle className="w-5 h-5 shrink-0" />{t.error}</div>}
    {!d && query.isLoading && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label={t.loading}>{[0,1,2,3].map(n => <div key={n} className="admin-card h-28 animate-pulse bg-muted" />)}</div>}
    {d && <>
      <p className="text-xs text-muted-foreground">{t.updated}: {time(d.generated_at)} · {t.timezone}</p>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{[
        [t.users,d.stats.total_users,Users,'accent'],[t.today,d.stats.active_today,UserCheck,'success'],[t.week,d.stats.active_this_week,TrendingUp,'accent'],[t.stars,d.stats.total_stars,Star,'warning'],
      ].map(([label,value,Icon,tone]) => { const Symbol = Icon as typeof Users; return <section key={String(label)} className={`admin-card p-4 lg:p-5 admin-kpi admin-tone-${tone}`}><Symbol className="w-5 h-5 mb-3 admin-tone-icon" /><p className="text-3xl font-semibold tabular-nums" data-metric={String(label)}>{number(Number(value))}</p><h2 className="text-sm text-muted-foreground mt-1">{String(label)}</h2></section>; })}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[[t.newToday,d.stats.new_today],[t.newWeek,d.stats.new_this_week],[t.newMonth,d.stats.new_this_month]].map(([label,value]) => <section key={label} className="admin-card px-5 py-4 flex items-center justify-between gap-2"><h2 className="text-sm text-muted-foreground">{label}</h2><span className="text-xl font-semibold tabular-nums">{number(Number(value))}</span></section>)}</div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="admin-card p-5 xl:col-span-2 min-w-0"><h2 className="font-semibold">{t.activity}</h2><div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2 mb-4"><span className="admin-legend-accent">{t.logins}</span><span className="admin-legend-success">{t.registrations}</span></div><div className="h-64 w-full"><ResponsiveContainer><AreaChart data={chartData} margin={{left:-25,right:8}}><defs><linearGradient id="adminLoginFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--admin-accent)" stopOpacity={0.24}/><stop offset="100%" stopColor="var(--admin-accent)" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--admin-border)" strokeDasharray="3 3"/><XAxis dataKey="label" tick={axis} minTickGap={25} axisLine={false} tickLine={false}/><YAxis tick={axis} allowDecimals={false} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltip}/><Area type="monotone" dataKey="logins" name={t.logins} stroke="var(--admin-accent)" fill="url(#adminLoginFill)" strokeWidth={2.5} isAnimationActive={false}/><Area type="monotone" dataKey="registrations" name={t.registrations} stroke="var(--admin-success)" fill="transparent" strokeWidth={2} isAnimationActive={false}/></AreaChart></ResponsiveContainer></div></section>
        <section className="admin-card p-5 min-w-0"><h2 className="font-semibold">{t.plans}</h2><div className="h-48"><ResponsiveContainer><PieChart><Pie data={d.plans} dataKey="count" nameKey="plan" innerRadius={52} outerRadius={76} paddingAngle={3} stroke="var(--admin-surface)" isAnimationActive={false}>{d.plans.map((p,i) => <Cell key={p.plan} fill={colors[i]}/>)}</Pie><Tooltip contentStyle={tooltip}/></PieChart></ResponsiveContainer></div><ul className="space-y-3">{d.plans.map((p,i) => <li key={p.plan} className="flex items-center justify-between text-sm"><span className={`admin-plan-${i}`}>{p.plan}</span><span className="tabular-nums font-semibold">{number(p.count)} <span className="text-muted-foreground font-normal ml-2">{d.stats.total_users ? Math.round(p.count/d.stats.total_users*100) : 0}%</span></span></li>)}</ul></section>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{[{key:'stars',title:t.rewards,color:'var(--admin-warning)'},{key:'views',title:t.views,color:'var(--admin-success)'}].map(c => <section key={c.key} className="admin-card p-5 min-w-0"><h2 className="font-semibold mb-4">{c.title}</h2>{c.key === 'views' && <p className="text-sm text-muted-foreground mb-4">{t.viewsDisabled}</p>}<div className="h-52"><ResponsiveContainer><BarChart data={chartData} margin={{left:-25,right:8}}><CartesianGrid vertical={false} stroke="var(--admin-border)" strokeDasharray="3 3"/><XAxis dataKey="label" tick={axis} minTickGap={25} axisLine={false} tickLine={false}/><YAxis tick={axis} allowDecimals={false} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltip}/><Bar dataKey={c.key} name={c.title} fill={c.color} radius={[4,4,0,0]} maxBarSize={24} isAnimationActive={false}/></BarChart></ResponsiveContainer></div></section>)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[t.viewsToday,t.viewsWeek,t.viewsMonth].map(label => <section className="admin-card p-4 flex items-center gap-3" key={label}><Globe className="w-5 h-5 text-muted-foreground shrink-0"/><div><h2 className="text-sm text-muted-foreground">{label}</h2><p className="text-xl font-semibold" data-measurement={landingViewMeasurement.status}>—</p><p className="text-xs text-muted-foreground">{t.viewsUnavailable}</p></div></section>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{ranking(t.topLogins,d.top_logins)}{ranking(t.topStars,d.top_stars)}</div>
      <section className="admin-card p-5"><h2 className="font-semibold mb-4">{t.recent}</h2><div className="max-h-80 overflow-y-auto divide-y divide-border">{d.recent.map(a => <div className="flex gap-3 justify-between py-3 text-sm" key={a.id}><div className="min-w-0"><p className="truncate font-medium">{a.display_name || t.unknown}</p><p className="text-xs text-muted-foreground">{t[a.action as keyof typeof t] || a.action}</p></div><time className="text-xs text-muted-foreground shrink-0">{time(a.created_at)}</time></div>)}</div></section>
    </>}
    <div className="min-w-0 overflow-x-auto"><VimeoErrorsList /></div>
  </div>;
}
