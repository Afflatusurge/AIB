# Skills & Playbooks — Notion 配置说明 + 首批 Skills 草稿

代码侧已完成升级（导航、列表页、详情页、首页组件）。Skills 内容和 Playbooks 一样从
Notion 的 Playbooks 数据库读取——**同一个库，靠一个新属性区分**。你在 Notion 里加好
属性、贴入条目后，网站会自动出现 Skills 分组，不需要再改代码。

---

## 一、Notion 数据库要加的属性

在 **三个语言的 Playbooks 库**（EN / ZH / JA）里各加这几个属性：

| 属性名 | 类型 | 说明 |
|---|---|---|
| `Kind` | Select | 选项：`Skill`、`Playbook`。不填默认按 Playbook 处理，**现有条目不用动** |
| `Cost` | Text | 例：`$30–95/mo`。列表卡片和详情页速览会显示 |
| `Time to Learn` | Text | 例：`2–3 weeks to first paid deliverable` |
| `Deliverable` | Text | 一句话的产出示例，例：`A 30-second product ad with synced audio` |

`Category` 建议给 Skills 用这三个值（已配好颜色和三语标签）：`Video` / `Writing` / `Agents`。

页面行为：列表页顶部出现 "Skills · 值得投入的能力" 分组（黄底卡片，含成本/上手时间/产出），
下方原有 Playbooks 照旧；详情页 skill 条目的速览栏多出三行字段，标签显示 `Skill · Video` 这类格式。

---

## 二、首批 3 篇 Skills 草稿

以下正文写作于 2026-07-07，基于当时的公开信息。**价格和版本号发布前请再核对一遍**
（这正是我们自己的编辑标准）。EN 和 ZH 可直接贴；JA 建议从 EN 翻译。

---

### Skill 01 · AI Video Production

**Properties**

- Title (EN): `AI video: from prompt to publishable clip`
- Title (ZH): `AI 视频：从 prompt 到能发布的成片`
- Slug: `skill-ai-video-production`
- Kind: `Skill` · Category: `Video`
- Summary (EN): `AI video editing is the fastest-growing freelance skill on Upwork. The workflow: generate raw footage with Veo/Kling/Runway, then shape it into something a client can actually use.`
- Summary (ZH): `AI 视频剪辑是 Upwork 上增速第一的自由职业技能。工作流：用 Veo/Kling/Runway 生成素材，再剪成客户真正能用的成片。`
- Outcome (EN): `Produce short-form product videos and ads solo, at a cost structure agencies can't match.`
- Best For: `Creators, marketers, and freelancers adding a video line to their offer`
- Use When: `You already write decent prompts and want a skill with visible client demand`
- Cost: `$30–95/mo (one mid-tier video model + editing tool; verify current pricing)`
- Time to Learn: `2–3 weeks to first paid deliverable`
- Deliverable: `A 30–60s product video with synced audio, delivered in 3 aspect ratios`

**Body (EN) — 贴入页面正文**

## Why this skill, why now

AI video editing is the fastest-growing AI freelance skill on Upwork by a significant
margin. The demand pattern is specific: clients generate raw footage themselves with
Veo, Kling, or Runway, then pay someone to turn it into something usable. The gap is
not generation — it's judgment: pacing, continuity, sound, and knowing which model to
use for which shot.

## The stack (July 2026)

- **Veo 3.1 (Google Flow)** — strongest cinematic output with native synced audio. Default choice for hero shots.
- **Runway Gen-4.5** — best editing control; the production pick when a client needs revisions, not just generations.
- **Kling 3.0** — best value; storyboard-style flow and character/prop locking reduce drift across shots.
- **Seedance 2.5** — current leader for long-form image-to-video.
- **Avoid building on Sora**: OpenAI discontinued the Sora web/app in April 2026 and retires the API in September 2026.

## The workflow

1. Script and shot list first — one sentence per shot, note which model fits each.
2. Generate hero shots in Veo 3.1; B-roll and variations in Kling 3.0 to control cost.
3. Lock characters and products with reference images (Kling Elements or Runway references).
4. Assemble, cut, and grade in your editor; fix audio; export per platform.
5. Deliver 3 aspect ratios and keep the prompt sheet — it becomes your reusable template.

## What to charge for

Not generation minutes — outcomes. Package as "product video in 5 days" or a monthly
short-form content retainer. Your margin comes from the reusable prompt/shot templates.

**Body (ZH)**

## 为什么是这个技能，为什么是现在

AI 视频剪辑是 Upwork 上增速第一的 AI 自由职业技能，而且需求形态很具体：客户自己用
Veo、Kling、Runway 生成素材，然后付钱请人把素材变成能用的成片。缺口不在生成，
而在判断力：节奏、连贯性、声音，以及知道哪个镜头该用哪个模型。

## 工具栈（2026 年 7 月）

- **Veo 3.1（Google Flow）**——电影感最强，原生同步音频，主镜头首选。
- **Runway Gen-4.5**——剪辑控制最好，客户要改片时的生产级选择。
- **Kling 3.0**——性价比最高，分镜式工作流 + 角色/道具锁定，减少跨镜头漂移。
- **Seedance 2.5**——目前长镜头图生视频的领先者。
- **别再把工作流建在 Sora 上**：网页版已于 2026 年 4 月停服，API 今年 9 月关闭。

## 工作流

1. 先写脚本和分镜表——每个镜头一句话，标注适合的模型。
2. 主镜头用 Veo 3.1，B-roll 和变体用 Kling 3.0 控制成本。
3. 用参考图锁定角色和产品（Kling Elements 或 Runway references）。
4. 进剪辑软件组装、调色、修音频，按平台导出。
5. 交付 3 种画幅比例，留存 prompt 表——它会变成你可复用的模板。

## 怎么收费

不按生成分钟数收，按结果收：打包成"5 天交付一支产品视频"或短视频月度 retainer。
利润来自可复用的 prompt/分镜模板。

---

### Skill 02 · AI Writing System

**Properties**

- Title (EN): `An AI writing system that ships every week`
- Title (ZH): `每周稳定产出的 AI 写作系统`
- Slug: `skill-ai-writing-system`
- Kind: `Skill` · Category: `Writing`
- Summary (EN): `Not "writing with AI" — a pipeline: research → draft → edit → distribute → repurpose, tuned to your voice.`
- Summary (ZH): `不是"用 AI 写文章"，而是一条流水线：选题→初稿→编辑→分发→复用，并且贴合你自己的声音。`
- Outcome (EN): `A weekly publishing cadence you can sustain solo, feeding newsletter, LinkedIn, and long-form at once.`
- Best For: `Consultants, newsletter operators, and founders doing their own marketing`
- Use When: `You keep starting content and stalling after two weeks`
- Cost: `$20–60/mo (one frontier LLM subscription + optional SEO/keyword skill)`
- Time to Learn: `1–2 weeks to a repeatable weekly loop`
- Deliverable: `1 long-form piece + 3 short posts + 1 newsletter, from one research pass`

**Body (EN)**

## The system, not the prompt

Writing is still a top in-demand skill for solopreneurs, but the winners in 2026 run
systems, not prompts. One research pass should feed every format you publish. Skills
sold on marketplaces now bundle exactly this — keyword research, LinkedIn post
copywriting, weekly content-calendar generation — often replacing $200/mo of SaaS
with $30–50 in one-time skill purchases.

## The loop

1. **Research pass (Mon):** collect 5–10 sources on one question; extract claims with dates and links.
2. **Long-form draft:** outline yourself, let the model draft sections, rewrite the openings — voice lives in the first 100 words.
3. **Repurpose:** cut the piece into 3 platform-native short posts (not excerpts — restatements).
4. **Newsletter:** the long-form's "so what" plus links. One editing pass for everything.
5. **Log what worked** and feed engagement data back into next week's topic choice.

## The honesty rule

Every claim keeps its source link through the pipeline. If a draft paragraph has no
verifiable entity in it, cut it — hollow AI prose is the fastest way to lose readers.

**Body (ZH)**

## 系统，而不是 prompt

写作仍是 solopreneur 需求最高的技能之一，但 2026 年跑赢的人靠系统而不是 prompt：
一次调研要喂饱所有发布格式。现在 skill marketplace 上卖得最好的正是这类打包——
关键词研究、LinkedIn 文案、每周内容日历——常见的叙事是用 $30–50 的一次性 skill
替代每月 $200 的 SaaS 订阅。

## 循环

1. **调研（周一）**：围绕一个问题收集 5–10 个来源，提取带日期和链接的事实。
2. **长文初稿**：大纲自己写，让模型填充段落，开头 100 字必须重写——你的声音在那里。
3. **复用**：把长文改写成 3 条平台原生短帖（是重述，不是摘录）。
4. **Newsletter**：长文的"所以呢"+ 链接。所有内容一次编辑过。
5. **记录效果**，把互动数据喂回下周的选题。

## 诚实规则

每个论断的来源链接要跟着内容走完整条流水线。没有可验证实体的段落直接删——
空洞的 AI 文风是最快赶走读者的方式。

---

### Skill 03 · Agent Skill Stack

**Properties**

- Title (EN): `Build your agent skill stack (before your competitors do)`
- Title (ZH): `搭好你的 agent skill 栈（趁对手还没搭）`
- Slug: `skill-agent-skill-stack`
- Kind: `Skill` · Category: `Agents`
- Summary (EN): `The agent skills ecosystem went from one registry to eight marketplaces in six months. Knowing how to evaluate, install, and combine skills is itself a skill.`
- Summary (ZH): `Agent skills 生态半年内从一个 registry 长到八个 marketplace。会评估、安装、组合 skills，本身就是一项技能。`
- Outcome (EN): `Replace a slice of your SaaS bill with a curated, auditable set of agent skills.`
- Best For: `Solo operators already using Claude/agents daily who want compounding leverage`
- Use When: `Your tool subscriptions exceed $100/mo and half of them do one thing`
- Cost: `$0–50 one-time per paid skill; many are free`
- Time to Learn: `A weekend to set up; ongoing curation`
- Deliverable: `A working stack of 5–10 skills covering research, content, and ops`

**Body (EN)**

## What changed

The agent skills ecosystem grew from one registry in December 2025 to eight major
marketplaces by Q2 2026 — skills.sh (Vercel-backed, npm-style), ClaudeSkills.info
(650+ free, community-run), and Agensi (vetted, paid) are the practical trio.
Anthropic's Claude for Small Business now ships with 15 ready-to-run workflows,
which tells you where this is heading: skills are becoming the unit of business
automation.

## How to build the stack

1. List your recurring tasks; mark anything you do weekly that follows the same shape.
2. Browse one free registry and one vetted marketplace — don't try to track all eight.
3. Evaluate before installing: read the skill's instructions like you'd review a contractor's SOW. Trust and curation matter more than feature lists.
4. Install 3 skills, run them on real work for a week, keep what earns its place.
5. Write your own skill for the one workflow no marketplace covers — that's your moat.

## The economics

The pitch that matters for a solo operator: $30–50 in one-time skill purchases can
replace $200/mo in single-purpose SaaS. Audit your subscriptions against what a
skill + a frontier model could do.

**Body (ZH)**

## 变化在哪

Agent skills 生态从 2025 年 12 月的一个 registry 长到 2026 年 Q2 的八个主要
marketplace——实际上值得用的是三个：skills.sh（Vercel 支持，npm 风格）、
ClaudeSkills.info（650+ 免费，社区维护）、Agensi（付费、有审核）。Anthropic 的
Claude for Small Business 内置了 15 个开箱即用的工作流——方向已经很清楚：
skill 正在变成业务自动化的基本单位。

## 怎么搭

1. 列出你的重复性任务，标出每周都在做、形态相同的那些。
2. 只跟一个免费 registry + 一个有审核的 marketplace——别试图追踪全部八个。
3. 装之前先评估：像审外包商的 SOW 一样读 skill 的指令。信任和筛选比功能列表重要。
4. 先装 3 个，用真实工作跑一周，留下真正值回票价的。
5. 给 marketplace 没覆盖的那个工作流自己写一个 skill——那是你的护城河。

## 经济账

对一人公司最有说服力的算法：$30–50 的一次性 skill 采购，可能替代每月 $200 的
单一功能 SaaS。拿这个标准审一遍你的订阅列表。

---

## 三、发布检查清单

- [ ] 三个语言库都加了 `Kind` / `Cost` / `Time to Learn` / `Deliverable` 属性
- [ ] 贴入条目时 `Kind` 选 `Skill`，`Status` 设为可见状态（与现有 Playbooks 一致）
- [ ] 价格、版本号发布前核对一遍（Veo/Kling/Runway 迭代很快）
- [ ] JA 版从 EN 翻译后再上，避免三语内容不同步
