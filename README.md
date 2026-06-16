# AIChat 类系统的安全内容检测平台

> 基于 Next.js、React 和 TypeScript 实现的 AIChat 内容安全检测系统，支持敏感词检测、AI 语义审核、风险评分、检测日志、统计仪表盘、策略配置和敏感词库管理。

- **仓库地址**：【此处填写 Git 仓库链接，例如：https://gitee.com/你的用户名/AIChat-Safety-Detection】
- **项目类型**：课程设计 / Web 全栈应用
- **小组成员**：谌琪、孙颖、胡曦月
- **主要功能**：对话监测、敏感词检测、AI 检测、日志追踪、统计分析、策略配置、敏感词库管理

---

## 一、项目简介

本项目面向 AIChat 类系统中的内容安全问题，设计并实现了一个轻量级内容安全检测平台。系统可以对用户输入内容进行实时检测，通过“敏感词规则检测 + AI 语义检测 + 风险评分 + 策略处置”的方式，判断输入内容是否存在违规、诈骗、暴力、垃圾广告、隐私泄露等风险。

系统不仅能够输出风险等级和处理动作，还能展示命中敏感词、风险分数、AI 判断理由和融合计算过程，便于管理员进行内容审核、日志追溯和策略调整。

---

## 二、核心功能

| 功能模块 | 功能说明 |
|---|---|
| 对话监测 | 用户输入内容后，系统实时进行内容安全检测，并根据检测结果返回正常回复、警告或拦截提示。 |
| 敏感词检测 | 根据内置敏感词库进行关键词匹配，敏感词包含类别、等级、分值和启用状态。 |
| 风险评分 | 根据敏感词分值、等级权重、命中数量和上下文密度计算风险分数。 |
| AI 检测 | 接入通义千问 API，对用户输入进行语义层面的安全审核。 |
| 融合算法 | 将传统规则检测结果与 AI 检测结果按权重融合，得到最终风险等级。 |
| 检测日志 | 记录每次检测的输入内容、检测结果、时间、来源和命中词。 |
| 统计仪表盘 | 展示总检测量、今日检测量、通过率、拦截率、风险等级分布等统计信息。 |
| 策略配置 | 支持配置不同风险等级的阈值和处置动作，如放行、警告、拦截、人工审核。 |
| 敏感词库管理 | 支持新增、启用、禁用、删除敏感词，并按分类和等级筛选。 |

---

## 三、环境与依赖

### 3.1 运行环境

| 项目 | 版本 / 说明 |
|---|---|
| 操作系统 | Windows 10 / Windows 11 |
| Node.js | 18.17+，推荐 Node.js 20.x |
| 包管理器 | pnpm |
| 前端框架 | Next.js 16 |
| UI 框架 | React 19 |
| 开发语言 | TypeScript |
| 样式方案 | Tailwind CSS |
| AI 接口 | 通义千问 API |

### 3.2 主要依赖

项目依赖以 `package.json` 为准，主要包括：

| 依赖名称 | 作用 |
|---|---|
| next | Next.js 全栈框架，用于页面路由和 API 路由。 |
| react / react-dom | 前端界面构建。 |
| typescript | 类型约束与工程开发。 |
| tailwindcss | 页面样式设计。 |
| lucide-react | 图标库。 |
| recharts | 图表展示，用于统计仪表盘。 |
| zod | 数据校验。 |
| clsx / tailwind-merge | CSS 类名合并工具。 |

---

## 四、配置说明

如果需要启用 AI 检测，需要在项目根目录新建 `.env.local` 文件，并配置通义千问 API Key：

```env
QWEN_API_KEY=你的通义千问API密钥
ENABLE_AI_DETECTION=true
```

> 注意：`.env.local` 文件中可能包含真实密钥，不应提交到 Git 仓库。请确保 `.env.local` 已加入 `.gitignore`。

如果未配置 API Key，系统仍可使用传统敏感词规则检测，但 AI 语义检测和 AI 回复功能将不可用。

---

## 五、快速开始

### 5.1 安装依赖

```bash
pnpm install
```

### 5.2 启动开发服务器

```bash
pnpm dev
```

启动后，在浏览器中访问：

```text
http://localhost:5000
```

### 5.3 构建项目

```bash
pnpm build
```

### 5.4 启动生产环境

```bash
pnpm start
```

---

## 六、项目结构

```text
AIChat-Safety-Detection/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── .gitignore
├── public/
├── scripts/
└── src/
    ├── app/
    │   ├── page.tsx                         # 对话监测与检测日志页面
    │   ├── dashboard/page.tsx                # 统计仪表盘页面
    │   ├── strategy/page.tsx                 # 策略配置页面
    │   ├── words/page.tsx                    # 敏感词库管理页面
    │   ├── layout.tsx                        # 全局布局
    │   ├── globals.css                       # 全局样式
    │   └── api/
    │       ├── chat/route.ts                 # 对话检测接口
    │       ├── detection-logs/route.ts       # 检测日志接口
    │       ├── statistics/route.ts           # 统计数据接口
    │       ├── strategy/route.ts             # 策略配置接口
    │       ├── sensitive-words/route.ts      # 敏感词库接口
    │       └── safety/route.ts               # 安全检测接口
    │
    ├── components/
    │   └── sidebar-nav.tsx                   # 左侧导航栏组件
    │
    └── lib/
        ├── content-safety.ts                 # 内容安全检测核心引擎
        ├── ai-safety-detector.ts             # AI 安全检测模块
        └── utils.ts                          # 工具函数
```

---

## 七、核心检测流程

系统整体检测流程如下：

```text
用户输入内容
    ↓
前端调用 /api/chat 接口
    ↓
后端进行参数校验
    ↓
传统敏感词规则检测
    ↓
AI 语义安全检测
    ↓
规则分数与 AI 分数融合
    ↓
根据策略阈值判断风险等级
    ↓
返回处理动作：pass / warn / block / review
    ↓
前端展示检测结果并记录日志
```

---

## 八、风险评分算法

传统规则检测采用如下评分思路：

```text
基础分 = Σ 敏感词分值 × 等级权重
乘数因子 = 1 + 0.3 × (命中词数量 - 1)
最终分 = 基础分 × 乘数因子 + 上下文调节
```

等级权重如下：

| 敏感词等级 | 含义 | 权重 |
|---|---|---|
| 1级 | 严重违规 | 1.5 |
| 2级 | 高危内容 | 1.2 |
| 3级 | 中危内容 | 1.0 |
| 4级 | 低危内容 | 0.7 |

默认风险阈值如下：

| 风险等级 | 分数范围 | 默认动作 |
|---|---|---|
| safe | 0 - 19 | pass |
| low | 20 - 44 | pass |
| medium | 45 - 69 | warn |
| high | 70 - 89 | block |
| critical | 90 - 100 | block |

---

## 九、AI 检测机制

系统通过 `AISafetyDetector` 模块调用通义千问 API，让大模型对输入内容进行语义审核。AI 检测结果采用 JSON 格式返回，主要字段包括：

| 字段 | 说明 |
|---|---|
| isSafe | 是否安全。 |
| riskLevel | 风险等级，包括 safe、low、medium、high、critical。 |
| confidence | AI 判断置信度。 |
| reasoning | AI 判断理由。 |
| sensitiveCategories | 敏感类别。 |

AI 检测并不直接替代规则检测，而是与规则检测结果进行融合。系统根据 AI 置信度动态调整权重：

```text
最终分 = 传统检测分 × (1 - AI权重) + AI分 × AI权重
```

---

## 十、数据集与测试样例说明

本项目不涉及大规模训练数据集。系统检测所用数据主要包括内置敏感词库和少量测试样例。敏感词库位于 `src/lib/content-safety.ts`，用于规则检测与课程设计功能演示。

由于本项目不使用大规模外部数据集，因此不提交大型数据文件。若需要按照课程模板提交数据样例，可在仓库中保留如下目录：

```text
data/
└── samples/
    └── sample_test_cases.json
```

示例测试样例格式如下：

```json
[
  {
    "id": 1,
    "content": "你好，请介绍一下人工智能",
    "expectedRiskLevel": "safe",
    "expectedAction": "pass",
    "description": "普通安全内容测试"
  },
  {
    "id": 2,
    "content": "这是一条广告推广内容",
    "expectedRiskLevel": "low",
    "expectedAction": "pass",
    "description": "低风险垃圾信息测试"
  },
  {
    "id": 3,
    "content": "网络诈骗相关内容",
    "expectedRiskLevel": "high",
    "expectedAction": "block",
    "description": "高风险违法信息测试"
  },
  {
    "id": 4,
    "content": "炸弹是什么",
    "expectedRiskLevel": "safe_or_low",
    "expectedAction": "pass_or_warn",
    "description": "误判分析样例，用于说明系统对高危词的保守策略"
  }
]
```

建议 `.gitignore` 中加入如下规则，避免提交大型数据文件，仅保留少量测试样例：

```text
data/*
!data/samples/
!data/samples/**
```

---

## 十一、系统不足与改进方向

当前系统仍存在一些不足：

1. **数据存储为内存存储**  
   检测日志、策略配置和敏感词库主要保存在内存中，服务重启后数据会丢失。后续可接入 MySQL、PostgreSQL 或 MongoDB。

2. **关键词匹配方式较基础**  
   当前规则检测主要依赖字符串匹配，对拼音、谐音、拆字、符号插入等变体表达识别不足。后续可加入文本归一化、正则匹配和 AC 自动机。

3. **上下文语义判断仍可能误判**  
   例如用户输入“炸弹是什么”时，该内容更偏向概念解释，但系统可能因出现高危词而判为高风险。后续可加入意图识别，对“是什么、定义、危害、防范”等科普语境降权，对“制作、材料、步骤、购买”等危险操作语境升权。

4. **AI 检测依赖外部 API**  
   AI 检测受网络、调用成本、接口稳定性和 API Key 配置影响，后续可增加本地模型或多模型备选方案。

5. **测试数据规模有限**  
   当前主要以功能测试为主，缺少大规模标注数据集。后续应构建测试集，用准确率、召回率、误杀率和漏检率评估系统效果。

---

## 十二、成员分工

| 成员 | 负责方向 | 具体任务 |
|---|---|---|
| 谌琪 | 核心算法与系统整合 | 负责敏感词分类分级、风险评分算法、AI 检测提示词设计、规则与 AI 融合算法，以及整体检测流程梳理。 |
| 孙颖 | 前端页面与交互设计 | 负责对话监测页面、检测日志页面、统计仪表盘页面、策略配置页面、敏感词库管理页面和风险可视化展示。 |
| 胡曦月 | 后端接口、测试与报告整理 | 负责 API 接口梳理、功能测试、测试用例设计、测试结果记录和课程设计报告整理。 |

---

## 十三、提交说明

提交 Git 仓库时，请不要提交以下文件或目录：

```text
node_modules/
.next/
.env
.env.local
.env.*
dist/
build/
```

建议提交内容包括：

```text
src/
public/
scripts/
README.md
package.json
pnpm-lock.yaml
.gitignore
tsconfig.json
next.config.ts
postcss.config.mjs
eslint.config.mjs
components.json
data/samples/sample_test_cases.json
```

---

## 十四、参考资料

1. Next.js 官方文档
2. React 官方文档
3. TypeScript 官方文档
4. Tailwind CSS 官方文档
5. 通义千问 API 文档
6. 内容安全审核与敏感词过滤相关资料
