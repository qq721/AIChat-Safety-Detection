'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SidebarNav from '@/components/sidebar-nav';

type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
type ActionType = 'pass' | 'warn' | 'block' | 'review';
type ViewMode = 'chat' | 'logs';

interface DetectionResult {
  isSafe: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
  action: ActionType;
  matchedWords: Array<{
    word: string;
    category: string;
    level: number;
    score: number;
    position?: number;
  }>;
  details: {
    baseScore: number;
    multiplier: number;
    contextAdjustment: number;
    finalScore: number;
    traditionalScore?: number;
    aiScore?: number;
    aiWeight?: number;
    aiConfidence?: number;
    aiReasoning?: string;
    scoreFormula?: string;
  };
  timestamp?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  detection?: DetectionResult;
  blocked?: boolean;
  timestamp: string;
}

interface DetectionLog {
  id: string;
  content: string;
  result: DetectionResult;
  timestamp: string;
  source: 'chat' | 'api';
}

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  low: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  high: 'text-red-400 border-red-500/30 bg-red-500/10',
  critical: 'text-red-500 border-red-600/50 bg-red-600/20',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  safe: '安全',
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重',
};

const ACTION_LABELS: Record<ActionType, string> = {
  pass: '放行',
  warn: '警告',
  block: '拦截',
  review: '审核',
};

function getActionColor(action: ActionType) {
  if (action === 'block') return 'text-red-400 bg-red-500/10 border-red-500/30';
  if (action === 'warn') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  if (action === 'review') return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = searchParams.get('tab');
  const viewMode: ViewMode = tab === 'logs' ? 'logs' : 'chat';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const [logs, setLogs] = useState<DetectionLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logKeyword, setLogKeyword] = useState('');
  const [logRiskLevel, setLogRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [logPage, setLogPage] = useState(1);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(logsTotal / pageSize));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchLogs = async () => {
    setLogsLoading(true);

    try {
      const params = new URLSearchParams();

      params.set('page', String(logPage));
      params.set('pageSize', String(pageSize));

      if (logRiskLevel !== 'all') {
        params.set('riskLevel', logRiskLevel);
      }

      if (logKeyword.trim()) {
        params.set('keyword', logKeyword.trim());
      }

      const res = await fetch(`/api/detection-logs?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`获取检测日志失败：${res.status}`);
      }

      const data = await res.json();

      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setLogsTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (error) {
      console.error(error);
      setLogs([]);
      setLogsTotal(0);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'logs') {
      fetchLogs();
    }
  }, [viewMode, logPage, logRiskLevel]);

  const setViewMode = (mode: ViewMode) => {
    if (mode === 'logs') {
      router.push('/?tab=logs');
    } else {
      router.push('/');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const content = input.trim();
    setInput('');
    setLoading(true);
    setScanning(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { ...data.userMessage, timestamp: new Date().toISOString() },
          { ...data.assistantMessage, timestamp: new Date().toISOString() },
        ]);
        setLastDetection(data.detection);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => setScanning(false), 800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
    } catch {
      // ignore
    }

    setMessages([]);
    setLastDetection(null);
  };

  const handleSearchLogs = () => {
    setLogPage(1);
    fetchLogs();
  };

  return (
    <div className="flex min-h-screen">
      <SidebarNav />

      <main className="ml-56 flex flex-1">
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('chat')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'chat'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                对话监测
              </button>

              <button
                onClick={() => setViewMode('logs')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'logs'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                检测日志
              </button>

              {viewMode === 'chat' && scanning && (
                <span className="flex items-center gap-1.5 text-xs text-primary animate-scan-pulse">
                  扫描中...
                </span>
              )}
            </div>

            {viewMode === 'chat' ? (
              <button
                onClick={clearChat}
                className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                清空对话
              </button>
            ) : (
              <button
                onClick={fetchLogs}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                刷新日志
              </button>
            )}
          </header>

          {viewMode === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground">Alchat 内容安全监测</h3>
                    <p className="mt-1 text-sm text-muted-foreground">输入消息进行实时内容安全检测</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        msg.role === 'user'
                          ? msg.blocked
                            ? 'border-2 border-red-500/50 bg-red-950/30 animate-risk-flash'
                            : 'bg-primary/10 border border-primary/20'
                          : 'bg-card border border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {msg.role === 'user' ? '用户' : '系统'}
                        </span>

                        {msg.detection && msg.role === 'user' && (
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border ${RISK_COLORS[msg.detection.riskLevel]}`}>
                            {RISK_LABELS[msg.detection.riskLevel]} · {msg.detection.riskScore}分
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-card border border-border px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border bg-card/50 p-4">
                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息，系统将自动进行内容安全检测..."
                    className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={1}
                  />

                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    发送
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                  value={logRiskLevel}
                  onChange={(e) => {
                    setLogRiskLevel(e.target.value as RiskLevel | 'all');
                    setLogPage(1);
                  }}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none"
                >
                  <option value="all">全部风险等级</option>
                  <option value="safe">安全</option>
                  <option value="low">低风险</option>
                  <option value="medium">中风险</option>
                  <option value="high">高风险</option>
                  <option value="critical">严重</option>
                </select>

                <input
                  value={logKeyword}
                  onChange={(e) => setLogKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchLogs();
                  }}
                  placeholder="搜索内容或敏感词..."
                  className="h-9 w-64 rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />

                <button
                  onClick={handleSearchLogs}
                  className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground"
                >
                  搜索
                </button>

                <div className="ml-auto text-xs text-muted-foreground">
                  共 <span className="font-mono text-foreground">{logsTotal}</span> 条记录
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card">
                <div className="grid grid-cols-[170px_1fr_100px_90px_90px_130px] border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
                  <div>时间</div>
                  <div>检测内容</div>
                  <div>风险等级</div>
                  <div>分数</div>
                  <div>处置</div>
                  <div>命中词</div>
                </div>

                {logsLoading ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    加载日志中...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    暂无检测日志
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="grid grid-cols-[170px_1fr_100px_90px_90px_130px] px-4 py-4 text-xs hover:bg-accent/30"
                      >
                        <div className="font-mono text-muted-foreground">
                          {formatTime(log.timestamp)}
                        </div>

                        <div className="pr-4">
                          <p className="line-clamp-2 text-sm text-foreground">
                            {log.content}
                          </p>

                          <p className="mt-1 text-[11px] text-muted-foreground">
                            基础分 {log.result.details.baseScore} × {log.result.details.multiplier}
                            {' '}
                            {log.result.details.contextAdjustment >= 0 ? '+' : ''}
                            {log.result.details.contextAdjustment}
                            {log.result.details.aiScore !== undefined
                              ? ` / AI分 ${log.result.details.aiScore}`
                              : ''}
                          </p>
                        </div>

                        <div>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 font-medium ${RISK_COLORS[log.result.riskLevel]}`}>
                            {RISK_LABELS[log.result.riskLevel]}
                          </span>
                        </div>

                        <div className="font-mono text-foreground">
                          {log.result.riskScore}
                        </div>

                        <div>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 font-medium ${getActionColor(log.result.action)}`}>
                            {ACTION_LABELS[log.result.action]}
                          </span>
                        </div>

                        <div>
                          {log.result.matchedWords.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {log.result.matchedWords.slice(0, 3).map((word, index) => (
                                <span
                                  key={`${word.word}-${index}`}
                                  className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400"
                                >
                                  {word.word}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">无</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  第 <span className="font-mono text-foreground">{logPage}</span> /{' '}
                  <span className="font-mono text-foreground">{totalPages}</span> 页
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setLogPage((prev) => Math.max(1, prev - 1))}
                    disabled={logPage <= 1}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                  >
                    上一页
                  </button>

                  <button
                    onClick={() => setLogPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={logPage >= totalPages}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {viewMode === 'chat' && (
          <div className="w-80 border-l border-border bg-card/30 overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                实时检测结果
              </h3>
            </div>

             {lastDetection ? (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <div className="text-3xl font-bold font-mono">
                  <span className={RISK_COLORS[lastDetection.riskLevel].split(' ')[0]}>
                    {lastDetection.riskScore}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-1">风险分数</p>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${RISK_COLORS[lastDetection.riskLevel]}`}>
                    {RISK_LABELS[lastDetection.riskLevel]}
                  </span>

                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getActionColor(lastDetection.action)}`}>
                    {ACTION_LABELS[lastDetection.action]}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground">分数拆解</h4>

                <div className="space-y-2 text-xs">
                  <div className="rounded-md bg-background/60 p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">传统基础分</span>
                      <span className="font-mono text-foreground">{lastDetection.details.baseScore}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">敏感词乘数</span>
                      <span className="font-mono text-foreground">×{lastDetection.details.multiplier}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">上下文调节</span>
                      <span className="font-mono text-foreground">
                        {lastDetection.details.contextAdjustment >= 0 ? '+' : ''}
                        {lastDetection.details.contextAdjustment}
                      </span>
                    </div>

                    <div className="border-t border-border pt-1.5 flex justify-between">
                      <span className="text-muted-foreground">传统检测分</span>
                      <span className="font-mono text-foreground">
                        {lastDetection.details.traditionalScore ?? lastDetection.details.finalScore}
                      </span>
                    </div>
                  </div>

                  {lastDetection.details.aiScore !== undefined && (
                    <div className="rounded-md bg-background/60 p-3 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI 风险分</span>
                        <span className="font-mono text-foreground">{lastDetection.details.aiScore}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI 置信度</span>
                        <span className="font-mono text-foreground">
                          {Math.round((lastDetection.details.aiConfidence ?? 0) * 100)}%
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI 融合权重</span>
                        <span className="font-mono text-foreground">
                          {Math.round((lastDetection.details.aiWeight ?? 0) * 100)}%
                        </span>
                      </div>

                      {lastDetection.details.scoreFormula && (
                        <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {lastDetection.details.scoreFormula}
                        </p>
                      )}

                      {lastDetection.details.aiReasoning && (
                        <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
                          AI 判断理由：{lastDetection.details.aiReasoning}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between font-medium">
                    <span className="text-foreground">最终分</span>
                    <span className="font-mono text-foreground">{lastDetection.riskScore}</span>
                  </div>
                </div>
              </div>

                {lastDetection.isSafe && lastDetection.action === 'pass' ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                    <p className="text-sm text-emerald-400">内容安全，未检测到风险</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-4 text-center">
                    <p className="text-sm text-red-400">
                      检测到风险内容，处理结果：{ACTION_LABELS[lastDetection.action]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      风险等级：{RISK_LABELS[lastDetection.riskLevel]}，风险分数：{lastDetection.riskScore}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="mt-3 text-xs text-muted-foreground">发送消息后查看检测结果</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}