'use client';

import { useState, useEffect, useCallback } from 'react';
import SidebarNav from '@/components/sidebar-nav';

interface Statistics {
  overview: {
    totalDetections: number;
    todayDetections: number;
    weekDetections: number;
    monthDetections: number;
    blockedCount: number;
    passRate: number;
    blockRate: number;
  };
  levelDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  actionDistribution: Record<string, number>;
  dailyStats: Array<{
    date: string;
    total: number;
    blocked: number;
    warned: number;
  }>;
  topWords: Array<{
    word: string;
    category: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/statistics');
      const data = await res.json();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const maxDaily = stats
    ? Math.max(...stats.dailyStats.map((d) => d.total), 1)
    : 1;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="ml-56 flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">加载统计数据中...</p>
        </main>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="ml-56 flex-1 flex flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-6">
          <h2 className="text-sm font-semibold text-foreground">统计仪表盘</h2>
          <button
            onClick={fetchStats}
            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            刷新数据
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 概览卡片 */}
          <div className="grid grid-cols-4 gap-4">
            <OverviewCard
              label="总检测量"
              value={stats.overview.totalDetections}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              }
            />
            <OverviewCard
              label="今日检测"
              value={stats.overview.todayDetections}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              }
            />
            <OverviewCard
              label="通过率"
              value={`${stats.overview.passRate}%`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
            />
            <OverviewCard
              label="拦截率"
              value={`${stats.overview.blockRate}%`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="15" x2="9" y1="9" y2="15" />
                  <line x1="9" x2="15" y1="9" y2="15" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* 近7天趋势 */}
            <div className="col-span-2 rounded-lg border border-border bg-card p-5">
              <h3 className="text-xs font-medium text-muted-foreground mb-4">近7天检测趋势</h3>
              <div className="flex items-end gap-3 h-48">
                {stats.dailyStats.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '160px' }}>
                      {/* 总量条 */}
                      <div className="flex-1 w-full flex flex-col justify-end">
                        <div
                          className="w-full rounded-t bg-primary/30 transition-all"
                          style={{ height: `${(day.total / maxDaily) * 100}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{day.date}</span>
                    <div className="flex gap-1 text-[9px]">
                      <span className="text-emerald-400">{day.total - day.blocked - day.warned}</span>
                      <span className="text-amber-400">{day.warned}</span>
                      <span className="text-red-400">{day.blocked}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/30" />总量</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400" />通过</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" />警告</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" />拦截</span>
              </div>
            </div>

            {/* 处置分布 */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-xs font-medium text-muted-foreground mb-4">处置分布</h3>
              <div className="space-y-3">
                {Object.entries(stats.actionDistribution).map(([action, count]) => {
                  const total = Object.values(stats.actionDistribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colors: Record<string, string> = {
                    pass: 'bg-emerald-500',
                    warn: 'bg-amber-500',
                    block: 'bg-red-500',
                    review: 'bg-cyan-500',
                  };
                  const labels: Record<string, string> = {
                    pass: '放行',
                    warn: '警告',
                    block: '拦截',
                    review: '审核',
                  };
                  return (
                    <div key={action}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground">{labels[action] || action}</span>
                        <span className="text-xs font-mono text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className={`h-2 rounded-full ${colors[action] || 'bg-primary'} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 风险等级分布 */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-xs font-medium text-muted-foreground mb-4">风险等级分布</h3>
              <div className="space-y-2">
                {(['critical', 'high', 'medium', 'low', 'safe'] as const).map((level) => {
                  const count = stats.levelDistribution[level] || 0;
                  const total = Object.values(stats.levelDistribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colors: Record<string, string> = {
                    critical: 'bg-red-600',
                    high: 'bg-red-500',
                    medium: 'bg-amber-500',
                    low: 'bg-cyan-500',
                    safe: 'bg-emerald-500',
                  };
                  const labels: Record<string, string> = {
                    critical: '严重',
                    high: '高风险',
                    medium: '中风险',
                    low: '低风险',
                    safe: '安全',
                  };
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-14">{labels[level]}</span>
                      <div className="flex-1 h-5 rounded bg-secondary overflow-hidden">
                        <div
                          className={`h-5 ${colors[level]} transition-all flex items-center px-2`}
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        >
                          {pct >= 10 && <span className="text-[10px] font-mono text-white font-medium">{pct}%</span>}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 分类分布 */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-xs font-medium text-muted-foreground mb-4">命中分类分布</h3>
              {Object.keys(stats.categoryDistribution).length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">暂无数据</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.categoryDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => {
                      const maxCat = Math.max(...Object.values(stats.categoryDistribution));
                      const pct = maxCat > 0 ? Math.round((count / maxCat) * 100) : 0;
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-xs text-foreground w-20 truncate">{cat}</span>
                          <div className="flex-1 h-3 rounded bg-secondary overflow-hidden">
                            <div
                              className="h-3 rounded bg-primary/60 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* 热词排行 */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-xs font-medium text-muted-foreground mb-4">敏感词命中排行 TOP 10</h3>
            {stats.topWords.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">暂无数据</p>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {stats.topWords.map((tw, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
                    <span className={`text-[10px] font-bold font-mono ${
                      i < 3 ? 'text-red-400' : 'text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{tw.word}</p>
                      <p className="text-[10px] text-muted-foreground">{tw.category}</p>
                    </div>
                    <span className="text-xs font-mono text-primary">{tw.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function OverviewCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
    </div>
  );
}
