/**
 * Alchat 内容安全监测引擎
 * 包含：分类分级敏感词库、风险评分算法、阈值体系、策略配置
 */
// 在文件顶部添加导入
import { AISafetyDetector, AIDetectionResult } from '@/lib/ai-safety-detector';

// ==================== AI检测配置 ====================

let aiDetector: AISafetyDetector | null = null;
let enableAIDetection = true;
let aiWeight = 0.6; // AI判断权重

// 初始化通义千问检测器
export function initAIDetector(config?: {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  enabled?: boolean;
}) {
  aiDetector = new AISafetyDetector({
    apiKey: config?.apiKey || process.env.QWEN_API_KEY,
    apiUrl: config?.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: config?.model || 'qwen-turbo',
    useAI: config?.enabled ?? true,
  });
  enableAIDetection = config?.enabled ?? true;
}

export function setAIWeight(weight: number) {
  aiWeight = Math.min(Math.max(weight, 0), 1);
}

export function isAIEnabled(): boolean {
  return enableAIDetection && aiDetector !== null;
}

// ==================== 类型定义 ====================

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type ActionType = 'pass' | 'warn' | 'block' | 'review';

export interface SensitiveWord {
  id: string;
  word: string;
  category: string;
  level: 1 | 2 | 3 | 4; // 1=严重 2=高危 3=中危 4=低危
  score: number; // 基础分值 1-100
  enabled: boolean;
  createdAt: string;
}

export interface DetectionResult {
  isSafe: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
  action: ActionType;
  matchedWords: Array<{
    word: string;
    category: string;
    level: number;
    score: number;
    position: number;
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
  timestamp: string;
}

export interface DetectionLog {
  id: string;
  content: string;
  result: DetectionResult;
  timestamp: string;
  source: 'chat' | 'api';
}

export interface StrategyConfig {
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  detection?: DetectionResult;
  timestamp: string;
  blocked?: boolean;
}

// ==================== 默认敏感词库 ====================

const DEFAULT_SENSITIVE_WORDS: Omit<SensitiveWord, 'id' | 'createdAt'>[] = [
  // 一级 - 严重违规
  { word: '恐怖袭击', category: '恐怖主义', level: 1, score: 100, enabled: true },
  { word: '制造炸弹', category: '恐怖主义', level: 1, score: 100, enabled: true },
  { word: '暴恐', category: '恐怖主义', level: 1, score: 95, enabled: true },
  { word: '极端组织', category: '恐怖主义', level: 1, score: 95, enabled: true },
  { word: '分裂国家', category: '政治敏感', level: 1, score: 98, enabled: true },
  { word: '颠覆政权', category: '政治敏感', level: 1, score: 98, enabled: true },
  { word: '儿童色情', category: '色情暴力', level: 1, score: 100, enabled: true },

  // 二级 - 高危
  { word: '赌博网站', category: '违法信息', level: 2, score: 80, enabled: true },
  { word: '网络诈骗', category: '违法信息', level: 2, score: 85, enabled: true },
  { word: '洗钱', category: '违法信息', level: 2, score: 85, enabled: true },
  { word: '贩卖毒品', category: '违法信息', level: 2, score: 90, enabled: true },
  { word: '色情直播', category: '色情暴力', level: 2, score: 80, enabled: true },
  { word: '暴力血腥', category: '色情暴力', level: 2, score: 75, enabled: true },
  { word: '自杀方法', category: '危害生命', level: 2, score: 88, enabled: true },
  { word: '教唆犯罪', category: '违法信息', level: 2, score: 82, enabled: true },

  // 三级 - 中危
  { word: '政治谣言', category: '政治敏感', level: 3, score: 55, enabled: true },
  { word: '煽动仇恨', category: '歧视言论', level: 3, score: 60, enabled: true },
  { word: '地域歧视', category: '歧视言论', level: 3, score: 50, enabled: true },
  { word: '性别歧视', category: '歧视言论', level: 3, score: 50, enabled: true },
  { word: '宗教极端', category: '宗教敏感', level: 3, score: 55, enabled: true },
  { word: '邪教', category: '宗教敏感', level: 3, score: 60, enabled: true },
  { word: '人肉搜索', category: '隐私侵犯', level: 3, score: 55, enabled: true },
  { word: '隐私泄露', category: '隐私侵犯', level: 3, score: 58, enabled: true },

  // 四级 - 低危
  { word: '广告推广', category: '垃圾信息', level: 4, score: 25, enabled: true },
  { word: '刷单', category: '垃圾信息', level: 4, score: 30, enabled: true },
  { word: '虚假宣传', category: '垃圾信息', level: 4, score: 28, enabled: true },
  { word: '低俗', category: '不良信息', level: 4, score: 20, enabled: true },
  { word: '辱骂', category: '不良信息', level: 4, score: 30, enabled: true },
  { word: '人身攻击', category: '不良信息', level: 4, score: 35, enabled: true },
];

// ==================== 默认策略配置 ====================

const DEFAULT_STRATEGY: Omit<StrategyConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '默认安全策略',
  description: '系统默认内容安全策略，适用于一般场景',
  thresholds: {
    low: 20,
    medium: 45,
    high: 70,
    critical: 90,
  },
  actions: {
    low: 'pass',
    medium: 'warn',
    high: 'block',
    critical: 'block',
  },
  enabled: true,
  isDefault: true,
};

// ==================== 内存存储 ====================

let sensitiveWords: SensitiveWord[] = [];
//let detectionLogs: DetectionLog[] = [];

const globalForLogs = globalThis as unknown as {
  detectionLogs: DetectionLog[];
};

export const detectionLogs =
  globalForLogs.detectionLogs ?? (globalForLogs.detectionLogs = []);

let strategies: StrategyConfig[] = [];
let chatMessages: ChatMessage[] = [];

let nextWordId = 1;

const globalForIds = globalThis as unknown as {
  nextLogId: number;
};

let nextLogId = globalForIds.nextLogId ?? 1;

function saveNextId() {
  globalForIds.nextLogId = nextLogId;
}

//let nextLogId = 1;
let nextStrategyId = 1;
let nextMsgId = 1;
let activeStrategyId = '1';

function initDefaults() {
  if (sensitiveWords.length === 0) {
    sensitiveWords = DEFAULT_SENSITIVE_WORDS.map((w) => ({
      ...w,
      id: String(nextWordId++),
      createdAt: new Date().toISOString(),
    }));
  }
  if (strategies.length === 0) {
    strategies = [
      {
        ...DEFAULT_STRATEGY,
        id: String(nextStrategyId++),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    activeStrategyId = '1';
  }
}

// ==================== 风险评分算法 ====================

/**
 * 计算风险分数
 */
function calculateRiskScore(
  matchedWords: DetectionResult['matchedWords'],
  contentLength: number
): DetectionResult['details'] {
  const levelWeights: Record<number, number> = {
    1: 1.5,
    2: 1.2,
    3: 1.0,
    4: 0.7,
  };

  let baseScore = 0;
  for (const mw of matchedWords) {
    baseScore += mw.score * (levelWeights[mw.level] || 1.0);
  }

  const matchCount = matchedWords.length;
  const multiplier = matchCount > 0 ? 1 + 0.3 * (matchCount - 1) : 0;

  let contextAdjustment = 0;
  if (contentLength > 0 && matchCount > 0) {
    const density = matchCount / contentLength;
    if (density > 0.1) {
      contextAdjustment = 15;
    } else if (density > 0.05) {
      contextAdjustment = 5;
    } else if (contentLength > 500) {
      contextAdjustment = -5;
    }
  }

  const finalScore = Math.min(
    Math.max(Math.round(baseScore * multiplier + contextAdjustment), 0),
    100
  );

  return {
    baseScore: Math.round(baseScore),
    multiplier: Math.round(multiplier * 100) / 100,
    contextAdjustment,
    finalScore,
  };
}

function getRiskLevel(score: number, thresholds: StrategyConfig['thresholds']): RiskLevel {
  if (score >= thresholds.critical) return 'critical';
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  if (score >= thresholds.low) return 'low';
  return 'safe';
}

function getAction(level: RiskLevel, actions: StrategyConfig['actions']): ActionType {
  const levelKey = level as keyof StrategyConfig['actions'];
  return actions[levelKey] || 'pass';
}

// ==================== 核心检测函数（同步版本，内部使用） ====================

function detectContentSync(content: string): DetectionResult {
  initDefaults();

  const activeStrategy = strategies.find((s) => s.id === activeStrategyId) || strategies[0];
  const enabledWords = sensitiveWords.filter((w) => w.enabled);

  const matchedWords: DetectionResult['matchedWords'] = [];
  for (const sw of enabledWords) {
    let pos = content.indexOf(sw.word);
    while (pos !== -1) {
      matchedWords.push({
        word: sw.word,
        category: sw.category,
        level: sw.level,
        score: sw.score,
        position: pos,
      });
      pos = content.indexOf(sw.word, pos + 1);
    }
  }

  const uniqueMap = new Map<string, (typeof matchedWords)[0]>();
  for (const mw of matchedWords) {
    const existing = uniqueMap.get(mw.word);
    if (!existing || mw.score > existing.score) {
      uniqueMap.set(mw.word, mw);
    }
  }
  const uniqueMatches = Array.from(uniqueMap.values());

  const details = calculateRiskScore(uniqueMatches, content.length);
  const riskLevel = getRiskLevel(details.finalScore, activeStrategy.thresholds);
  const action = getAction(riskLevel, activeStrategy.actions);

  const result: DetectionResult = {
    isSafe: action !== 'block',
    riskLevel,
    riskScore: details.finalScore,
    action,
    matchedWords: uniqueMatches,
    details,
    timestamp: new Date().toISOString(),
  };
/* const log: DetectionLog = {
    id: String(nextLogId++),
    content: content.length > 200 ? content.substring(0, 200) + '...' : content,
    result,
    timestamp: new Date().toISOString(),
    source: 'chat',
  };
  detectionLogs.unshift(log);
  if (detectionLogs.length > 500) {
    detectionLogs = detectionLogs.slice(0, 500);
  }
*/
  return result;
}

// ==================== AI 增强检测 ====================

/**
 * 融合传统检测和AI检测结果
 */
function mergeResults(
  traditional: DetectionResult,
  ai: AIDetectionResult | null
): DetectionResult {
  if (!ai || !enableAIDetection) {
    return traditional;
  }
  
  const aiScoreMap: Record<RiskLevel, number> = {
    safe: 0,
    low: 25,
    medium: 55,
    high: 85,
    critical: 100,
  };
  
  const aiScore = aiScoreMap[ai.riskLevel];
  const traditionalScore = traditional.riskScore;
  
  let effectiveWeight = aiWeight;
  if (ai.confidence > 0.9) {
    effectiveWeight = Math.min(aiWeight + 0.2, 0.9);
  } else if (ai.confidence < 0.6) {
    effectiveWeight = aiWeight * 0.5;
  }
  
  let finalScore = Math.round(
    traditionalScore * (1 - effectiveWeight) + aiScore * effectiveWeight
  );
  
  let finalRiskLevel = traditional.riskLevel;
  if (ai.confidence > 0.85 && (ai.riskLevel === 'critical' || ai.riskLevel === 'high')) {
    finalRiskLevel = ai.riskLevel;
    finalScore = Math.max(finalScore, aiScore);
  }
  else if (ai.confidence > 0.9 && ai.riskLevel === 'safe' && traditional.riskLevel !== 'critical') {
    finalRiskLevel = 'safe';
    finalScore = Math.min(finalScore, 10);
  }
  else {
    const activeStrategy = strategies.find((s) => s.id === activeStrategyId) || strategies[0];
    finalRiskLevel = getRiskLevel(finalScore, activeStrategy.thresholds);
  }
  
  const activeStrategy = strategies.find((s) => s.id === activeStrategyId) || strategies[0];
  const action = getAction(finalRiskLevel, activeStrategy.actions);
  
  return {
  ...traditional,

  matchedWords: traditional.matchedWords,

  isSafe: action !== 'block',
  riskLevel: finalRiskLevel,
  riskScore: finalScore,
  action,

  details: {
    ...traditional.details,
    traditionalScore,
    aiScore,
    aiWeight: effectiveWeight,
    aiConfidence: ai?.confidence,
    aiReasoning: ai?.reasoning,
    finalScore,
    scoreFormula: `最终分 = 传统分 ${traditionalScore} × ${(1 - effectiveWeight).toFixed(
      2
    )} + AI分 ${aiScore} × ${effectiveWeight.toFixed(2)}`,
  },

  timestamp: new Date().toISOString(),
};
}

/**
 * 使用AI增强的内容检测（异步）
 */
export async function detectContentWithAI(content: string): Promise<DetectionResult> {
  initDefaults();
  
  // 调用同步检测函数（不会递归）
  const traditionalResult = detectContentSync(content);
  
  let aiResult: AIDetectionResult | null = null;
  if (enableAIDetection && aiDetector) {
    try {
      aiResult = await aiDetector.detect(content);
      console.log('AI检测结果:', aiResult);
    } catch (error) {
      console.error('AI检测异常，使用传统检测:', error);
    }
  }
  
  const finalResult = mergeResults(traditionalResult, aiResult);

  
 // 记录日志 
  const log: DetectionLog = {
  id: String(nextLogId++),
  content: content.length > 200 ? content.substring(0, 200) + '...' : content,
  result: finalResult,
  timestamp: new Date().toISOString(),
  source: 'chat',
};

detectionLogs.unshift(log);
saveNextId();

//if (detectionLogs.length > 500) {
//  detectionLogs = detectionLogs.slice(0, 500);
//}
  // 更新日志的AI元数据
 /* if (aiResult && detectionLogs.length > 0) {
    const latestLog = detectionLogs[0];
    if (latestLog && latestLog.content === (content.length > 200 ? content.substring(0, 200) + '...' : content)) {
      (latestLog as any).aiMetadata = {
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        categories: aiResult.sensitiveCategories,
      };
    }
  }*/
  
  return finalResult;
}

// 导出同步版本供内部使用
export { detectContentSync };

// 导出异步版本作为默认检测函数
export const detectContent = detectContentWithAI;

// ==================== 敏感词管理 ====================

export function getSensitiveWords(): SensitiveWord[] {
  initDefaults();
  return [...sensitiveWords];
}

export function addSensitiveWord(
  word: string,
  category: string,
  level: 1 | 2 | 3 | 4,
  score: number
): SensitiveWord {
  initDefaults();
  const newWord: SensitiveWord = {
    id: String(nextWordId++),
    word,
    category,
    level,
    score: Math.min(Math.max(score, 1), 100),
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  sensitiveWords.push(newWord);
  return newWord;
}

export function deleteSensitiveWord(id: string): boolean {
  const idx = sensitiveWords.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  sensitiveWords.splice(idx, 1);
  return true;
}

export function toggleSensitiveWord(id: string): SensitiveWord | null {
  const word = sensitiveWords.find((w) => w.id === id);
  if (!word) return null;
  word.enabled = !word.enabled;
  return word;
}

export function updateSensitiveWord(
  id: string,
  updates: Partial<Pick<SensitiveWord, 'word' | 'category' | 'level' | 'score' | 'enabled'>>
): SensitiveWord | null {
  const word = sensitiveWords.find((w) => w.id === id);
  if (!word) return null;
  Object.assign(word, updates);
  return word;
}

// ==================== 日志管理 ====================

export function getDetectionLogs(filters?: {
  riskLevel?: RiskLevel;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): { logs: DetectionLog[]; total: number } {
  initDefaults();
  let filtered = [...detectionLogs];

  if (filters?.riskLevel) {
    filtered = filtered.filter((l) => l.result.riskLevel === filters.riskLevel);
  }
  if (filters?.startDate) {
    filtered = filtered.filter((l) => l.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    filtered = filtered.filter((l) => l.timestamp <= filters.endDate!);
  }
  if (filters?.keyword) {
    const kw = filters.keyword.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.content.toLowerCase().includes(kw) ||
        l.result.matchedWords.some((w) => w.word.toLowerCase().includes(kw))
    );
  }

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const logs = filtered.slice(start, start + pageSize);

  return { logs, total };
}

// ==================== 统计数据 ====================

export function getStatistics() {
  initDefaults();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const todayLogs = detectionLogs.filter((l) => l.timestamp >= today);
  const weekLogs = detectionLogs.filter((l) => l.timestamp >= last7Days);
  const monthLogs = detectionLogs.filter((l) => l.timestamp >= last30Days);

  const countByLevel = (logs: DetectionLog[]) => {
    const counts = { safe: 0, low: 0, medium: 0, high: 0, critical: 0 };
    logs.forEach((l) => {
      counts[l.result.riskLevel]++;
    });
    return counts;
  };

  const countByCategory = (logs: DetectionLog[]) => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      l.result.matchedWords.forEach((w) => {
        counts[w.category] = (counts[w.category] || 0) + 1;
      });
    });
    return counts;
  };

  const countByAction = (logs: DetectionLog[]) => {
    const counts = { pass: 0, warn: 0, block: 0, review: 0 };
    logs.forEach((l) => {
      counts[l.result.action]++;
    });
    return counts;
  };

  const dailyStats: Array<{ date: string; total: number; blocked: number; warned: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const dayEnd = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() + 1
    ).toISOString();
    const dayLogs = detectionLogs.filter((l) => l.timestamp >= dayStart && l.timestamp < dayEnd);
    dailyStats.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      total: dayLogs.length,
      blocked: dayLogs.filter((l) => l.result.action === 'block').length,
      warned: dayLogs.filter((l) => l.result.action === 'warn').length,
    });
  }

  const totalAll = detectionLogs.length;
  const blockedAll = detectionLogs.filter((l) => l.result.action === 'block').length;
  const passRate = totalAll > 0 ? Math.round(((totalAll - blockedAll) / totalAll) * 100) : 100;
  const blockRate = totalAll > 0 ? Math.round((blockedAll / totalAll) * 100) : 0;

  return {
    overview: {
      totalDetections: totalAll,
      todayDetections: todayLogs.length,
      weekDetections: weekLogs.length,
      monthDetections: monthLogs.length,
      blockedCount: blockedAll,
      passRate,
      blockRate,
    },
    levelDistribution: countByLevel(detectionLogs),
    categoryDistribution: countByCategory(detectionLogs),
    actionDistribution: countByAction(detectionLogs),
    dailyStats,
    topWords: getTopSensitiveWords(10),
  };
}

function getTopSensitiveWords(limit: number) {
  const wordCounts: Record<string, { word: string; category: string; count: number }> = {};
  detectionLogs.forEach((l) => {
    l.result.matchedWords.forEach((w) => {
      if (!wordCounts[w.word]) {
        wordCounts[w.word] = { word: w.word, category: w.category, count: 0 };
      }
      wordCounts[w.word].count++;
    });
  });
  return Object.values(wordCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ==================== 策略管理 ====================

export function getStrategies(): StrategyConfig[] {
  initDefaults();
  return [...strategies];
}

export function getActiveStrategy(): StrategyConfig {
  initDefaults();
  return strategies.find((s) => s.id === activeStrategyId) || strategies[0];
}

export function getActiveStrategyId(): string {
  initDefaults();
  return activeStrategyId;
}

export function addStrategy(
  name: string,
  description: string,
  thresholds: StrategyConfig['thresholds'],
  actions: StrategyConfig['actions']
): StrategyConfig {
  initDefaults();
  const newStrategy: StrategyConfig = {
    id: String(nextStrategyId++),
    name,
    description,
    thresholds,
    actions,
    enabled: true,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  strategies.push(newStrategy);
  return newStrategy;
}

export function updateStrategy(
  id: string,
  updates: Partial<Pick<StrategyConfig, 'name' | 'description' | 'thresholds' | 'actions' | 'enabled'>>
): StrategyConfig | null {
  const strategy = strategies.find((s) => s.id === id);
  if (!strategy) return null;
  Object.assign(strategy, updates, { updatedAt: new Date().toISOString() });
  return strategy;
}

export function deleteStrategy(id: string): boolean {
  const strategy = strategies.find((s) => s.id === id);
  if (!strategy || strategy.isDefault) return false;
  const idx = strategies.findIndex((s) => s.id === id);
  strategies.splice(idx, 1);
  if (activeStrategyId === id) {
    activeStrategyId = '1';
  }
  return true;
}

export function setActiveStrategy(id: string): boolean {
  const strategy = strategies.find((s) => s.id === id);
  if (!strategy) return false;
  activeStrategyId = id;
  return true;
}

// ==================== 聊天管理 ====================

export function getChatMessages(): ChatMessage[] {
  return [...chatMessages];
}

export function addChatMessage(
  role: ChatMessage['role'],
  content: string,
  detection?: DetectionResult,
  blocked?: boolean
): ChatMessage {
  const msg: ChatMessage = {
    id: String(nextMsgId++),
    role,
    content,
    detection,
    timestamp: new Date().toISOString(),
    blocked,
  };
  chatMessages.push(msg);
  return msg;
}

export function clearChatMessages(): void {
  chatMessages = [];
  nextMsgId = 1;
}
// AI对话生成函数 功能：调用通义千问API生成AI回复内容，返回文本结果。
export async function generateAIReply(content: string): Promise<string | null> {
  if (!aiDetector) {
    return null;
  }

  return aiDetector.chat(content);
}