# AIandBusiness 新闻摘要系统改造计划

状态：建议进入实施
目标版本：Daily Brief 3.0
建议周期：2–3 周
核心原则：宁可当天少发，也不把低价值厂商内容包装成新闻

## 1. 执行摘要

当前系统已经解决了一部分早期问题：

- 对搜索模型生成的 URL 做存活检查；
- 使用 RSS 作为确定性回退；
- 拒绝明显泛化标题和占位公司；
- 支持 EN / ZH / JA 三语内容；
- 有 `Signal`、`Impact`、`Why it matters`、来源等页面结构。

但当前问题已经从“模型会不会编假新闻”升级为：

> 页面和公司可能都是真的，但内容不一定新、不一定重要、不一定独立，也不一定值得 AIandBusiness 的读者花时间。

现有质量门槛主要判断：

- URL 能否打开；
- 标题里有没有公司名或数字；
- 标题是否与历史内容重复；
- 内容是否符合基本格式。

这些条件无法识别：

- 厂商自我宣传或 SEO 文章；
- 已发布数周、却被错误标记为当天的旧内容；
- 小型未知来源的常规产品发布；
- 没有独立证据支持的营销主张；
- 与独立创业者没有明确决策关系的“新闻”；
- 文字看起来完整，但实际只是把来源摘要扩写成三段话。

因此，本次改造不应继续给 Prompt 打补丁，而应重建为以下流水线：

```text
可信来源采集
  → 候选池
  → 原文提取与日期核验
  → 来源分类与商业利益标记
  → 新闻价值评分
  → 事实卡片
  → 编辑稿
  → 事实与语言质量门槛
  → 审核 / 自动发布
  → 三语翻译
  → 页面与分发
```

## 2. 建议立即确定的产品规则

以下规则建议作为本次重建的默认决定，不再追求“每天必须有六条”。

### 发布数量

- 目标：每天 0–3 条高质量 Daily Signal；
- 上限：每天 5 条；
- 没有合格内容时，允许显示“今日暂无新的高价值信号”；
- 禁止为了满足数量，用低质量文章补位。

### 自动发布

只有同时满足以下条件的内容才允许自动发布：

- 来源位于预先批准的来源注册表；
- 原始发布日期能够从页面或 Feed 明确提取；
- 发布时间在允许窗口内；
- 新闻价值总分达到自动发布阈值；
- 不属于厂商软文、付费内容、联盟营销或未知来源；
- 所有关键数字和实体都能在原文中找到；
- 不存在需要人工判断的冲突或不确定性。

其他内容一律进入 `needs_review`，而不是直接丢弃或直接上线。

### 三语生成

- 先生成一份语言无关的事实卡片；
- 再生成并审核英文主稿；
- 主稿通过后再分别生成中文和日文；
- 对三种语言进行数字、实体、价格和日期一致性检查；
- 不再让模型一次调用同时“研究、写作、翻译、判断影响”。

### 重要产品发布监控

重要模型和头部 AI 产品更新使用独立的 `Release Monitor`，不与普通新闻竞争候选名额。

- 每天运行 4 次，即每 6 小时一次；
- 只监控 Watchlist 中登记的公司、模型、产品和官方来源；
- 新旗舰模型、重要大版本、API 开放、价格变化、弃用和许可证变化属于 P0；
- P0 事件只要通过来源、日期和事实检查，就必须进入 Daily Brief；
- 官方产品事实可以自动发布；
- 官方性能、质量和 Benchmark 结论必须标记为 `vendor_claim`；
- 普通厂商 SEO、案例和促销文章仍然按 `vendor_marketing` 拒绝。

建议将监控任务与每日开放新闻任务分开：

```text
Release Monitor：每天 4 次，保证覆盖 Watchlist 重大更新
Daily Editorial：每天 1 次，筛选商业、政策、研究和其他开放新闻
```

## 3. 当前系统的具体问题

### 3.1 发现阶段存在数量偏差

`openai-brief.ts` 同时告诉模型：

- “Find exactly N stories”；
- “找不到时可以返回更少”。

模型通常会优先满足明确数量，从而扩大搜索范围、降低来源标准。

修改建议：

- 移除 `Find exactly`；
- 改为“最多返回 N 条，只有满足全部条件才返回”；
- 输出每条候选的发现理由、来源类型和发布日期证据；
- 搜索模型只负责发现候选，不负责写摘要或决定发布。

### 3.2 未知发布日期被自动替换成今天

当前发现 Prompt 和规范化函数允许在日期未知时使用当天日期。这会把旧文章伪装成新新闻。

修改建议：

- `published_at` 改为可空，但发布前必须存在；
- 日期无法确定的候选直接进入 `rejected_unknown_date`；
- 分开存储：
  - `source_published_at`
  - `source_updated_at`
  - `discovered_at`
  - `published_at`（本站发布时间）
- 页面同时显示“原文发布”和“本站更新”，不得混用。

### 3.3 RSS 是真实来源回退，但不是质量回退

RSS 能保证 URL 和时间存在，不能保证内容与读者相关。

修改建议：

- 不在 `rss-discover.ts` 中硬编码简单 Feed 数组；
- 建立统一来源注册表；
- 每个 Feed 携带来源等级、来源类型、独立性和允许自动发布规则；
- RSS、官方 API 和搜索发现统一输出同一种 `NewsCandidate`。

### 3.4 URL 存活被错误地等同于来源可信

当前 `verifySourceUrl()` 只能判断页面是否存在。

修改建议：

把来源判断拆成四个维度：

1. `source_reliability`：来源历史可靠度；
2. `source_kind`：官方、研究、媒体、社交、厂商博客；
3. `source_independence`：是否对报道对象存在直接商业利益；
4. `claim_verification`：关键主张是否有独立证据。

示例：

| 来源 | Kind | Reliability | Independent | 自动发布 |
|---|---|---:|---:|---:|
| OpenAI 官方公告 | official_release | A | 否 | 发布产品事实，性能结论带厂商口径标签 |
| Anthropic 研究报告 | primary_research | A | 部分 | 允许，但研究结论必须标注作者立场 |
| Reuters | media | A | 是 | 允许 |
| TechCrunch | media | B | 是 | 达到评分阈值后允许 |
| 未知产品官网 | primary_vendor | C | 否 | 不允许 |
| 产品自己的 SEO 博客 | vendor_marketing | C | 否 | 默认拒绝 |

`official_release` 与 `vendor_marketing` 必须分开：前者是重要模型和产品更新的一手事实来源，后者是没有明确产品事件的推广内容。

### 3.5 编辑模型没有读到完整原文

当前编辑模型只看到搜索阶段输出的短摘要，因此无法可靠地产生：

- 关键证据；
- 反面信息；
- 限制条件；
- 原作者立场；
- 可执行建议。

修改建议：

- 在编辑前抓取完整原文；
- 对超长内容生成带引用片段的研究包；
- 编辑模型只能使用研究包中的事实；
- 所有数字、价格、日期和版本号必须进入 `claims`；
- 如果页面无法提取正文，不进入自动写作。

### 3.6 当前正文格式鼓励扩写而不是编辑

`body_html` 被要求写成 120–220 words、2–4 个段落，很容易形成：

1. 第一段重复新闻；
2. 第二段重复为什么重要；
3. 第三段重复“可能帮助独立开发者”。

修改建议：

Daily Signal 改为结构化字段：

- `what_happened`
- `key_facts`
- `why_it_matters`
- `action_now`
- `watch_next`
- `caveat`
- `source_note`

前端再把这些字段渲染为文章，而不是让模型直接生成一块不可检查的 HTML。

过渡期可以继续生成 `body_html`，但它应由上述结构化字段确定性拼装。

### 3.7 生成后直接发布，缺少候选和审核状态

当前流程通过质量门槛后直接写入 `status: published`。

修改建议：

拆分状态：

```text
discovered
fetched
scored
researched
drafted
needs_review
approved
published
rejected
failed
```

所有失败和拒绝原因都应保留，便于调整来源和阈值。

### 3.8 首页存在内容新鲜度与字段问题

需要同步修复：

- 首页 `Today` 日期不能使用构建时日期；
- 日期应来自最新一期内容或客户端当前日期；
- `/api/briefs` 应返回 `whyItMatters`，与客户端字段一致；
- 首页应该显示来源等级和核实状态；
- 旧的静态内容不应在 API 加载失败时长期伪装成当天内容；
- API 加载失败时显示明确的“最近一期”，而不是“Today”。

## 4. 目标数据模型

### 4.1 新增 `news_candidates`

候选池负责保存发现、研究、评分和拒绝过程，不污染正式文章表。

建议字段：

```sql
id uuid primary key
canonical_url text unique not null
title_raw text not null
source_name text
source_domain text not null
source_kind text not null
source_reliability text not null
source_independent boolean
source_published_at timestamptz
source_updated_at timestamptz
discovered_at timestamptz not null default now()
discovery_method text not null
discovery_source text
raw_summary text
article_text text
article_text_hash text
language text
status text not null
authority_score integer
freshness_score integer
relevance_score integer
actionability_score integer
novelty_score integer
corroboration_score integer
promotion_penalty integer
total_score integer
fact_sheet jsonb
corroborating_sources jsonb
flags jsonb
rejection_reasons jsonb
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

### 4.2 扩展 `briefs`

建议新增：

```sql
candidate_id uuid
content_kind text default 'signal'
editorial_status text
source_kind text
source_reliability text
source_independent boolean
source_published_at timestamptz
source_updated_at timestamptz
verified_at timestamptz
verification_status text
confidence text
quality_score integer
reviewed_by text
reviewed_at timestamptz
editorial_flags jsonb
```

保留当前 `published_at`，但其含义明确为“AIandBusiness 发布时间”。

### 4.3 扩展 `brief_translations`

建议新增：

```sql
what_happened text
key_facts jsonb
action_now text
watch_next text
caveat text
source_note text
body_blocks jsonb
translation_status text
translation_quality_flags jsonb
```

`snippet`、`commentary`、`why_it_matters` 暂时保留，确保现有页面平滑迁移。

## 5. 新的来源注册表

新增：

`src/config/news-sources.ts`

建议结构：

```ts
interface NewsSourcePolicy {
  name: string;
  domains: string[];
  feeds?: string[];
  entities?: string[];
  products?: string[];
  reliability: 'A' | 'B' | 'C' | 'blocked';
  kind:
    | 'official_release'
    | 'primary_vendor'
    | 'primary_research'
    | 'regulator'
    | 'media'
    | 'specialist_media'
    | 'social'
    | 'vendor_marketing';
  independent: boolean;
  allowDiscovery: boolean;
  allowAutoPublish: boolean;
  requiresCorroboration: boolean;
  watchPriority?: 'P0' | 'P1' | 'P2';
  topics?: string[];
}
```

第一版建议收录：

- 主要模型公司的官方新闻和研究 Feed；
- SEC、FTC、欧盟等相关监管来源；
- Reuters、Bloomberg、AP 等高可靠媒体；
- The Verge、Ars Technica、TechCrunch 等专业媒体；
- 可信研究机构和大学实验室；
- 经过人工批准的垂直行业来源。

未知域名：

- 可以进入候选池；
- 默认 `reliability: C`；
- 不允许自动发布；
- 必须有人确认后才能加入注册表。

## 6. 候选评分模型

总分建议为 100 分，并增加负向处罚。

| 维度 | 分值 | 判断 |
|---|---:|---|
| 来源权威性 | 0–25 | 来源等级、原始材料、历史可靠性 |
| 对独立创业者的相关性 | 0–25 | 是否会改变工具、成本、能力或市场决策 |
| 可行动性 | 0–20 | 读者本周是否能采取行动或做出判断 |
| 新鲜度 | 0–15 | 原文真实发布日期 |
| 新颖度 | 0–10 | 是否与近 30 天已有内容重复 |
| 交叉验证 | 0–5 | 是否有独立来源支持 |
| 厂商宣传处罚 | 0 至 -30 | 是否为自我宣传、联盟营销或 SEO 内容 |

建议阈值：

- `>= 80`：符合白名单和事实门槛时可自动发布；
- `65–79`：进入人工审核；
- `< 65`：拒绝；
- 日期未知：直接拒绝；
- `vendor_marketing`：默认拒绝；
- 纯融资新闻如果不会改变目标读者决策：最高只能进入人工审核。

评分过程应以规则为主、模型为辅，避免模型自己给自己的文章打高分。

## 7. 事实卡片设计

编辑前生成结构化 `FactSheet`：

```ts
interface FactSheet {
  event: string;
  actors: string[];
  products: string[];
  sourcePublishedAt: string;
  claims: Array<{
    statement: string;
    evidenceText: string;
    sourceUrl: string;
    type: 'fact' | 'vendor_claim' | 'estimate' | 'opinion';
  }>;
  numbers: Array<{
    value: string;
    meaning: string;
    sourceUrl: string;
  }>;
  businessImpact: string;
  targetReaders: string[];
  possibleActions: string[];
  caveats: string[];
  conflictsOfInterest: string[];
  corroboratingSources: string[];
}
```

硬性规则：

- 稿件中出现的数字必须存在于 `numbers`；
- 标题中的公司、产品和版本必须存在于 `actors/products`；
- `vendor_claim` 不得被改写成已独立证实的事实；
- 没有足够证据时，应明确写“不确定”，而不是补全；
- `businessImpact` 为空时不进入编辑阶段。

## 8. 新的内容模板

Daily Signal 的默认阅读时间控制在 2–3 分钟。

### 页面首屏

- 具体标题；
- 一句话结论；
- 原始来源；
- 原文发布日期；
- 来源类型；
- 核实状态；
- 阅读时间；
- 厂商立场或不确定性标签。

### 正文结构

1. **What happened**：发生了什么；
2. **Key facts**：2–4 个可核查事实；
3. **Why it matters**：对目标读者改变了什么；
4. **What to do**：现在行动、继续观察或可以忽略；
5. **Watch next**：哪个变量会改变结论；
6. **Caveat**：来源立场和未知信息；
7. **Sources**：原始来源和交叉来源。

禁止以下空泛建议：

- “独立开发者应该关注这一领域”；
- “可能提高效率和生产力”；
- “可以节省时间并降低成本”；
- “这表明 AI 生态仍在快速发展”。

除非紧接着说明具体对象、动作、成本和判断条件。

## 9. 建议的代码结构

将当前集中式逻辑拆成可测试模块：

```text
src/config/news-sources.ts

src/lib/news/
  types.ts
  source-policy.ts
  collect-rss.ts
  collect-search.ts
  monitor-releases.ts
  normalize-candidate.ts
  extract-article.ts
  verify-date.ts
  score-candidate.ts
  corroborate.ts
  build-fact-sheet.ts
  write-brief.ts
  translate-brief.ts
  editorial-gate.ts
  publish-brief.ts
  run-pipeline.ts
```

### 在现有技术架构上的部署方式

第一版不需要增加新的独立服务器、消息队列、Redis、向量数据库或无头浏览器。

继续复用：

- Astro：页面、API 和 Cron 入口；
- Vercel：部署和定时任务；
- Supabase：来源、原始条目、候选、正式 Brief 和审核状态；
- OpenAI：事实卡片、编辑和翻译；
- Notion：继续管理 Tool Review、Case Study 和 Playbook，不参与高频新闻状态机。

需要额外增加：

- Supabase migration 目录和数据库迁移；
- `news_sources` 来源与 Watchlist 表；
- `source_entries` 原始 RSS、官方公告和 Changelog 条目表；
- `news_candidates` 或 `news_events` 编辑候选表；
- 一个 `Release Monitor` API；
- 一个通用 HTML 提取依赖，建议使用 `cheerio`，不使用浏览器自动化抓取；
- 来源级 ETag、Last-Modified、内容 Hash 和最后检查时间；
- 运行日志、拒绝原因和幂等键。

建议的 Vercel Cron：

```json
{
  "crons": [
    {
      "path": "/api/cron/releases",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/ingest",
      "schedule": "30 7 * * *"
    }
  ]
}
```

Vercel Cron 使用 UTC。每 6 小时运行可以避免处理夏令时差异，同时保证任何重要发布最多约 6 小时后进入系统。

当前规模下可在一次函数运行中检查约 10–20 个来源，并设置单来源超时。只有当 Watchlist 和普通来源扩大到数百个、一次任务接近函数执行上限时，才需要把采集任务迁移到队列或独立 Worker。

现有文件调整：

### `src/lib/openai-brief.ts`

- 移除“未知日期使用今天”；
- 移除必须达到目标数量的提示；
- 搜索与编辑彻底分开；
- 编辑器输入改为 `FactSheet`；
- 三语生成拆成主稿和翻译阶段；
- 输出结构化字段，不直接依赖 HTML。

### `src/lib/rss-discover.ts`

- Feed 列表迁移到来源注册表；
- 输出 `NewsCandidate`；
- 严格要求发布日期；
- 保留 Feed 原始时间和更新时间；
- 添加单元测试样本。

### `src/lib/brief-quality.ts`

- URL 存活仅作为一个检查项；
- 加入来源政策、日期真实性、推广内容、事实卡片一致性；
- 加入数字与实体一致性检查；
- 将拒绝原因改为稳定错误码，便于统计。

### `src/lib/brief-ingest.ts`

- 不再直接从发现进入发布；
- 先写入 `news_candidates`；
- 保存每个阶段的状态和错误；
- 自动发布和待审核分流；
- 翻译发生在主稿通过之后；
- 支持单候选重试，不必重跑整批。

### `src/pages/api/cron/ingest.ts`

- “没有合格新闻”应返回 200，而不是 500；
- 500 只代表系统失败；
- 返回各阶段计数：
  - discovered
  - fetched
  - rejected_by_source
  - rejected_by_date
  - rejected_by_score
  - drafted
  - needs_review
  - published
- 增加一次运行的 `run_id`。

### `src/pages/api/cron/releases.ts`

- 新增独立端点，每天运行 4 次；
- 只读取 `must_watch = true` 的来源；
- 通过 Feed、官方公告页、Changelog 或 GitHub Releases 获取新条目；
- 使用 ETag、Last-Modified、URL 和内容 Hash 避免重复处理；
- 识别 `new_model`、`major_version`、`availability`、`pricing`、`deprecation`、`api_change`、`license_change`；
- P0 事件绕过普通新闻数量限制，但仍必须通过日期和事实检查；
- 官方事实可以自动发布，厂商性能结论必须带 `vendor_claim`；
- 非 P0 或信息不完整的事件进入 `needs_review`。

### `src/pages/api/briefs.ts`

- 返回完整的 `whyItMatters`；
- 返回来源等级、核实状态和原文日期；
- 明确区分最近一期和当天一期；
- 避免客户端字段名与 API 不一致。

### `src/pages/[lang]/daily/[slug].astro`

- 增加来源和立场标签；
- 展示原始发布日期；
- 展示“现在行动 / 继续观察 / 可以忽略”；
- 展示 Key facts 与 Caveat；
- Sources 支持多个链接；
- 暂时保留现有正文作为兼容回退。

### `src/pages/[lang]/index.astro`

- 移除构建时固定的 Today 日期；
- 使用最新内容日期生成 edition label；
- API 失败时显示“最近一期”；
- 首页卡片显示来源和核实状态；
- 不再使用低质量旧数据长期兜底。

## 10. 审核工作流

### 第一阶段：无管理后台

先使用 Supabase Dashboard 审核 `needs_review`：

- 修改 `editorial_status` 为 `approved` 或 `rejected`；
- 提供一个受保护的发布脚本读取 approved 记录；
- 所有审核动作写入时间和审核人。

这样可以先验证内容流程，不必让管理后台拖慢核心改造。

### 第二阶段：轻量审核页面

后续增加受保护的 `/admin/news`：

- 左侧候选列表；
- 中间原文和事实卡片；
- 右侧三语预览；
- 显示评分和风险标签；
- Approve、Edit、Reject；
- 不允许未登录或只凭前端隐藏访问。

## 11. 旧数据清理方案

不要直接删除旧简报，先进行可恢复清理。

新增审计脚本：

`scripts/audit-existing-briefs.mjs`

检查：

- 来源是否仍可访问；
- 原文真实发布日期；
- 是否为厂商自我推广；
- 标题是否泛化；
- 是否缺少具体公司或产品；
- 为什么重要是否只是模板语；
- 是否重复；
- 三种语言数字是否一致。

处理方式：

- 明显虚构：`status = draft`，标记 `legacy_fabricated`；
- 低价值厂商内容：`status = draft`，标记 `legacy_promotional`；
- 日期错误：修正原文日期；
- 内容尚可但证据不足：`needs_review`；
- 不物理删除，保留回滚能力。

建议优先清理：

- 首页当前可见内容；
- 最近 30 天内容；
- 被搜索引擎收录的内容；
- 标记为 Major 或 Featured 的内容。

## 12. 测试计划

### 单元测试

- RSS 与 Atom 日期解析；
- 缺失日期必须拒绝；
- URL 规范化和去重；
- 来源注册表匹配；
- 未知域名降级；
- 评分边界；
- 推广处罚；
- 标题相似度；
- FactSheet 数字和实体检查；
- EN / ZH / JA 数字一致性。

### 集成测试

- 使用固定网页样本测试正文提取；
- 模拟 Feed 失效和搜索失效；
- 模拟来源 403、404、429 和超时；
- 模拟模型返回缺字段；
- 验证一条候选从 discovered 到 published 的全流程；
- 验证无合格新闻时系统正常完成。

### 回归样本

至少维护三组 Fixture：

1. 应发布：高价值官方发布或权威研究；
2. 需审核：厂商发布但对读者可能有实际影响；
3. 应拒绝：SEO 列表、联盟营销、未知日期、泛化融资和无行动价值内容。

### 页面测试

- 首页日期不会停留在上次部署时间；
- 来源标签在三种语言正确显示；
- API 失败时不把旧数据称为 Today；
- 原文日期与本站日期不混淆；
- 移动端能看到关键事实、行动建议和来源。

## 13. 监控指标

系统质量指标：

- 候选数量；
- 来源等级分布；
- 自动拒绝率；
- 人工审核通过率；
- 每种拒绝原因数量；
- 未知日期拒绝数；
- 厂商内容占比；
- 原始来源占比；
- 重复率；
- 翻译数字不一致率；
- 从发现到发布的延迟；
- Cron 真失败率。

内容效果指标：

- 文章完成阅读率；
- 原始来源点击率；
- `What to do` 点击或后续 Playbook 点击率；
- 保存和分享率；
- 回访率；
- 不同来源等级的表现；
- “现在行动 / 观察 / 忽略”三种建议的分布。

建议的北极星指标：

> 合格 Daily Signal 中，能让读者完成一次明确判断或进入相关 Playbook 的比例。

## 14. 分阶段实施

### Phase 0：止损与修正（1–2 天）

目标：不再继续发布明显低质量内容。

任务：

- 自动发布临时限制为批准来源；
- 将目标数量从 6 改为最多 3；
- 新增每天 4 次的 Release Monitor；
- 建立第一版重要公司、模型和应用 Watchlist；
- 删除未知日期使用今天的逻辑；
- 未知日期直接拒绝；
- 建立第一版来源注册表；
- `/api/briefs` 补齐 `whyItMatters`；
- 修复首页 Today 日期；
- 审计首页和最近 30 天数据；
- 无合格新闻时 Cron 返回成功。

验收：

- 不会把旧文章当作当天新闻；
- 未知或厂商 SEO 博客不会自动发布；
- Watchlist 中的 P0 模型和产品更新不会与普通新闻竞争名额；
- 首页不再显示部署日为 Today；
- 当天零条合格新闻不会触发系统失败。

### Phase 1：候选池与研究层（3–5 天）

目标：把发现与发布彻底分离。

任务：

- 新增 `news_candidates`；
- RSS 和搜索统一输出候选；
- 实现来源政策匹配；
- 实现正文提取和日期核验；
- 实现候选评分；
- 保存拒绝理由和阶段状态；
- 建立 FactSheet；
- 为核心模块增加 Fixture 和单元测试。

验收：

- 每篇稿件能追溯到候选、原文、评分和事实卡片；
- 可以解释一条内容为什么被拒绝；
- 搜索模型失败不影响 RSS 候选；
- 某一候选失败不影响整批运行。

### Phase 2：编辑、审核与页面信任层（3–5 天）

目标：提升文字质量，并把可信度展示给读者。

任务：

- 使用结构化模板写稿；
- 主稿通过后再翻译；
- 实体和数字跨语言检查；
- 加入 `needs_review / approved`；
- 页面展示来源类型、原文日期、核实状态和立场；
- 展示 Key facts、Action now、Watch next、Caveat；
- 兼容现有历史正文。

验收：

- 每篇文章都有具体行动建议或明确“无需行动”；
- 厂商主张不会被写成独立事实；
- 三语数字和实体一致；
- 页面能让读者一眼判断信息来源和可信程度。

### Phase 3：审核体验与运营闭环（3–5 天）

目标：让系统长期可维护。

任务：

- 建立轻量审核页面或可靠的审核脚本；
- 增加运行日志和质量仪表盘；
- 增加来源表现统计；
- 根据审核结果调整来源等级和阈值；
- 将高价值 Signal 连接到 Tool Review、Case Study 和 Playbook；
- 选择优秀 Signal 升级为 Deep Dive。

验收：

- 每日人工审核时间控制在 5–10 分钟；
- 可以按来源和拒绝原因复盘；
- 低质量来源会自动逐步降权；
- Daily Signal 能为深度内容和 Playbook 提供稳定选题。

## 15. 首版完成标准

以下条件全部满足，才视为 Daily Brief 3.0 完成：

- 0 条未知原文日期的内容自动发布；
- 0 条未知域名内容自动发布；
- 0 条纯厂商 SEO/联盟营销内容自动发布；
- 100% 文章有原始来源；
- 100% 文章区分原文日期和本站发布日期；
- 100% 关键数字能回溯到 FactSheet；
- 100% 文章包含具体行动、观察条件或明确“可忽略”；
- 三语实体与数字一致性检查通过；
- 无合格新闻时系统正常结束；
- 首页不会把旧内容显示为 Today；
- 所有拒绝都能查询稳定的原因代码；
- 最近 30 天旧数据完成审计。

## 16. 暂不进入本轮的功能

以下功能有价值，但必须排在新闻可信度改造之后：

- 一页纸；
- 视觉漫画或 Visual Explainer；
- 单篇播客；
- Markdown 导出；
- 会员付费墙；
- 个性化推荐；
- 自动社交媒体分发。

理由：如果母稿和信源不可信，多格式只会更高效地传播低质量内容。

完成 Daily Brief 3.0 后，事实卡片和结构化正文会自然成为一页纸、视觉解读与播客稿的统一母数据。

## 17. 推荐实施顺序

建议下一次开发从 Phase 0 开始，严格按以下顺序：

1. 来源注册表；
2. 日期不允许猜测；
3. 限制自动发布；
4. 修复首页新鲜度；
5. 审计当前线上内容；
6. 候选池；
7. 原文提取与事实卡片；
8. 结构化写作；
9. 审核与三语翻译；
10. 页面信任层；
11. 监控；
12. 多格式内容。

最终希望形成的品牌承诺：

> AIandBusiness 不负责把每天所有 AI 新闻压缩给你；它只保留会改变独立创业者判断和行动的信号，并把证据、边界和下一步一起交代清楚。
