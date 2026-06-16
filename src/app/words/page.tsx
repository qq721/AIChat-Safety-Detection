'use client';

import { useState, useEffect, useCallback } from 'react';
import SidebarNav from '@/components/sidebar-nav';

interface SensitiveWord {
  id: string;
  word: string;
  category: string;
  level: 1 | 2 | 3 | 4;
  score: number;
  enabled: boolean;
  createdAt: string;
}

const LEVEL_LABELS: Record<number, string> = {
  1: '严重',
  2: '高危',
  3: '中危',
  4: '低危',
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'text-red-500 bg-red-500/10 border-red-500/20',
  2: 'text-red-400 bg-red-400/10 border-red-400/20',
  3: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  4: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

const CATEGORIES = ['恐怖主义', '政治敏感', '色情暴力', '违法信息', '危害生命', '歧视言论', '宗教敏感', '隐私侵犯', '垃圾信息', '不良信息'];

export default function WordsPage() {
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<number | ''>('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // 新增表单
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newLevel, setNewLevel] = useState<1 | 2 | 3 | 4>(4);
  const [newScore, setNewScore] = useState(30);

  const fetchWords = useCallback(async () => {
    try {
      const res = await fetch('/api/sensitive-words');
      const data = await res.json();
      setWords(data.words || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const addWord = async () => {
    if (!newWord.trim()) return;
    await fetch('/api/sensitive-words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: newWord.trim(),
        category: newCategory,
        level: newLevel,
        score: newScore,
      }),
    });
    setShowAdd(false);
    setNewWord('');
    setNewCategory(CATEGORIES[0]);
    setNewLevel(4);
    setNewScore(30);
    fetchWords();
  };

  const toggleWord = async (id: string) => {
    await fetch('/api/sensitive-words', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle' }),
    });
    fetchWords();
  };

  const deleteWord = async (id: string) => {
    await fetch(`/api/sensitive-words?id=${id}`, { method: 'DELETE' });
    fetchWords();
  };

  // 过滤
  let filtered = words;
  if (filterLevel !== '') {
    filtered = filtered.filter((w) => w.level === filterLevel);
  }
  if (filterCategory) {
    filtered = filtered.filter((w) => w.category === filterCategory);
  }

  // 统计
  const categoryStats = words.reduce<Record<string, number>>((acc, w) => {
    acc[w.category] = (acc[w.category] || 0) + 1;
    return acc;
  }, {});

  const levelStats = words.reduce<Record<number, number>>((acc, w) => {
    acc[w.level] = (acc[w.level] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="ml-56 flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">加载敏感词库...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="ml-56 flex-1 flex flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-6">
          <h2 className="text-sm font-semibold text-foreground">敏感词库管理</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">共 {words.length} 词</span>
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              + 添加敏感词
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* 统计概览 */}
          <div className="grid grid-cols-6 gap-3 p-6 border-b border-border">
            {Object.entries(levelStats).map(([level, count]) => (
              <div key={level} className="rounded-lg border border-border bg-card p-3 text-center">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${LEVEL_COLORS[Number(level)]}`}>
                  {LEVEL_LABELS[Number(level)]}
                </span>
                <p className="text-lg font-bold font-mono text-foreground mt-1">{count}</p>
              </div>
            ))}
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-secondary text-muted-foreground">
                分类数
              </span>
              <p className="text-lg font-bold font-mono text-foreground mt-1">{Object.keys(categoryStats).length}</p>
            </div>
          </div>

          {/* 过滤器 */}
          <div className="flex items-center gap-3 border-b border-border bg-card/30 px-6 py-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">等级:</span>
              {(['', 1, 2, 3, 4] as const).map((level) => (
                <button
                  key={String(level)}
                  onClick={() => setFilterLevel(level)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    filterLevel === level
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {level ? LEVEL_LABELS[level] : '全部'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">分类:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">全部</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat} ({categoryStats[cat] || 0})</option>
                ))}
              </select>
            </div>
          </div>

          {/* 词库表格 */}
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card/80 backdrop-blur-sm z-10">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-12">状态</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">敏感词</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-24">分类</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-20">等级</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-20">分值</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} className={`border-b border-border/50 transition-colors ${!w.enabled ? 'opacity-40' : 'hover:bg-accent/30'}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleWord(w.id)} className="cursor-pointer">
                        <span className={`inline-block h-4 w-4 rounded-full border-2 transition-colors ${
                          w.enabled ? 'bg-emerald-500 border-emerald-500' : 'border-border'
                        }`}>
                          {w.enabled && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 p-0.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground font-medium">{w.word}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{w.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${LEVEL_COLORS[w.level]}`}>
                        L{w.level} {LEVEL_LABELS[w.level]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-foreground">{w.score}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleWord(w.id)}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {w.enabled ? '禁用' : '启用'}
                        </button>
                        <button
                          onClick={() => deleteWord(w.id)}
                          className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 添加弹窗 */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">添加敏感词</h3>
              <div>
                <label className="text-xs text-muted-foreground">敏感词</label>
                <input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="输入敏感词"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">分类</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">等级</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={1}>1 - 严重</option>
                    <option value={2}>2 - 高危</option>
                    <option value={3}>3 - 中危</option>
                    <option value={4}>4 - 低危</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">基础分值 (1-100)</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="range"
                    value={newScore}
                    onChange={(e) => setNewScore(parseInt(e.target.value, 10))}
                    className="flex-1 accent-primary"
                    min={1}
                    max={100}
                  />
                  <span className="text-sm font-mono text-foreground w-8">{newScore}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="rounded-md border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-accent"
                >
                  取消
                </button>
                <button
                  onClick={addWord}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
