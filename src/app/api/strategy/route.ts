import { NextRequest, NextResponse } from 'next/server';
import {
  getStrategies,
  getActiveStrategyId,
  addStrategy,
  updateStrategy,
  deleteStrategy,
  setActiveStrategy,
  type ActionType,
  type StrategyConfig,
} from '@/lib/content-safety';

function parseActions(actions: Record<string, string>): StrategyConfig['actions'] {
  return {
    low: (actions.low ?? 'pass') as ActionType,
    medium: (actions.medium ?? 'warn') as ActionType,
    high: (actions.high ?? 'block') as ActionType,
    critical: (actions.critical ?? 'block') as ActionType,
  };
}

export async function GET() {
  return NextResponse.json({
    strategies: getStrategies(),
    activeStrategyId: getActiveStrategyId(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action: actionType, ...data } = body as {
      action?: 'add' | 'activate' | 'update' | 'delete';
      id?: string;
      name?: string;
      description?: string;
      thresholds?: { low: number; medium: number; high: number; critical: number };
      actions?: { low: string; medium: string; high: string; critical: string };
      enabled?: boolean;
    };

    if (actionType === 'activate') {
      if (!data.id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
      const success = setActiveStrategy(data.id);
      return NextResponse.json({ success });
    }

    if (actionType === 'delete') {
      if (!data.id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
      const success = deleteStrategy(data.id);
      if (!success) return NextResponse.json({ error: '无法删除默认策略' }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (actionType === 'update') {
      if (!data.id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
      const result = updateStrategy(data.id, {
        name: data.name,
        description: data.description,
        thresholds: data.thresholds,
        actions: data.actions ? parseActions(data.actions) : undefined,
        enabled: data.enabled,
      });
      if (!result) return NextResponse.json({ error: '未找到策略' }, { status: 404 });
      return NextResponse.json({ success: true, strategy: result });
    }

    // add
    if (!data.name || !data.thresholds || !data.actions) {
      return NextResponse.json(
        { error: 'name, thresholds, actions 字段必填' },
        { status: 400 }
      );
    }

    const newStrategy = addStrategy(
      data.name,
      data.description || '',
      data.thresholds,
      parseActions(data.actions)
    );
    return NextResponse.json({ success: true, strategy: newStrategy });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
