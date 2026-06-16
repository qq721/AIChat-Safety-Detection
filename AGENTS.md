# AGENTS.md

## 项目概览

Alchat 内容安全监测系统 — 基于 Next.js 16 + React 19 + TypeScript 5 的内容安全监测平台。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **包管理**: pnpm (严禁 npm/yarn)

## 目录结构

```
src/
├── app/
│   ├── page.tsx                # 对话监测页面（首页）
│   ├── layout.tsx              # 全局布局
│   ├── globals.css             # 全局样式（暗色监控主题）
│   ├── logs/page.tsx           # 检测日志页面
│   ├── dashboard/page.tsx      # 统计仪表盘页面
│   ├── strategy/page.tsx       # 策略配置页面
│   ├── words/page.tsx          # 敏感词库管理页面
│   └── api/
│       ├── chat/route.ts       # 对话与检测 POST/GET
│       ├── detection-logs/route.ts  # 日志查询 GET
│       ├── statistics/route.ts      # 统计数据 GET
│       ├── safety/route.ts          # ai配置 CRUD POST/GET
│       ├── strategy/route.ts        # 策略 CRUD POST/GET
│       └── sensitive-words/route.ts # 敏感词 CRUD GET/POST/PUT/DELETE
├── components/
│   ├── sidebar-nav.tsx         # 侧边栏导航
│   └── ui/                     # shadcn/ui 组件
└── lib/
    ├── content-safety.ts       # 核心引擎（敏感词库 + 风险评分算法 + 策略管理）
    ├── ai-safety-detector.ts   # 核心引擎（接入使用通义千问API对用户输入内容进行安全检│                             测，返回结构化的检测结果，包括风险等级、敏感类别和AI的判断理由）
    └── utils.ts                # cn 工具
```

## 构建与测试命令

- 安装依赖: `pnpm install`
- 开发启动: `pnpm dev` (端口 5000)
- 类型检查: `pnpm ts-check`
- Lint: `pnpm lint`
- 构建: `pnpm build`
- 生产启动: `pnpm start`

## 代码风格

- TypeScript strict 模式，禁止隐式 any
- 函数参数必须标注类型
- 使用 `import type` 导入类型
- API Route 中对请求体做类型校验
- 前端页面均为 'use client' 组件

## 核心模块: content-safety.ts

### 敏感词库
- 四级分类: 1=严重, 2=高危, 3=中危, 4=低危
- 10大分类: 恐怖主义、政治敏感、色情暴力、违法信息、危害生命、歧视言论、宗教敏感、隐私侵犯、垃圾信息、不良信息
- 内存存储，初始化时加载默认词库（约30词）

### 风险评分算法
```
最终分 = min(基础分 × 乘数因子 + 上下文调节, 100)
```
- 基础分: 各匹配词分值加权求和（L1×1.5, L2×1.2, L3×1.0, L4×0.7）
- 乘数因子: 1 + 0.3 × (匹配词数 - 1)
- 上下文调节: 高密度+15, 中密度+5, 长文稀释-5

### 策略配置
- 默认阈值: low=20, medium=45, high=70, critical=90
- 默认处置: low=pass, medium=warn, high=block, critical=block
- 支持多策略，仅一个激活

## 注意事项

- 数据为内存存储，服务重启后重置
- 检测日志上限 500 条
- 端口必须为 5000
- 修改 .coze 文件可能导致启动失败
