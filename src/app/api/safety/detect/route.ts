//功能：AI内容安全检测API路由，提供POST接口进行内容检测，GET接口获取统计信息和检测日志。支持使用通义千问API进行AI检测，并记录检测结果和统计数据。
import { NextRequest, NextResponse } from 'next/server';
import { 
  detectContentWithAI, 
  detectContentSync,
  initAIDetector,
  isAIEnabled,
  getStatistics,
  getDetectionLogs
} from '@/lib/content-safety';

// ✅ 从环境变量读取配置（不再硬编码）
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-turbo';
const ENABLE_AI = process.env.ENABLE_AI_DETECTION === 'true';

// 初始化AI检测器
if (QWEN_API_KEY && ENABLE_AI) {
  initAIDetector({
    apiKey: QWEN_API_KEY,
    model: QWEN_MODEL,
    enabled: true,
  });
  console.log('✅ 通义千问AI检测器已初始化，模型:', QWEN_MODEL);
} else {
  console.log('⚠️ AI检测未启用或未配置API Key');
}

// ... 其余代码保持不变

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, useAI = true } = body;
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: '内容不能为空' 
      }, { status: 400 });
    }
    
    // 限制内容长度
    if (content.length > 5000) {
      return NextResponse.json({ 
        success: false, 
        error: '内容长度超过限制（最大5000字符）' 
      }, { status: 400 });
    }
    
    let result;
    if (useAI && isAIEnabled()) {
      result = await detectContentWithAI(content);
    } else {
      result = detectContentSync(content);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      aiEnabled: isAIEnabled()
    });
    
  } catch (error) {
    console.error('检测接口错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: '检测失败，请稍后重试' 
    }, { status: 500 });
  }
}

// 获取统计信息
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  
  if (type === 'stats') {
    const stats = getStatistics();
    return NextResponse.json({ success: true, data: stats });
  }
  
  if (type === 'logs') {
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const logs = getDetectionLogs({ page, pageSize });
    return NextResponse.json({ success: true, data: logs });
  }
  
  return NextResponse.json({ 
    success: true, 
    data: { 
      aiEnabled: isAIEnabled(),
      message: 'AI内容安全检测服务已就绪'
    }
  });
}