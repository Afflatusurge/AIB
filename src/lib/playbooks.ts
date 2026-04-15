export type Lang = 'en' | 'ja' | 'zh';

type LocalizedString = Record<Lang, string>;

type PlaybookDefinition = {
  slug: string;
  tag: LocalizedString;
  title: LocalizedString;
  dek: LocalizedString;
  outcome: LocalizedString;
  audience: LocalizedString;
  cadence: LocalizedString;
  stackTitle: LocalizedString;
  stack: Array<{
    name: string;
    role: LocalizedString;
  }>;
  stepsTitle: LocalizedString;
  steps: LocalizedString[];
  oldSiteTitle: LocalizedString;
  oldSiteSources: Array<{
    label: string;
    url: string;
  }>;
  notesTitle: LocalizedString;
  notes: LocalizedString[];
  relatedTitle: LocalizedString;
  related: Array<{
    label: LocalizedString;
    href: string;
  }>;
};

export type PlaybookCard = {
  slug: string;
  tag: string;
  title: string;
  dek: string;
  outcome: string;
  audience: string;
  cadence: string;
};

export type PlaybookDetail = PlaybookCard & {
  stackTitle: string;
  stack: Array<{
    name: string;
    role: string;
  }>;
  stepsTitle: string;
  steps: string[];
  oldSiteTitle: string;
  oldSiteSources: Array<{
    label: string;
    url: string;
  }>;
  notesTitle: string;
  notes: string[];
  relatedTitle: string;
  related: Array<{
    label: string;
    href: string;
  }>;
};

const playbookDefinitions: PlaybookDefinition[] = [
  {
    slug: 'build-your-ai-first-website-or-mvp',
    tag: {
      en: 'Playbook 01',
      ja: 'Playbook 01',
      zh: 'Playbook 01',
    },
    title: {
      en: 'Build your AI-first website or MVP',
      ja: 'AIファーストのサイトやMVPをひとりで立ち上げる',
      zh: '一个人把 AI 官网或 MVP 搭起来',
    },
    dek: {
      en: 'A lean stack for getting from idea to landing page, product shell, and first working release without hiring a full team.',
      ja: 'アイデアからランディングページ、プロダクトの外形、最初の公開版までを少人数で進めるための実践スタック。',
      zh: '从想法到 landing page、产品外壳和第一版上线，用最轻的组合把站点和 MVP 做出来。',
    },
    outcome: {
      en: 'Launch a presentable site or first product shell in days, not quarters.',
      ja: '数か月ではなく数日単位で、見せられるサイトや最初のプロダクト外形まで持っていく。',
      zh: '把“先上线一个能看的版本”变成几天级别的动作，而不是几个月。',
    },
    audience: {
      en: 'Founders, indie hackers, consultants, and creators shipping their first product surface.',
      ja: 'ひとり起業家、制作者、コンサル、インディーハッカー向け。',
      zh: '适合独立开发者、咨询顾问、内容创作者和第一次做产品的人。',
    },
    cadence: {
      en: 'Use when you need one clear build stack, not another endless tool list.',
      ja: '延々としたツール一覧ではなく、今すぐ使える一つの構成が欲しいときに。',
      zh: '适合“现在就要一个能落地的组合”，而不是继续看工具大全的时候。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Cursor / Claude Code / Codex',
        role: {
          en: 'Core build loop for planning, code generation, refactors, and fast debugging.',
          ja: '計画、実装、修正、デバッグを回す中核の開発ループ。',
          zh: '作为规划、写代码、改 bug、做重构的核心开发回路。',
        },
      },
      {
        name: 'v0 / Lovable / Bolt',
        role: {
          en: 'Fast front-end scaffolding for screens, landing pages, and first UI direction.',
          ja: '画面設計やランディングページの最初の方向を速く出すための UI 生成層。',
          zh: '快速起界面、landing page 和第一版前端方向的工具层。',
        },
      },
      {
        name: 'Astro / Vercel',
        role: {
          en: 'Simple publishing stack for a content-first product surface with strong performance.',
          ja: 'コンテンツ重視のサイトを軽く公開するための配信基盤。',
          zh: '让内容型产品界面快速上线、同时保持性能和维护成本平衡。',
        },
      },
      {
        name: 'Notion',
        role: {
          en: 'Editorial CMS for reviews, cases, and structured publishing workflows.',
          ja: 'レビューや事例を運用するための軽量 CMS。',
          zh: '作为评测、案例和后续运营内容的轻量 CMS。',
        },
      },
    ],
    stepsTitle: {
      en: 'Working sequence',
      ja: '進め方',
      zh: '执行顺序',
    },
    steps: [
      {
        en: 'Write the product promise first: who it is for, what changes, and what page must ship first.',
        ja: '最初に約束を書く。誰向けか、何が変わるか、最初にどのページを出すべきかを決める。',
        zh: '先写清楚这次产品要解决谁的问题、改变什么、第一版必须上线哪一个页面。',
      },
      {
        en: 'Generate rough UI directions fast, then narrow to one strong layout instead of keeping five mediocre drafts alive.',
        ja: '最初の UI 方向を速く出し、弱い案を何本も持たず、一つの強い構図に絞る。',
        zh: '先快速出几个 UI 方向，但很快收敛成一个强布局，不要同时养五个半成品。',
      },
      {
        en: 'Move into an agentic coding loop for implementation, QA, copy refinement, and deployment.',
        ja: 'その後はエージェント的な開発ループで実装、QA、文言調整、公開まで進める。',
        zh: '然后进入 agentic coding 的回路，把实现、测试、文案调整和部署串起来。',
      },
      {
        en: 'Only after the shell is live, connect CMS, analytics, or richer automation.',
        ja: '外形が出た後に CMS や分析、追加自動化を載せる。',
        zh: '先有一个在线可看的壳子，再接 CMS、分析工具和更复杂的自动化。',
      },
    ],
    oldSiteTitle: {
      en: 'Best source material from the old site',
      ja: '旧サイトから引き継ぐ価値の高い素材',
      zh: '旧站里最值得迁来的原材料',
    },
    oldSiteSources: [
      {
        label: 'Coding Tools',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/tools-and-tech/coding-tools/README.md',
      },
      {
        label: 'Website Development',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/tools-and-tech/coding-tools/website-development.md',
      },
      {
        label: 'Cursor Resources & Cases',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/tools-and-tech/coding-tools/cursor-resources-and-cases.md',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A canonical page for the current solo build stack, updated as tools change.',
        ja: 'いまのソロ開発スタックを代表する基準ページ。',
        zh: '成为“现在一个人做产品应该用什么栈”的代表页。',
      },
      {
        en: 'A bridge that links tool reviews to an actual production workflow.',
        ja: 'ツールレビューを実運用の流れにつなぐ橋渡し。',
        zh: '把工具评测真正串成一条生产流程，而不是一堆孤立文章。',
      },
    ],
    relatedTitle: {
      en: 'Read with it',
      ja: 'あわせて読む',
      zh: '建议搭配阅读',
    },
    related: [
      {
        label: {
          en: 'Tool Reviews',
          ja: 'ツールレビュー',
          zh: '工具评测',
        },
        href: '/tools/',
      },
      {
        label: {
          en: 'Case Studies',
          ja: 'ケーススタディ',
          zh: '案例分析',
        },
        href: '/cases/',
      },
    ],
  },
  {
    slug: 'the-one-person-media-studio',
    tag: {
      en: 'Playbook 02',
      ja: 'Playbook 02',
      zh: 'Playbook 02',
    },
    title: {
      en: 'The one-person media studio',
      ja: 'ひとりで回す AI メディアスタジオ',
      zh: '一个人的 AI 媒体工作室',
    },
    dek: {
      en: 'Turn research, scripts, voice, music, visuals, and publishing into one repeatable system for newsletters, podcasts, or video.',
      ja: 'リサーチ、脚本、音声、音楽、映像、配信を一つの反復可能な流れにまとめる。',
      zh: '把调研、脚本、配音、配乐、视觉和发布串成一条可重复运转的媒体生产线。',
    },
    outcome: {
      en: 'Ship a repeatable content engine instead of producing every asset from scratch.',
      ja: '毎回ゼロから作るのではなく、繰り返せる配信エンジンを持つ。',
      zh: '目标不是做出一条内容，而是把内容生产变成一套持续运转的系统。',
    },
    audience: {
      en: 'Newsletter operators, podcasters, solo media brands, and creators packaging knowledge.',
      ja: 'ニュースレター運営者、ポッドキャスター、個人メディア運営者向け。',
      zh: '适合 newsletter、播客、视频号、个人媒体和知识型创作者。',
    },
    cadence: {
      en: 'Use when content is becoming a business line, not a side task.',
      ja: '発信が副業ではなく事業ラインになってきたときに使う。',
      zh: '适合内容已经不是副业试水，而开始成为业务主线的时候。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'ChatGPT / Claude / Perplexity',
        role: {
          en: 'Research, story framing, episode outlines, and angle selection.',
          ja: 'リサーチ、論点設計、構成づくり。',
          zh: '用于调研、定选题、搭脚本结构和决定叙事角度。',
        },
      },
      {
        name: 'ElevenLabs / voice stack',
        role: {
          en: 'Narration, multilingual voice production, and polished audio delivery.',
          ja: 'ナレーション、多言語音声、仕上げの音声品質。',
          zh: '用于生成旁白、做多语言语音和提升音频成品感。',
        },
      },
      {
        name: 'Suno / Udio / music stack',
        role: {
          en: 'Theme music, sonic identity, and lightweight scoring.',
          ja: 'テーマ音、番組らしさ、軽いスコアリング。',
          zh: '用于片头、氛围音乐和品牌化的声音识别。',
        },
      },
      {
        name: 'Runway / Seedance / image-video stack',
        role: {
          en: 'Visual packaging for short clips, explainers, and distribution assets.',
          ja: '短尺配信用の映像やサムネイルを作る映像層。',
          zh: '用于短视频、解说视频和分发素材的视觉包装。',
        },
      },
    ],
    stepsTitle: {
      en: 'Working sequence',
      ja: '進め方',
      zh: '执行顺序',
    },
    steps: [
      {
        en: 'Start with one editorial format: daily brief, weekly roundup, or one recurring show.',
        ja: '最初に一つのフォーマットを決める。デイリーブリーフ、週次まとめ、定番番組のどれか一つ。',
        zh: '先定一个固定格式，比如 daily brief、weekly roundup 或一个固定栏目，不要一开始什么都做。',
      },
      {
        en: 'Build the research-to-script loop first; production tools only help once the story format is stable.',
        ja: '先に調査から台本までの流れを固める。制作ツールは型が決まってから効く。',
        zh: '先把调研到成稿的主流程稳住，后面的配音和视频工具才会真正提高效率。',
      },
      {
        en: 'Reuse the same story across text, audio, and short-form distribution.',
        ja: '同じ一本をテキスト、音声、短尺配信へ再利用する。',
        zh: '同一个内容母本要能拆成文章、音频和短视频，而不是每个平台重新开始。',
      },
      {
        en: 'Measure which format actually compounds attention, then deepen that desk instead of branching too early.',
        ja: '何が一番伸びるかを見て、早く分岐せず伸びる形式を深くする。',
        zh: '看哪种格式真正积累关注，再加码那个方向，不要太早把精力摊开。',
      },
    ],
    oldSiteTitle: {
      en: 'Best source material from the old site',
      ja: '旧サイトから引き継ぐ価値の高い素材',
      zh: '旧站里最值得迁来的原材料',
    },
    oldSiteSources: [
      {
        label: 'Podcasting',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/by-industry-cases/podcasting/README.md',
      },
      {
        label: 'AI-Generated News Podcasting Cases',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/by-industry-cases/podcasting/ai-generated-news-podcasting-cases.md',
      },
      {
        label: 'Voice Generation Tools',
        url: 'https://github.com/Afflatusurge/aiandbusiness/tree/main/tools-and-tech/voice-generation-tools',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A signature guide for how AIandBusiness itself makes media.',
        ja: 'AIandBusiness 自身の制作方式を代表するシグネチャー記事。',
        zh: '这篇很适合成为 AIandBusiness 自己的“方法论样板”。',
      },
      {
        en: 'A bridge between tool reviews and a real publishing business model.',
        ja: 'ツールレビューを実際の発信ビジネスへ接続するガイド。',
        zh: '把 voice、music、video、brief 真正串成一个媒体业务模型。',
      },
    ],
    relatedTitle: {
      en: 'Read with it',
      ja: 'あわせて読む',
      zh: '建议搭配阅读',
    },
    related: [
      {
        label: {
          en: 'Daily Brief',
          ja: 'デイリーブリーフ',
          zh: '每日简报',
        },
        href: '/daily/',
      },
      {
        label: {
          en: 'Tool Reviews',
          ja: 'ツールレビュー',
          zh: '工具评测',
        },
        href: '/tools/',
      },
    ],
  },
  {
    slug: 'ai-growth-and-distribution-system',
    tag: {
      en: 'Playbook 03',
      ja: 'Playbook 03',
      zh: 'Playbook 03',
    },
    title: {
      en: 'AI growth and distribution system',
      ja: 'AI時代の成長と配信システム',
      zh: 'AI 时代的增长与分发系统',
    },
    dek: {
      en: 'A playbook for getting your work discovered through search, answers, social clips, and repeatable distribution loops.',
      ja: '検索、回答エンジン、SNS 断片、再配信ループをつないで見つかる確率を上げるための設計図。',
      zh: '把搜索、回答引擎、社交媒体和内容复用串起来，让内容更容易被发现。',
    },
    outcome: {
      en: 'Make distribution a repeatable system instead of a burst of manual posting.',
      ja: '配信をその場しのぎではなく反復可能な仕組みに変える。',
      zh: '把“发内容”从零散动作变成一个能重复执行的增长系统。',
    },
    audience: {
      en: 'Writers, creators, solo founders, and product-led operators who need attention without a full marketing team.',
      ja: '専任のマーケチームなしで注意を集めたい個人運営者向け。',
      zh: '适合没有完整市场团队、但又必须持续获取流量的个人运营者。',
    },
    cadence: {
      en: 'Use when publishing is easy but getting found is still fragile.',
      ja: '出すことはできるが、見つけてもらう導線が弱いときに。',
      zh: '适合已经能持续产出，但还没形成稳定流量来源的时候。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Editorial briefs',
        role: {
          en: 'Your base unit for timely topics, signals, and narrative hooks.',
          ja: '時事性のある話題を拾うための基本ユニット。',
          zh: '作为抓热点、定角度和形成叙事钩子的基础单元。',
        },
      },
      {
        name: 'AEO / structured publishing',
        role: {
          en: 'Shape pages so AI answers and search engines can cite and surface them.',
          ja: 'AI の回答面や検索で拾われやすい構造をつくる。',
          zh: '让内容更容易被搜索和 AI answer engine 抓取与引用。',
        },
      },
      {
        name: 'Social repurposing tools',
        role: {
          en: 'Turn one core story into clips, short posts, visuals, and newsletter hooks.',
          ja: '一つの母本から短文、動画断片、ビジュアルへ展開する。',
          zh: '把一篇母内容拆成短帖、短视频、视觉图和 newsletter 入口。',
        },
      },
      {
        name: 'Light analytics',
        role: {
          en: 'Track what gets opened, cited, saved, and clicked before overbuilding a dashboard.',
          ja: '大きなダッシュボードを作る前に、開封・引用・保存・クリックだけを見る。',
          zh: '先看打开、点击、收藏、引用这些关键反馈，再决定是否做复杂分析。',
        },
      },
    ],
    stepsTitle: {
      en: 'Working sequence',
      ja: '進め方',
      zh: '执行顺序',
    },
    steps: [
      {
        en: 'Pick one canonical page for each topic cluster, then let short-form content point back to it.',
        ja: 'テーマごとに基準ページを一つ決め、短尺配信はそこへ戻す。',
        zh: '每个主题都要有一个主页面，其它短内容都回流到这个主页面。',
      },
      {
        en: 'Use daily briefs for freshness, reviews for depth, and playbooks for search-worthy evergreen intent.',
        ja: '鮮度は daily、深さは review、検索意図は playbook が担う。',
        zh: 'daily brief 负责新鲜度，tool reviews 负责深度，playbooks 负责 evergreen 搜索意图。',
      },
      {
        en: 'Repurpose by format, not by copy-pasting the same paragraph everywhere.',
        ja: '同じ文章を貼るのではなく、媒体ごとに形を変えて再利用する。',
        zh: '不要到处复制同一段文字，而是按平台格式重新组织表达。',
      },
      {
        en: 'Keep one light measurement layer so content decisions improve week over week.',
        ja: '軽い計測を残して、翌週の判断材料にする。',
        zh: '保留一层轻量数据反馈，让下一周的选题和分发变得更准。',
      },
    ],
    oldSiteTitle: {
      en: 'Best source material from the old site',
      ja: '旧サイトから引き継ぐ価値の高い素材',
      zh: '旧站里最值得迁来的原材料',
    },
    oldSiteSources: [
      {
        label: 'Marketing',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/by-industry-cases/marketing/README.md',
      },
      {
        label: 'Social Media',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/by-industry-cases/marketing/social-media.md',
      },
      {
        label: 'AEO',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/by-industry-cases/aeo-answer-engine-optimization.md',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A strategy page that explains how the editorial site itself gets discovered.',
        ja: 'このサイト自身がどう見つかるかを説明する戦略ページ。',
        zh: '成为解释“这个站自己如何获得流量”的核心策略页。',
      },
      {
        en: 'A practical bridge between AEO ideas and real distribution operations.',
        ja: 'AEO の概念を実運用へ落とし込む橋渡し。',
        zh: '把 AEO 这类概念真正落到内容分发执行上。',
      },
    ],
    relatedTitle: {
      en: 'Read with it',
      ja: 'あわせて読む',
      zh: '建议搭配阅读',
    },
    related: [
      {
        label: {
          en: 'Daily Brief',
          ja: 'デイリーブリーフ',
          zh: '每日简报',
        },
        href: '/daily/',
      },
      {
        label: {
          en: 'Case Studies',
          ja: 'ケーススタディ',
          zh: '案例分析',
        },
        href: '/cases/',
      },
    ],
  },
  {
    slug: 'the-one-person-office-stack',
    tag: {
      en: 'Playbook 04',
      ja: 'Playbook 04',
      zh: 'Playbook 04',
    },
    title: {
      en: 'The one-person office stack',
      ja: 'ひとり会社のオフィス運営スタック',
      zh: '一个人公司的办公室系统',
    },
    dek: {
      en: 'A tighter operating layer for meetings, slides, notes, research, and lightweight internal systems.',
      ja: '会議、資料、ノート、調査、軽い内部運用を一人で回すための実務レイヤー。',
      zh: '围绕会议、演示、笔记、研究和轻量内部协作，构建一个人也能跑的办公系统。',
    },
    outcome: {
      en: 'Reduce low-leverage admin work so more energy stays on product, audience, and revenue.',
      ja: '低レバレッジな雑務を減らし、商品・読者・収益に時間を戻す。',
      zh: '减少低杠杆的行政和整理工作，把时间还给产品、读者和收入。',
    },
    audience: {
      en: 'Operators who are acting as founder, marketer, analyst, and producer at the same time.',
      ja: '創業者、マーケ担当、分析役、制作担当を一人で兼ねている運営者向け。',
      zh: '适合同时扮演创始人、市场、分析师和制作人的个人经营者。',
    },
    cadence: {
      en: 'Use when the business is growing but your internal operating system still feels improvised.',
      ja: '事業は伸びているのに、内部運用がまだ場当たり的なときに。',
      zh: '适合业务在长，但内部运转方式还很临时、很碎的时候。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'NotebookLM / research layer',
        role: {
          en: 'Turn source material into reusable notes, summaries, and narrative scaffolds.',
          ja: '資料を再利用可能なノートや要約へ変える。',
          zh: '把资料、网页和文档转成可复用的笔记、摘要和结构化理解。',
        },
      },
      {
        name: 'Gamma / deck layer',
        role: {
          en: 'Turn strategy or case material into shareable decks fast.',
          ja: '戦略やケースをすぐ見せられる資料に変える。',
          zh: '把策略、案例或研究结果快速变成可分享的演示文档。',
        },
      },
      {
        name: 'Otter / Granola / Krisp',
        role: {
          en: 'Capture meetings, summaries, and action items without letting calls eat the whole week.',
          ja: '会議を記録し、要点と次アクションを残す。',
          zh: '自动记录会议、抽摘要、列待办，不让沟通把整周时间吃掉。',
        },
      },
      {
        name: 'Notion / lightweight ops layer',
        role: {
          en: 'Keep the operating system visible: editorial calendar, assets, checklists, and recurring work.',
          ja: '編集計画や資産、定常タスクを見える形で持つ。',
          zh: '把选题、资产、清单和周期任务都放在一个可见的系统里。',
        },
      },
    ],
    stepsTitle: {
      en: 'Working sequence',
      ja: '進め方',
      zh: '执行顺序',
    },
    steps: [
      {
        en: 'Treat every recurring task as a candidate for templates, summaries, and pre-structured notes.',
        ja: '繰り返し仕事はすべてテンプレート化候補として見る。',
        zh: '凡是重复发生的工作，都优先考虑模板化、摘要化和结构化记录。',
      },
      {
        en: 'Capture meetings and research once, then let the same material feed slides, content, and follow-up.',
        ja: '会議や調査は一度拾い、資料、記事、次の対応へ横展開する。',
        zh: '会议和研究只整理一次，但要能同时喂给演示、内容和后续执行。',
      },
      {
        en: 'Keep one visible operating dashboard for what ships this week and what compounds over time.',
        ja: '今週出すものと、積み上がる資産を同じ運用面で見える化する。',
        zh: '需要有一个看板，同时看到“这周要交付的”和“长期会积累的”。',
      },
      {
        en: 'Only add automation after the human workflow is stable and obvious.',
        ja: '人間の流れが固まってから自動化を足す。',
        zh: '先把人工流程跑顺，再自动化，不要反过来。',
      },
    ],
    oldSiteTitle: {
      en: 'Best source material from the old site',
      ja: '旧サイトから引き継ぐ価値の高い素材',
      zh: '旧站里最值得迁来的原材料',
    },
    oldSiteSources: [
      {
        label: 'AI in Working',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/by-industry-cases/ai-in-working.md',
      },
      {
        label: 'Data Analysis',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/by-industry-cases/data-analysis/README.md',
      },
      {
        label: 'Education',
        url: 'https://github.com/Afflatusurge/aiandbusiness/blob/main/by-industry-cases/education.md',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A true solo-ops page, not just a list of productivity tools.',
        ja: '単なる生産性ツール一覧ではなく、運用設計のページ。',
        zh: '不是生产力工具清单，而是一篇真正的 solo ops operating manual。',
      },
      {
        en: 'A foundation for future pages like AI analyst, AI CFO, or solo research stack.',
        ja: '今後の AI analyst / AI CFO 系ページの土台になる。',
        zh: '也是后续 `AI analyst`、`AI CFO`、`solo research stack` 这些内容的基础页。',
      },
    ],
    relatedTitle: {
      en: 'Read with it',
      ja: 'あわせて読む',
      zh: '建议搭配阅读',
    },
    related: [
      {
        label: {
          en: 'Tool Reviews',
          ja: 'ツールレビュー',
          zh: '工具评测',
        },
        href: '/tools/',
      },
      {
        label: {
          en: 'Case Studies',
          ja: 'ケーススタディ',
          zh: '案例分析',
        },
        href: '/cases/',
      },
    ],
  },
];

function localizePlaybook(playbook: PlaybookDefinition, lang: Lang): PlaybookDetail {
  return {
    slug: playbook.slug,
    tag: playbook.tag[lang],
    title: playbook.title[lang],
    dek: playbook.dek[lang],
    outcome: playbook.outcome[lang],
    audience: playbook.audience[lang],
    cadence: playbook.cadence[lang],
    stackTitle: playbook.stackTitle[lang],
    stack: playbook.stack.map((item) => ({
      name: item.name,
      role: item.role[lang],
    })),
    stepsTitle: playbook.stepsTitle[lang],
    steps: playbook.steps.map((item) => item[lang]),
    oldSiteTitle: playbook.oldSiteTitle[lang],
    oldSiteSources: playbook.oldSiteSources,
    notesTitle: playbook.notesTitle[lang],
    notes: playbook.notes.map((item) => item[lang]),
    relatedTitle: playbook.relatedTitle[lang],
    related: playbook.related.map((item) => ({
      label: item.label[lang],
      href: item.href,
    })),
  };
}

export function getPlaybooks(lang: Lang): PlaybookCard[] {
  return playbookDefinitions.map((playbook) => {
    const localized = localizePlaybook(playbook, lang);
    return {
      slug: localized.slug,
      tag: localized.tag,
      title: localized.title,
      dek: localized.dek,
      outcome: localized.outcome,
      audience: localized.audience,
      cadence: localized.cadence,
    };
  });
}

export function getPlaybookBySlug(lang: Lang, slug: string): PlaybookDetail | undefined {
  const match = playbookDefinitions.find((playbook) => playbook.slug === slug);
  return match ? localizePlaybook(match, lang) : undefined;
}

export function getAllPlaybookSlugs(): string[] {
  return playbookDefinitions.map((playbook) => playbook.slug);
}
