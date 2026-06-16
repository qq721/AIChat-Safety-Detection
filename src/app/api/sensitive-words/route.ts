import { NextRequest, NextResponse } from 'next/server';
import {
  getSensitiveWords,
  addSensitiveWord,
  deleteSensitiveWord,
  toggleSensitiveWord,
  updateSensitiveWord,
} from '@/lib/content-safety';

export async function GET() {
  return NextResponse.json({ words: getSensitiveWords() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, category, level, score } = body as {
      word?: string;
      category?: string;
      level?: 1 | 2 | 3 | 4;
      score?: number;
    };

    if (!word || !category || !level || !score) {
      return NextResponse.json({ error: 'word, category, level, score 字段必填' }, { status: 400 });
    }

    if (![1, 2, 3, 4].includes(level)) {
      return NextResponse.json({ error: 'level 必须为 1-4' }, { status: 400 });
    }

    const newWord = addSensitiveWord(word, category, level, score);
    return NextResponse.json({ success: true, word: newWord });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action: actionType, ...updates } = body as {
      id?: string;
      action?: 'toggle' | 'update';
      word?: string;
      category?: string;
      level?: 1 | 2 | 3 | 4;
      score?: number;
      enabled?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id 必填' }, { status: 400 });
    }

    if (actionType === 'toggle') {
      const result = toggleSensitiveWord(id);
      if (!result) return NextResponse.json({ error: '未找到该词' }, { status: 404 });
      return NextResponse.json({ success: true, word: result });
    }

    const result = updateSensitiveWord(id, updates);
    if (!result) return NextResponse.json({ error: '未找到该词' }, { status: 404 });
    return NextResponse.json({ success: true, word: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id 参数必填' }, { status: 400 });
    }

    const success = deleteSensitiveWord(id);
    if (!success) return NextResponse.json({ error: '未找到该词' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
