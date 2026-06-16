// src/lib/ai-safety-detector.ts
// AI安全检测模块 功能：使用通义千问API对用户输入内容进行安全检测，返回结构化的检测结果，包括风险等级、敏感类别和AI的判断理由。
export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface AIDetectionResult {
  isSafe: boolean;
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  reasoning: string; // AI的判断理由
  sensitiveCategories: string[];
  suggestions?: string;
}

export class AISafetyDetector {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private useAI: boolean;

  constructor(config?: { apiKey?: string; apiUrl?: string; model?: string; useAI?: boolean }) {
    this.apiKey = config?.apiKey || process.env.QWEN_API_KEY || '';
    // 通义千问API地址
    this.apiUrl = config?.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    this.model = config?.model || 'qwen-turbo'; // 可选: qwen-turbo, qwen-plus, qwen-max
    this.useAI = config?.useAI ?? process.env.ENABLE_AI_DETECTION === 'true';
  }

  // AI对话生成函数 功能：调用通义千问API生成基于用户输入的AI回复，适用于客服或智能助手场景。
  async chat(content: string): Promise<string | null> {
  if (!this.apiKey) {
    console.log('未配置 API Key，无法生成 AI 回复');
    return null;
  }

  try {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '你是 Alchat 的智能助手。请正常回答用户问题，回答要清晰、自然、准确。不要重复安全检测结果。',
          },
          {
            role: 'user',
            content,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI 对话 API 错误:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('AI 对话生成失败:', error);
    return null;
  }
}// AI检测主函数 功能：调用通义千问API对输入内容进行安全检测，并返回结构化的检测结果。

  async detect(content: string): Promise<AIDetectionResult | null> {
    if (!this.useAI || !this.apiKey) {
      console.log('AI检测未启用或未配置API Key');
      return null;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的内容安全审核专家。你的任务是对用户输入的内容进行安全审核，判断是否包含敏感或违规内容。

请严格按照以下JSON格式返回结果，不要返回任何其他内容：
{
  "isSafe": true或false,
  "riskLevel": "safe"或"low"或"medium"或"high"或"critical",
  "confidence": 0到1之间的数字,
  "reasoning": "判断理由（中文）",
  "sensitiveCategories": ["类别1", "类别2"]
}

风险等级定义：
- safe: 完全安全，无任何问题
- low: 轻微风险（如广告推广、轻微不当言论、刷单等）
- medium: 中等风险（如地域歧视、性别歧视、政治谣言、宗教极端等）
- high: 高风险（如色情内容、暴力血腥、诈骗信息、毒品相关等）
- critical: 严重违规（如恐怖主义、分裂国家、儿童色情、颠覆政权等）

注意事项：
1. 要理解上下文和语境，不要过度敏感
2. 区分正常讨论和恶意内容
3. 如果是正常的教育、新闻讨论，应该判定为safe
4. confidence表示你判断的确信程度`
            },
            {
              role: 'user',
              content: `请判断以下内容的安全等级：\n\n${content}`
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('通义千问API错误:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // 解析JSON响应
      let aiResult;
      try {
        // 提取JSON部分（防止AI返回额外文字）
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[0]);
        } else {
          aiResult = JSON.parse(aiResponse);
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', aiResponse);
        return null;
      }
      
      // 验证并规范化结果
      return {
        isSafe: aiResult.isSafe === true,
        riskLevel: this.validateRiskLevel(aiResult.riskLevel),
        confidence: Math.min(Math.max(aiResult.confidence || 0.5, 0), 1),
        reasoning: aiResult.reasoning || 'AI判断完成',
        sensitiveCategories: aiResult.sensitiveCategories || [],
      };
    } catch (error) {
      console.error('通义千问检测失败:', error);
      return null; // 降级到传统检测
    }
  }

  private validateRiskLevel(level: string): RiskLevel {
    const validLevels: RiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];
    return validLevels.includes(level as RiskLevel) ? (level as RiskLevel) : 'safe';
  }
}