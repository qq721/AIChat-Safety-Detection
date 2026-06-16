'use client';

import { useState, useEffect, useCallback } from 'react';
import SidebarNav from '@/components/sidebar-nav';

type ActionType = 'pass' | 'warn' | 'block' | 'review';

interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  actions: {
    low: ActionType;
    medium: ActionType;
    high: ActionType;
    critical: ActionType;
  };
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const ACTION_OPTIONS: Array<{ value: ActionType; label: string }> = [
  { value: 'pass', label: '放行' },
  { value: 'warn', label: '警告' },
  { value: 'block', label: '拦截' },
  { value: 'review', label: '人工审核' },
];

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StrategyConfig | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // 新建表单
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newThresholds, setNewThresholds] = useState({ low: 20, medium: 45, high: 70, critical: 90 });
  const [newActions, setNewActions] = useState<Record<string, ActionType>>({
    low: 'pass',
    medium: 'warn',
    high: 'block',
    critical: 'block',
  });

  const fetchStrategies = useCallback(async () => {
    try {
      const res = await fetch('/api/strategy');
      const data = await res.json();
      setStrategies(data.strategies || []);
      setActiveId(data.activeStrategyId || '');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const activateStrategy = async (id: string) => {
    await fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activate', id }),
    });
    setActiveId(id);
  };

  const deleteStrategy = async (id: string) => {
    await fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    fetchStrategies();
  };

  const saveAdd = async () => {
    if (!newName.trim()) return;
    await fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        name: newName,
        description: newDesc,
        thresholds: newThresholds,
        actions: newActions,
      }),
    });
    setShowAdd(false);
    setNewName('');
    setNewDesc('');
    setNewThresholds({ low: 20, medium: 45, high: 70, critical: 90 });
    setNewActions({ low: 'pass', medium: 'warn', high: 'block', critical: 'block' });
    fetchStrategies();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        id: editing.id,
        name: editing.name,
        description: editing.description,
        thresholds: editing.thresholds,
        actions: editing.actions,
      }),
    });
    setEditing(null);
    fetchStrategies();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="ml-56 flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">加载策略配置...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="ml-56 flex-1 flex flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-6">
          <h2 className="text-sm font-semibold text-foreground">策略配置</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + 新建策略
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 策略列表 */}
          {strategies.map((strategy) => {
            const isActive = strategy.id === activeId;
            const isEditing = editing?.id === strategy.id;
            const s = isEditing ? editing : strategy;

            return (
              <div
                key={strategy.id}
                className={`rounded-lg border bg-card p-5 transition-colors ${
                  isActive ? 'border-primary/40' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                      {isActive && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          当前激活
                        </span>
                      )}
                      {s.isDefault && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                          默认
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => activateStrategy(strategy.id)}
                        className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        激活
                      </button>
                    )}
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditing({ ...strategy })}
                          className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          编辑
                        </button>
                        {!strategy.isDefault && (
                          <button
                            onClick={() => deleteStrategy(strategy.id)}
                            className="rounded-md border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            删除
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 阈值配置 */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {(['critical', 'high', 'medium', 'low'] as const).map((level) => {
                    const labels: Record<string, string> = {
                      critical: '严重',
                      high: '高危',
                      medium: '中危',
                      low: '低危',
                    };
                    const colors: Record<string, string> = {
                      critical: 'text-red-500',
                      high: 'text-red-400',
                      medium: 'text-amber-400',
                      low: 'text-cyan-400',
                    };
                    return (
                      <div key={level} className="rounded-md border border-border bg-secondary/30 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium ${colors[level]}`}>{labels[level]}</span>
                          <span className="text-[10px] text-muted-foreground">阈值</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={s.thresholds[level]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                setEditing({
                                  ...editing,
                                  thresholds: { ...editing.thresholds, [level]: val },
                                });
                              }
                            }}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            min={0}
                            max={100}
                          />
                        ) : (
                          <p className="text-lg font-bold font-mono text-foreground">{s.thresholds[level]}</p>
                        )}
                        <div className="mt-2">
                          <span className="text-[10px] text-muted-foreground">处置动作</span>
                          {isEditing ? (
                            <select
                              value={s.actions[level]}
                              onChange={(e) => {
                                setEditing({
                                  ...editing,
                                  actions: {
                                    ...editing.actions,
                                    [level]: e.target.value as ActionType,
                                  },
                                });
                              }}
                              className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {ACTION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-xs text-foreground mt-0.5">
                              {ACTION_OPTIONS.find((o) => o.value === s.actions[level])?.label || s.actions[level]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 阈值可视化 */}
                <div className="relative h-8 rounded-full bg-secondary overflow-hidden">
                  {s.thresholds.low > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 bg-cyan-500/20"
                      style={{ width: `${s.thresholds.low}%` }}
                    />
                  )}
                  {s.thresholds.medium > 0 && (
                    <div
                      className="absolute inset-y-0 bg-amber-500/20"
                      style={{ left: `${s.thresholds.low}%`, width: `${s.thresholds.medium - s.thresholds.low}%` }}
                    />
                  )}
                  {s.thresholds.high > 0 && (
                    <div
                      className="absolute inset-y-0 bg-red-500/20"
                      style={{ left: `${s.thresholds.medium}%`, width: `${s.thresholds.high - s.thresholds.medium}%` }}
                    />
                  )}
                  {s.thresholds.critical > 0 && (
                    <div
                      className="absolute inset-y-0 bg-red-600/30"
                      style={{ left: `${s.thresholds.high}%`, width: `${100 - s.thresholds.high}%` }}
                    />
                  )}
                  {/* 阈值标记 */}
                  {[s.thresholds.low, s.thresholds.medium, s.thresholds.high, s.thresholds.critical].map(
                    (val, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-foreground/30"
                        style={{ left: `${val}%` }}
                      >
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground">
                          {val}
                        </span>
                      </div>
                    )
                  )}
                </div>
                <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            );
          })}

          {/* 新建策略弹窗 */}
          {showAdd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">新建策略</h3>
                <div>
                  <label className="text-xs text-muted-foreground">策略名称</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="输入策略名称"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">描述</label>
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="策略描述"
                  />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
                    const labels: Record<string, string> = { low: '低危', medium: '中危', high: '高危', critical: '严重' };
                    return (
                      <div key={level} className="space-y-2">
                        <span className="text-xs text-muted-foreground">{labels[level]}阈值</span>
                        <input
                          type="number"
                          value={newThresholds[level]}
                          onChange={(e) =>
                            setNewThresholds({ ...newThresholds, [level]: parseInt(e.target.value, 10) || 0 })
                          }
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          min={0}
                          max={100}
                        />
                        <span className="text-[10px] text-muted-foreground">处置动作</span>
                        <select
                          value={newActions[level]}
                          onChange={(e) => setNewActions({ ...newActions, [level]: e.target.value as ActionType })}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {ACTION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="rounded-md border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-accent"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveAdd}
                    className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    创建
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
