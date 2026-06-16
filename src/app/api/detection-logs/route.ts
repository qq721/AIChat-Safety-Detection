import { NextRequest, NextResponse } from 'next/server';
import { getDetectionLogs, type RiskLevel } from '@/lib/content-safety';

const VALID_RISK_LEVELS = new Set([
  'safe',
  'low',
  'medium',
  'high',
  'critical',
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const riskLevel = searchParams.get('riskLevel');
    const page = Number(searchParams.get('page') ?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 10);
    const keyword = searchParams.get('keyword')?.trim();

    const result = getDetectionLogs({
      riskLevel:
        riskLevel && VALID_RISK_LEVELS.has(riskLevel)
          ? (riskLevel as RiskLevel)
          : undefined,
      keyword: keyword || undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
    });

    return NextResponse.json({
      logs: result.logs,
      total: result.total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '获取检测日志失败',
        logs: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}