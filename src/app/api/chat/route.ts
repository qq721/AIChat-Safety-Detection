import { NextRequest, NextResponse } from 'next/server';
import {
  addChatMessage,
  detectContent,
  clearChatMessages,
  getChatMessages,
  initAIDetector,
  isAIEnabled,
  detectContentWithAI,
  detectContentSync,
  generateAIReply,// 其他相关函数和类型
} from '@/lib/content-safety';

// 从环境变量读取配置
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-turbo';
const ENABLE_AI = process.env.ENABLE_AI_DETECTION === 'true';

// 初始化AI检测器（仅当配置了API Key且启用AI时）
let aiInitialized = false;
if (QWEN_API_KEY && ENABLE_AI) {
  initAIDetector({
    apiKey: QWEN_API_KEY,
    model: QWEN_MODEL,
    enabled: true,
  });
  aiInitialized = true;
  console.log('✅ 通义千问AI检测器已初始化，模型:', QWEN_MODEL);
} else {
  console.log('⚠️ AI检测未启用或未配置API Key');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, action, useAI = true } = body;

    // 处理清除消息的请求
    if (action === 'clear') {
      clearChatMessages();
      return NextResponse.json({ success: true });
    }

    // 验证内容
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content 字段必填' }, { status: 400 });
    }

    // 限制内容长度
    if (content.length > 5000) {
      return NextResponse.json(
        { error: '内容长度超过限制（最大5000字符）' },
        { status: 400 }
      );
    }

    // 执行内容安全检测
    let detection;
    const aiEnabled = isAIEnabled();
    
    if (useAI && aiEnabled) {
      // 使用AI增强检测
      detection = await detectContentWithAI(content);
      console.log('AI检测完成，风险等级:', detection.riskLevel, '分数:', detection.riskScore);
    } else {
      // 使用传统同步检测
      //detection = detectContentSync(content);
      detection = await detectContent(content);
    }

    // 添加用户消息
    const userMsg = addChatMessage('user', content, detection, !detection.isSafe);

    // 生成回复内容
    let replyContent = '';

if (!detection.isSafe || detection.action === 'block') {
  replyContent = `⚠️ 内容已被安全策略拦截。检测到风险等级：${detection.riskLevel}，风险分数：${detection.riskScore}。`;

  if (detection.matchedWords.length > 0) {
    replyContent += `匹配敏感词：${detection.matchedWords.map((w) => w.word).join('、')}`;
  }
} else if (detection.action === 'review') {
  replyContent = `🕘 内容已提交人工审核。风险等级：${detection.riskLevel}，风险分数：${detection.riskScore}。`;
} else if (detection.action === 'warn') {
  replyContent = `⚠️ 内容存在一定风险，已发出警告。风险等级：${detection.riskLevel}，风险分数：${detection.riskScore}。`;
} else {
  const aiReply = await generateAIReply(content);

  replyContent =
    aiReply ||
    '内容安全检测已通过，但 AI 回复生成失败，请稍后再试。';
}

    // 添加助手回复
    const assistantMsg = addChatMessage('assistant', replyContent);

    return NextResponse.json({
      success: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      detection,
      aiEnabled: useAI && aiEnabled,
    });
  } catch (error) {
    console.error('聊天接口错误:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ messages: getChatMessages() });
}