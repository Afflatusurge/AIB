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
  {
    slug: 'the-solo-coding-stack',
    tag: {
      en: 'Playbook 05',
      ja: 'Playbook 05',
      zh: 'Playbook 05',
    },
    title: {
      en: 'The solo coding stack',
      ja: 'ひとり開発の AI コーディングスタック',
      zh: '一个人的 AI 编码工作栈',
    },
    dek: {
      en: 'A practical solo-dev stack that combines editor agents, context protocols, and automation into one repeatable shipping loop.',
      ja: 'エディタ型エージェント、コンテキスト接続、軽い自動化を一つの出荷ループにまとめる実践スタック。',
      zh: '把编辑器型 agent、上下文协议和轻自动化串成一条真正能持续出货的开发回路。',
    },
    outcome: {
      en: 'Work like a small AI-assisted dev team without fragmenting your tools every day.',
      ja: 'ツールを散らかさずに、小さな AI 支援開発チームのように動ける。',
      zh: '不靠来回切换工具，也能像一个小型 AI 辅助开发团队那样工作。',
    },
    audience: {
      en: 'Solo builders shipping products, tools, or content systems without a traditional engineering team.',
      ja: '少人数の開発チームを持たずに、プロダクトやツールや出版面を出している運営者向け。',
      zh: '适合没有完整工程团队、但要持续做产品、工具或内容系统的人。',
    },
    cadence: {
      en: 'Use when coding is no longer the bottleneck, but coordination across tools still is.',
      ja: 'コード自体より、ツール間の行き来と文脈の断絶が遅さの原因になっているときに。',
      zh: '适合代码本身已经不是最慢的环节，反而是工具之间的切换和上下文丢失在拖慢你。',
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
          en: 'Core editor loop for planning, implementation, refactors, debugging, and reviews.',
          ja: '計画、実装、リファクタ、デバッグ、レビューの中心になる主ループ。',
          zh: '作为规划、实现、重构、调试和 review 的核心编辑器回路。',
        },
      },
      {
        name: 'MCP / LlamaIndex',
        role: {
          en: 'Context and tool access layer for connecting repos, docs, files, and external systems.',
          ja: 'repo、docs、ファイル、外部ツールをつなぐ文脈接続層。',
          zh: '把 repo、文档、文件和外部工具连起来的上下文连接层。',
        },
      },
      {
        name: 'n8n / Make / Zapier',
        role: {
          en: 'Automation layer for repetitive coordination around build and publishing work.',
          ja: '開発や公開まわりの繰り返し作業を外へ出す自動化層。',
          zh: '把开发和发布周边重复协调工作挪出去的自动化层。',
        },
      },
      {
        name: 'LangGraph / CrewAI / AutoGen',
        role: {
          en: 'Specialist framework layer when you need role-based agent collaboration.',
          ja: '役割分担のある複数エージェントを組むときのフレームワーク層。',
          zh: '需要角色化 multi-agent 协作时使用的框架层。',
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
        en: 'Choose one primary coding environment and let it become the center of the work.',
        ja: 'まず主力のコーディング環境を一つ決め、その場所に作業を集める。',
        zh: '先选一个主力编码环境，让它成为所有实现工作的中心。',
      },
      {
        en: 'Connect context and tools so you restate less and move faster between repo, shell, and docs.',
        ja: 'repo、shell、docs を行き来しても文脈が切れないように接続する。',
        zh: '把上下文和工具接起来，减少在 repo、shell 和 docs 之间反复解释的成本。',
      },
      {
        en: 'Automate one repeated coordination task only after the manual loop is already stable.',
        ja: '人間の流れが安定してから、繰り返しの調整仕事を一つ自動化する。',
        zh: '在人工流程已经稳定后，再自动化一个重复协调任务。',
      },
      {
        en: 'Review and ship weekly so the stack is judged by output, not novelty.',
        ja: '毎週レビューして出荷し、新しさではなく成果でスタックを判断する。',
        zh: '每周 review 和出货，让这个栈按结果而不是按新鲜感被检验。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A practical description of what a modern one-person AI dev team actually looks like.',
        ja: '現代のひとり開発チームが実際にどう組まれているかを示す実務ページ。',
        zh: '一篇真正解释现代一个人 AI 开发团队长什么样的实务页。',
      },
      {
        en: 'A bridge between tool reviews, agent frameworks, and real shipping cadence.',
        ja: 'ツールレビュー、エージェント枠組み、出荷リズムをつなぐ橋渡し。',
        zh: '把工具评测、agent 框架和真实出货节奏连起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
    ],
  },
  {
    slug: 'ai-as-your-analyst-and-mini-cfo',
    tag: {
      en: 'Playbook 06',
      ja: 'Playbook 06',
      zh: 'Playbook 06',
    },
    title: {
      en: 'AI as your analyst and mini CFO',
      ja: 'AI をアナリスト兼ミニ CFO にする',
      zh: '把 AI 当作你的分析师和迷你 CFO',
    },
    dek: {
      en: 'Use AI to turn spreadsheets, exports, and business signals into weekly operating decisions without pretending you now run a hedge fund.',
      ja: 'スプレッドシート、CSV、業績の数字を、毎週の判断材料へ変えるための軽量な分析スタック。',
      zh: '把表格、CSV、业务信号变成每周判断的输入，而不是假装自己现在要搭一个完整金融研究部门。',
    },
    outcome: {
      en: 'See what changed, what matters, and what to do next using a lightweight analysis stack.',
      ja: '大げさな BI 体制を作らずに、何が起きたか・何が重要か・次に何を変えるかが見える。',
      zh: '更快看清发生了什么、什么重要、下一步该改什么。',
    },
    audience: {
      en: 'Founders and operators who need faster answers from revenue, cost, usage, or audience data.',
      ja: '売上、費用、利用状況、読者データから素早く判断したい運営者向け。',
      zh: '适合需要从收入、成本、使用数据或受众数据中快速提炼判断的创始人和运营者。',
    },
    cadence: {
      en: 'Use when your business has enough data to guide decisions, but not enough time for manual analysis every week.',
      ja: '数字は増えてきたが、毎週の手分析に時間をかけられないときに。',
      zh: '适合业务已经积累了一些数据，但没有时间每周手动做一遍完整分析的时候。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'ChatGPT / Claude / analysis tools',
        role: {
          en: 'Quick analysis layer for turning CSVs and exports into first-pass insights.',
          ja: 'CSV や表を最初の洞察へ変えるクイック分析層。',
          zh: '把 CSV 和导出数据变成第一层洞察的快速分析层。',
        },
      },
      {
        name: 'Julius AI / PandasAI / AskYourDatabase',
        role: {
          en: 'Dedicated analysis layer for deeper exploration, charts, and conversational queries.',
          ja: '深掘り、可視化、対話型分析を進める専用分析層。',
          zh: '更深入探索、做图和做对话式查询的专用分析层。',
        },
      },
      {
        name: 'Perplexity for Finance / FinChat',
        role: {
          en: 'Finance and external research layer for reading outside signals and comparable intelligence.',
          ja: '外部の金融シグナルや比較情報を読む金融・市場補助層。',
          zh: '读取外部金融信号和可比情报的金融与外部研究层。',
        },
      },
      {
        name: 'Tableau / Databricks',
        role: {
          en: 'Enterprise-scale BI layer when the business actually needs it.',
          ja: '本当に必要になったときの大規模 BI 層。',
          zh: '真正需要时才上的企业级 BI 层。',
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
        en: 'Start with the smallest dataset that can change a decision this week.',
        ja: '今週の判断を変えられる最小のデータから始める。',
        zh: '先从这周就能改变决策的最小数据集开始。',
      },
      {
        en: 'Set the privacy boundary before choosing analysis tooling.',
        ja: '分析ツールを選ぶ前に、機密データの境界を決める。',
        zh: '在选分析工具前，先划定隐私和敏感数据边界。',
      },
      {
        en: 'Use analysis to produce 1 to 3 specific decisions, not just cleaner charts.',
        ja: 'きれいなグラフより、1〜3 個の具体的な判断を出すことを優先する。',
        zh: '让分析最终落到 1 到 3 个具体决策上，而不只是更漂亮的图表。',
      },
      {
        en: 'Keep a reusable decision trail so patterns can be compared over time.',
        ja: '判断の履歴を残し、時間とともに比較できるようにする。',
        zh: '保留可复用的决策记录，方便跨周比较模式变化。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A practical guide to turning AI into business judgment, not just dashboards.',
        ja: 'ダッシュボードではなく、事業判断につながる分析ガイド。',
        zh: '一篇真正帮助经营判断，而不只是做 dashboard 的分析页。',
      },
      {
        en: 'A base for future pages like solo research stack, operator memo system, or AI pricing review.',
        ja: '今後の solo research stack や pricing review 系ページの土台になる。',
        zh: '也是未来 `solo research stack`、`pricing review` 一类页面的基础。',
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
          en: 'Case Studies',
          ja: 'ケーススタディ',
          zh: '案例分析',
        },
        href: '/cases/',
      },
      {
        label: {
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
    ],
  },
  {
    slug: 'the-ai-growth-stack-for-a-newsletter-business',
    tag: {
      en: 'Playbook 07',
      ja: 'Playbook 07',
      zh: 'Playbook 07',
    },
    title: {
      en: 'The AI growth stack for a newsletter business',
      ja: 'ニュースレター事業のための AI 成長スタック',
      zh: 'Newsletter 业务的 AI 增长栈',
    },
    dek: {
      en: 'A practical growth stack for turning one strong newsletter issue into search depth, answer-engine visibility, and repeat attention.',
      ja: '一本の良いニュースレター号を、検索流入、回答面での可視性、再訪へつなげるための実践スタック。',
      zh: '把一封强 newsletter 拆成搜索深度、答案引擎可见性和持续回访的实际增长栈。',
    },
    outcome: {
      en: 'Make newsletter growth less dependent on one channel and more dependent on a repeatable owned-media system.',
      ja: 'ニュースレターの成長を単一チャネル依存ではなく、反復可能な owned media の仕組みに変える。',
      zh: '让 newsletter 增长少依赖单一渠道，更多依赖一套可重复的自有媒体系统。',
    },
    audience: {
      en: 'Writers, operators, and solo media builders treating a newsletter as a real business line.',
      ja: 'ニュースレターを本業の一部として育てたい書き手や個人メディア運営者向け。',
      zh: '适合把 newsletter 当成真正业务线来做的写作者、运营者和个人媒体建设者。',
    },
    cadence: {
      en: 'Use when publishing is steady, but growth still depends too much on platform luck or one-off spikes.',
      ja: '配信は続いているのに、成長がプラットフォーム運や単発ヒットに左右されすぎるときに。',
      zh: '适合已经在稳定发刊，但增长仍然过度依赖平台运气或一次性爆发的时候。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Newsletter issue as canonical asset',
        role: {
          en: 'Treat the issue itself as the core asset that other surfaces point back to.',
          ja: 'ニュースレター号そのものを、他の面が戻ってくる基準資産として扱う。',
          zh: '把每一期 newsletter 本身当作其它表面都要回流的核心资产。',
        },
      },
      {
        name: 'AEO / structured publishing',
        role: {
          en: 'Make the best issues quotable, extractable, and retrievable in answer interfaces.',
          ja: '強い号を、回答面で引用・抽出・再利用されやすい形にする。',
          zh: '让最强的 newsletter 内容更容易被答案引擎提取、引用和检索。',
        },
      },
      {
        name: 'Social repurposing tools',
        role: {
          en: 'Turn one issue into hooks, clips, visuals, and short posts that route attention back.',
          ja: '一本の号を、フック、短文、ビジュアル、短尺へ変え、注意を戻す。',
          zh: '把一期内容拆成 hook、短帖、视觉卡片和短内容，把注意力带回来。',
        },
      },
      {
        name: 'Light analytics',
        role: {
          en: 'Track opens, saves, revisits, replies, and off-platform conversion without overbuilding BI.',
          ja: '大げさな BI を作らずに、開封、保存、再訪、返信、外部面からの移動を追う。',
          zh: '不做过重 BI，也能看开封、收藏、回访、回复和站外回流。',
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
        en: 'Choose one issue format and make it recognisable before optimizing distribution.',
        ja: 'まずは一つの号の型を決め、配信最適化より先に覚えてもらえる形式にする。',
        zh: '先把一期内容格式做成可识别的，再去优化分发。',
      },
      {
        en: 'Turn the strongest issues into deeper canonical pages that can rank, be cited, and be revisited.',
        ja: '強い号は、検索、引用、再訪に耐える基準ページへ育てる。',
        zh: '把最强的几期内容扩成可被搜索、引用和回访的 canonical 页面。',
      },
      {
        en: 'Repurpose each issue into multiple formats with different jobs, not duplicate posts everywhere.',
        ja: '各号を、同じ文章の複製ではなく、役割の違う複数面へ変換する。',
        zh: '每一期都要拆成不同职责的多个格式，而不是到处复制同一段话。',
      },
      {
        en: 'Review which issue patterns compound subscriber trust and repeat attention.',
        ja: 'どの号の型が信頼と再訪を積み上げるかを見直す。',
        zh: '复盘哪种内容结构真正能积累订阅者信任和回访。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A real operating guide for how a newsletter grows after the first few good issues.',
        ja: '数本の良い号の先で、ニュースレターをどう伸ばすかを示す実務ガイド。',
        zh: '一篇真正解释 newsletter 在前几期之后怎么继续长的运营指南。',
      },
      {
        en: 'A bridge between editorial craft, discoverability, and owned-media conversion.',
        ja: '編集力、見つかりやすさ、owned media への転換をつなぐページ。',
        zh: '把编辑能力、被发现的能力和自有媒体转化串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
    ],
  },
  {
    slug: 'the-solo-research-stack',
    tag: {
      en: 'Playbook 08',
      ja: 'Playbook 08',
      zh: 'Playbook 08',
    },
    title: {
      en: 'The solo research stack',
      ja: 'ひとりで回すリサーチスタック',
      zh: '一个人的研究工作栈',
    },
    dek: {
      en: 'A practical research stack for finding, filtering, synthesizing, and storing useful knowledge without drowning in tabs.',
      ja: 'タブ地獄に陥らず、探す・絞る・まとめる・残すを一人で回すための実践スタック。',
      zh: '一套真正能让一个人完成搜索、筛选、综合和沉淀，而不是淹没在标签页里的研究工作栈。',
    },
    outcome: {
      en: 'Turn scattered reading into reusable insight and faster decisions.',
      ja: '散らばった読み物を、再利用できる洞察と速い判断へ変える。',
      zh: '把零散阅读变成可复用洞察和更快的判断。',
    },
    audience: {
      en: 'Writers, strategists, founders, and operators who need better research without a dedicated analyst team.',
      ja: '専任リサーチャーなしで、より良い調査を回したい書き手、戦略担当、創業者向け。',
      zh: '适合没有专职研究团队，但又需要高质量研究输入的写作者、策略人和创始人。',
    },
    cadence: {
      en: 'Use when you are collecting more information than you are actually turning into reusable understanding.',
      ja: '情報収集の量に対して、再利用できる理解へ変えられていないときに。',
      zh: '适合你收集的信息越来越多，但真正沉淀成可复用理解的部分太少的时候。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Perplexity / deep research layer',
        role: {
          en: 'Fast source gathering, comparison, and first-pass synthesis.',
          ja: '情報源の収集、比較、第一段階の要約を速く進める。',
          zh: '快速完成资料搜集、对比和第一层综合。',
        },
      },
      {
        name: 'NotebookLM / source memory layer',
        role: {
          en: 'Turn documents, notes, and links into reusable context and summaries.',
          ja: '資料、ノート、リンクを、再利用できる文脈と要約へ変える。',
          zh: '把文档、笔记和链接变成可复用的上下文和总结。',
        },
      },
      {
        name: 'Afforai / ResearchRabbit / scholar tools',
        role: {
          en: 'Support paper-heavy or citation-heavy workflows when you need stronger source management.',
          ja: '論文や引用の多い領域で、情報源管理を強める。',
          zh: '在论文型、引用型研究中补强来源管理。',
        },
      },
      {
        name: 'Notion / memo layer',
        role: {
          en: 'Store conclusions, comparisons, quotes, and next questions in a reusable system.',
          ja: '結論、比較、引用、次の問いを再利用可能な形で残す。',
          zh: '把结论、对比、引用和下一步问题沉淀进可复用系统。',
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
        en: 'Start with a narrow question instead of a broad topic.',
        ja: '広いテーマではなく、狭い問いから始める。',
        zh: '先从一个窄问题开始，而不是从一个大主题开始。',
      },
      {
        en: 'Gather sources fast, then cut aggressively before synthesis.',
        ja: 'まず広く集め、その後で強く絞ってから要約に入る。',
        zh: '先快速收集，再大幅筛掉一批，再进入综合。',
      },
      {
        en: 'Turn the best material into notes, comparisons, and reusable summaries.',
        ja: '良い素材を、ノート、比較、再利用可能な要約へ変える。',
        zh: '把最有价值的材料转成笔记、对比和可复用摘要。',
      },
      {
        en: 'End every research session with a conclusion and the next question.',
        ja: 'リサーチは、結論と次の問いで終える。',
        zh: '每次研究都要以一个结论和下一个问题收尾。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A practical guide to doing high-quality solo research without overcomplicating the toolchain.',
        ja: 'ツールを複雑にしすぎず、高品質な個人リサーチを進めるためのガイド。',
        zh: '一篇真正解释如何不把工具链搞复杂，也能做高质量个人研究的指南。',
      },
      {
        en: 'A base for future pages like deep research workflow, source verification, and operator memo systems.',
        ja: 'deep research workflow や source verification 系ページの基盤になる。',
        zh: '也能成为以后 `deep research workflow`、`source verification` 一类页面的基础。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
      {
        label: {
          en: 'Daily Brief',
          ja: 'デイリーブリーフ',
          zh: '每日简报',
        },
        href: '/daily/',
      },
    ],
  },
  {
    slug: 'how-to-productize-a-course-business-with-ai',
    tag: {
      en: 'Playbook 09',
      ja: 'Playbook 09',
      zh: 'Playbook 09',
    },
    title: {
      en: 'How to productize a course business with AI',
      ja: 'AI で講座ビジネスをプロダクト化する',
      zh: '用 AI 把课程业务产品化',
    },
    dek: {
      en: 'A practical stack for turning expertise into a repeatable AI-assisted course business without building a full education company.',
      ja: '知識や実務経験を、ひとりで回せる AI 支援型の講座ビジネスへ変えるための実践スタック。',
      zh: '一套适合个人创作者和专家的课程业务工作栈，把知识变成可反复销售、可持续迭代的产品。',
    },
    outcome: {
      en: 'Launch a course offer, ship core lessons faster, and reuse each lesson across email, video, and community assets.',
      ja: '講座の価値提案を固め、主要レッスンをすばやく形にし、メールや動画やコミュニティにも再利用できる。',
      zh: '更快做出课程承诺、核心课程资产和配套分发素材，把一对一经验沉淀成可扩展收入。',
    },
    audience: {
      en: 'Educators, experts, coaches, newsletter operators, and creators packaging know-how into a paid learning product.',
      ja: '教育者、専門家、コーチ、ニュースレター運営者、知識を有料商品化したい制作者。',
      zh: '适合教育者、顾问、教练、newsletter 作者，以及想把知识打包成付费产品的人。',
    },
    cadence: {
      en: 'Use when your audience already trusts your knowledge and the bottleneck is turning that knowledge into a structured offer.',
      ja: 'すでに知見や読者の信頼はあるが、それを構造化された講座商品に変える部分が詰まっているとき。',
      zh: '适合你已经有内容积累或读者信任，但还没有把这些知识真正组织成课程产品的时候。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'ChatGPT / Claude / NotebookLM',
        role: {
          en: 'Audience research, objection mapping, and turning messy expertise into a clearer teaching arc.',
          ja: '受講者の悩み整理や、雑多な知識を教えやすい流れへ整える。',
          zh: '用来做用户调研、梳理异议，并把零散知识整理成更适合教学的结构。',
        },
      },
      {
        name: 'Notion',
        role: {
          en: 'Curriculum map, lesson planning, worksheets, and publishing workflow memory.',
          ja: 'カリキュラム設計、レッスン計画、ワークシート、運用メモの基盤。',
          zh: '作为课程地图、lesson 规划、工作表和运营流程的底层空间。',
        },
      },
      {
        name: 'Gamma / ElevenLabs / Descript',
        role: {
          en: 'Turn lessons into slides, narration, polished recordings, and reusable derivative assets.',
          ja: 'スライド、ナレーション、録画編集、派生素材づくりを加速する。',
          zh: '把课程变成 slide、配音、录屏和更多可复用的派生资产。',
        },
      },
      {
        name: 'Website + newsletter stack',
        role: {
          en: 'Landing page, onboarding, distribution, and audience feedback loop.',
          ja: '販売ページ、オンボーディング、配信、読者反応の回収を担う。',
          zh: '承接课程页、开营邮件、分发和反馈回流。',
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
        en: 'Define the transformation first, before writing the full curriculum.',
        ja: 'まずカリキュラム全体ではなく、受講後に何が変わるかを定義する。',
        zh: '先定义学习后会发生什么变化，再去写完整课程。',
      },
      {
        en: 'Turn existing notes, posts, and client questions into one module map and one flagship lesson.',
        ja: '既存のノート、投稿、相談内容を、モジュール構成と代表レッスンへ変える。',
        zh: '把既有笔记、文章和客户问题，整理成一个模块地图和一节代表课。',
      },
      {
        en: 'Produce each lesson once, then repurpose it into email, clips, worksheets, and community prompts.',
        ja: '各レッスンを一度しっかり作り、それをメール、短尺、ワーク、コミュニティ投稿へ展開する。',
        zh: '每节课认真做一次，然后把它拆成邮件、短视频、工作表和社群提示。',
      },
      {
        en: 'Keep improving the course through objections, student questions, and proof-of-work content.',
        ja: '反論、受講者の質問、公開コンテンツを通じて講座を更新していく。',
        zh: '用用户异议、学员问题和公开内容持续迭代课程。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for experts who want leverage beyond one-to-one delivery without building a large course operation.',
        ja: '大きな教育組織を作らずに、1対1を超えるレバレッジを得たい人のためのガイド。',
        zh: '成为一篇写给知识型创作者的指南：不做大公司，也能把一对一经验变成可扩展收入。',
      },
      {
        en: 'A bridge between media creation, knowledge packaging, and small-product revenue.',
        ja: '発信、知識の整理、そして小さな収益商品をつなぐ橋になる。',
        zh: '把内容生产、知识包装和小产品收入真正串起来。',
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
          en: 'Case Studies',
          ja: 'ケーススタディ',
          zh: '案例分析',
        },
        href: '/cases/',
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
    slug: 'how-to-run-a-multilingual-content-site-with-ai',
    tag: {
      en: 'Playbook 10',
      ja: 'Playbook 10',
      zh: 'Playbook 10',
    },
    title: {
      en: 'How to run a multilingual content site with AI',
      ja: 'AI で多言語コンテンツサイトを運営する',
      zh: '用 AI 运营多语言内容网站',
    },
    dek: {
      en: 'An operating stack for publishing in English, Japanese, and Chinese without turning translation and maintenance into a full-time job.',
      ja: '英語・日本語・中国語の公開を、翻訳と保守に追われずひとりで回すための運用スタック。',
      zh: '一套适合英日中三语发布的内容运转栈，不让翻译和维护变成全职工作。',
    },
    outcome: {
      en: 'Build one editorial system that can publish, translate, and maintain a multilingual site with a solo-sized workflow.',
      ja: 'ひとつの編集システムで、多言語サイトの執筆・翻訳・公開・保守を回せるようにする。',
      zh: '建立一个统一的编辑系统，让多语言网站的写作、翻译、发布和维护都能由小团队甚至一个人完成。',
    },
    audience: {
      en: 'Newsletter operators, media builders, educators, and niche publishers who want to expand reach across languages.',
      ja: 'ニュースレター運営者、メディアビルダー、教育者、複数言語へ広げたいニッチ出版社。',
      zh: '适合 newsletter 运营者、内容网站创作者、教育产品作者和想跨语言扩张的垂直媒体。',
    },
    cadence: {
      en: 'Use when your bottleneck is no longer writing one good page, but keeping multiple language surfaces aligned and useful.',
      ja: '良いページを1本書くことより、複数言語の面を揃えて保つことが課題になってきたとき。',
      zh: '当你的瓶颈已经不是写出一篇好内容，而是如何让多语言页面保持同步、有用和可维护。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Notion',
        role: {
          en: 'Canonical source of truth with shared structure across languages and desks.',
          ja: '各言語と各デスクで共通構造を保つ原本データベース。',
          zh: '作为统一原始源，保证多语言和多 desk 之间结构一致。',
        },
      },
      {
        name: 'GPT / Claude translation loop',
        role: {
          en: 'Fast first-pass localization that preserves structure before human review.',
          ja: '人の確認前に、構造を保った一次翻訳を速く作る。',
          zh: '先快速做出保留结构的第一版翻译，再交给人工轻审。',
        },
      },
      {
        name: 'Astro i18n + Vercel',
        role: {
          en: 'Clean routes, language switching, and a stable publishing layer.',
          ja: '明快なルーティング、言語切替、安定した公開基盤。',
          zh: '承接清晰的多语言路由、切换和稳定发布。',
        },
      },
      {
        name: 'Review checklist',
        role: {
          en: 'Protect hero copy, titles, and flagship pages from awkward or trust-breaking phrasing.',
          ja: 'ヒーローコピー、タイトル、主力ページの不自然さを防ぐ。',
          zh: '保护 hero 文案、标题和核心页面不被生硬翻译毁掉信任感。',
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
        en: 'Choose one source language and keep every key property structured.',
        ja: '主言語を一つ決め、各ページの重要プロパティを構造化して持つ。',
        zh: '先固定一个源语言，并把每个页面的重要字段结构化。',
      },
      {
        en: 'Generate first-pass translations into the other languages as part of the publishing flow.',
        ja: '公開フローの一部として、他言語へ一次翻訳を流す。',
        zh: '把另外两种语言的初稿翻译，直接嵌入发布流程里。',
      },
      {
        en: 'Review homepage-facing, trust-sensitive, and conversion-sensitive pages by hand.',
        ja: 'トップページ、信頼感、コンバージョンに効くページは人が確認する。',
        zh: '首页级、信任度敏感和转化敏感的页面要人工过一遍。',
      },
      {
        en: 'Redeploy in batches so language versions stay aligned over time.',
        ja: '版ズレを防ぐため、言語版はまとめて再デプロイする。',
        zh: '用批量 redeploy 保持语言版本长期同步。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A practical operating guide for global reach without building a multilingual editorial team.',
        ja: '多言語編集チームを作らずに到達範囲を広げるための実践ガイド。',
        zh: '成为一篇真正解释如何在不组建多语言编辑部的前提下扩大全球触达的指南。',
      },
      {
        en: 'A companion page to the site’s own multilingual publishing system and CMS model.',
        ja: 'このサイト自身の多言語運用モデルとつながる伴走ページ。',
        zh: '也能成为这个站自己多语言运营模型的对外说明页和方法页。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
      {
        label: {
          en: 'Daily Brief',
          ja: 'デイリーブリーフ',
          zh: '每日简报',
        },
        href: '/daily/',
      },
    ],
  },
  {
    slug: 'the-ai-workflow-for-a-client-services-business',
    tag: {
      en: 'Playbook 11',
      ja: 'Playbook 11',
      zh: 'Playbook 11',
    },
    title: {
      en: 'The AI workflow for a client-services business',
      ja: 'ひとりのクライアントサービス事業を AI で回す',
      zh: '用 AI 跑一个人的客户服务型业务',
    },
    dek: {
      en: 'A practical operating stack for running proposals, delivery, communication, and handoff with solo-sized leverage.',
      ja: '提案、進行、納品、クライアント対応を、ひとり規模のまま再現可能にするための運用スタック。',
      zh: '一套适合个人咨询、代理和项目制服务的运转栈，把提案、交付和客户沟通变成可复用系统。',
    },
    outcome: {
      en: 'Deliver client work faster, scope projects more clearly, and turn every project into reusable operating assets.',
      ja: '提案を速く出し、スコープを明確にし、納品とコミュニケーションをより安定して回せる。',
      zh: '更快完成提案、更清晰地界定 scope，并让交付和客户体验都更稳定。',
    },
    audience: {
      en: 'Agencies of one, consultants, freelancers, and small service businesses selling project-based or retainer work.',
      ja: 'ひとりエージェンシー、コンサルタント、フリーランス、少人数の受託ビジネス。',
      zh: '适合一人 agency、顾问、自由职业者以及小型项目制服务业务。',
    },
    cadence: {
      en: 'Use when doing the work is no longer the bottleneck, but packaging, managing, and repeating delivery without burning out is.',
      ja: '作業そのものより、提案、進行管理、納品、再利用の仕組みがボトルネックになってきたとき。',
      zh: '当你的瓶颈已经不是做事本身，而是提案、管理、交付和复用无法形成系统。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'ChatGPT / Claude + meeting capture',
        role: {
          en: 'Turn discovery calls and client reviews into reusable briefs and clearer project diagnosis.',
          ja: 'ヒアリングやレビュー会議を、再利用できる案件ブリーフへ変える。',
          zh: '把 discovery call 和 review meeting 变成可复用的项目 brief。',
        },
      },
      {
        name: 'Notion',
        role: {
          en: 'Hold proposal modules, scope assumptions, delivery checklists, and follow-up templates.',
          ja: '提案モジュール、前提条件、納品チェック、フォローアップを一か所で持つ。',
          zh: '承接 proposal 模块、scope 假设、交付清单和 follow-up 模板。',
        },
      },
      {
        name: 'Production stack + AI copilot',
        role: {
          en: 'Speed up drafts, revisions, QA, and the communication layer around delivery.',
          ja: 'ドラフト、修正、QA、進捗共有など納品まわりの速度を上げる。',
          zh: '加速 draft、revision、QA 和围绕交付的沟通层。',
        },
      },
      {
        name: 'Email / CRM light system',
        role: {
          en: 'Keep progress updates, retainers, referrals, and next-step follow-up consistent.',
          ja: '進捗更新、継続提案、紹介導線、次の打ち手を安定して回す。',
          zh: '让进度更新、retainer 提案、推荐和后续动作更稳定。',
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
        en: 'Turn every intake or review call into a project brief with problem, urgency, success metric, and likely objections.',
        ja: 'ヒアリングやレビュー会議を、課題、緊急度、成功指標、想定反論を含む brief に変える。',
        zh: '把每次 intake 或 review call 都转成项目 brief，写清问题、紧迫度、成功标准和潜在异议。',
      },
      {
        en: 'Build proposals from reusable modules instead of rewriting structure from scratch.',
        ja: '提案書は毎回ゼロから書かず、再利用できるモジュールで組み立てる。',
        zh: 'proposal 不要每次从零写，而是用可复用模块快速重组。',
      },
      {
        en: 'Keep a reliable communication rhythm during delivery so clients experience clarity before they experience delay.',
        ja: '納品中は、遅れより先に明確さを感じてもらえるよう、一定の連絡 cadence を守る。',
        zh: '交付期保持稳定沟通节奏，让客户先感受到清晰度，而不是延迟。',
      },
      {
        en: 'End every project by capturing strong phrasing, scope lessons, and case-study material.',
        ja: '案件ごとに、使えた言い回し、scope の学び、事例素材を残して終える。',
        zh: '每个项目结束时，都把高质量话术、scope 经验和案例素材留下来。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for solo operators who want stronger delivery systems without immediately building an agency team.',
        ja: 'すぐに人を増やさず、より強い受託運用を作りたい人のためのガイド。',
        zh: '成为一篇写给个人服务提供者的指南：先把系统做强，再谈扩团队。',
      },
      {
        en: 'A bridge between execution-heavy client work and a more repeatable operating model.',
        ja: '実行中心の受託を、再利用可能な運用モデルへ変える橋渡しになる。',
        zh: '把高度依赖个人执行的 client work，慢慢变成可复用 operating model。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
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
    slug: 'how-to-run-a-solo-advisory-business-with-ai',
    tag: {
      en: 'Playbook 12',
      ja: 'Playbook 12',
      zh: 'Playbook 12',
    },
    title: {
      en: 'How to run a solo advisory business with AI',
      ja: 'AI でひとりのアドバイザリービジネスを回す',
      zh: '用 AI 运营一个人的顾问型业务',
    },
    dek: {
      en: 'A high-trust operating model for turning expertise into advisory calls, decision support, and recurring insight without building a big firm.',
      ja: '判断、分析、助言を価値にする個人向けに、準備・対話・再利用を整える高信頼の運用スタック。',
      zh: '一套适合顾问、策略人和独立专家的高信任工作流，把分析、建议和判断沉淀成可复用资产。',
    },
    outcome: {
      en: 'Package your judgment more clearly, prepare faster for client conversations, and turn each engagement into reusable intellectual capital.',
      ja: '助言の準備を速くし、会話の質を高め、各案件を次の知的資産へつなげる。',
      zh: '更快完成会前准备，提高建议质量，并把每次顾问合作转化为下一次可复用的知识资产。',
    },
    audience: {
      en: 'Independent advisors, strategists, operators, consultants, and experts selling judgment more than implementation.',
      ja: '独立アドバイザー、戦略担当、オペレーター、コンサルタント、実行より判断で価値を出す専門家。',
      zh: '适合独立顾问、策略顾问、运营负责人、咨询人和靠判断力而不是纯执行卖服务的人。',
    },
    cadence: {
      en: 'Use when your value comes from analysis, perspective, and decisions—not just deliverables—and you need that value to scale beyond ad hoc calls.',
      ja: '成果物の制作よりも、分析、視点、判断そのものが価値になっているとき。',
      zh: '当客户买单的核心已经是你的分析、判断和视角，而不只是交付物本身。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'NotebookLM / research memory',
        role: {
          en: 'Compress past notes, market shifts, and client context into better prep briefs.',
          ja: '過去ノート、市場変化、顧客文脈を圧縮し、より良い準備資料に変える。',
          zh: '把历史笔记、市场变化和客户上下文压缩成更好的 prep brief。',
        },
      },
      {
        name: 'ChatGPT / Claude',
        role: {
          en: 'Support scenario thinking, comparisons, framing, and sharper strategic questions.',
          ja: '比較、シナリオ思考、論点整理、より良い戦略質問を支える。',
          zh: '辅助做对比、场景推演、问题 framing 和更锋利的战略提问。',
        },
      },
      {
        name: 'Notion',
        role: {
          en: 'Store prep briefs, advisory memos, insight libraries, and repeatable frameworks.',
          ja: 'prep brief、advisory memo、insight library、再利用可能な framework を保持する。',
          zh: '承接 prep brief、advisory memo、insight library 和可复用 framework。',
        },
      },
      {
        name: 'Writing workflow',
        role: {
          en: 'Turn recurring insights into memos, newsletter posts, and public proof-of-work.',
          ja: '繰り返し出る洞察をメモ、ニュースレター、公開コンテンツへ変える。',
          zh: '把反复出现的洞察转成 memo、newsletter 和公开 proof-of-work。',
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
        en: 'Review client notes and outside signals before every advisory session, then create a prep brief.',
        ja: '各セッション前に顧客ノートと外部シグナルを見直し、prep brief を作る。',
        zh: '每次顾问会前都先回顾客户笔记和外部信号，再形成 prep brief。',
      },
      {
        en: 'Lead the conversation with questions, trade-offs, and decision framing rather than generic recommendations.',
        ja: '一般論ではなく、質問、トレードオフ、意思決定の framing で会話を進める。',
        zh: '不要只给泛泛建议，而是用问题、trade-off 和决策 framing 来驱动会话。',
      },
      {
        en: 'Turn every session into a recap memo with explicit decisions, next actions, and reusable patterns.',
        ja: '各セッションを、decision、next action、再利用可能な pattern を含む memo に変える。',
        zh: '把每次对话都变成一份写清 decision、next action 和可复用 pattern 的 recap memo。',
      },
      {
        en: 'Save your strongest frameworks and phrasing so your judgment compounds into future IP.',
        ja: '使えた framework や言い回しを残し、判断が将来の IP に積み上がるようにする。',
        zh: '把最强的框架和表达沉淀下来，让你的判断持续积累成未来的 IP。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A practical guide for experts building a business on synthesis, perspective, and decision support.',
        ja: '分析、視点、意思決定支援を価値にする個人専門家のための実践ガイド。',
        zh: '成为一篇真正写给专家型个人业务的指南：卖的是综合、判断和决策支持。',
      },
      {
        en: 'A base layer for future offers like advisory retainers, strategy letters, and operator briefings.',
        ja: 'advisory retainer、strategy letter、operator briefing など次の商品の土台になる。',
        zh: '也能成为后续 advisory retainer、strategy letter、operator briefing 等产品的底层页。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
      {
        label: {
          en: 'Daily Brief',
          ja: 'デイリーブリーフ',
          zh: '每日简报',
        },
        href: '/daily/',
      },
    ],
  },
  {
    slug: 'the-ai-stack-for-repurposing-one-idea-into-five-formats',
    tag: {
      en: 'Playbook 13',
      ja: 'Playbook 13',
      zh: 'Playbook 13',
    },
    title: {
      en: 'The AI stack for repurposing one idea into five formats',
      ja: 'ひとつのアイデアを5つの形式へ広げる AI スタック',
      zh: '把一个想法变成五种内容形式的 AI 工作栈',
    },
    dek: {
      en: 'A practical publishing stack for turning one strong idea into newsletter, social, audio, video, and evergreen site assets without fragmenting your voice.',
      ja: 'ひとつの強いアイデアを、ニュースレター、SNS、音声、動画、evergreen page へ展開するための実践スタック。',
      zh: '一套适合内容站、newsletter、播客和短视频创作者的 repurposing 工作流，让一个强想法延展成完整内容系统。',
    },
    outcome: {
      en: 'Publish more surfaces from the same source idea while keeping your point of view, quality bar, and production rhythm intact.',
      ja: '同じアイデアから複数の面を公開しながら、声や視点や制作リズムを崩さない。',
      zh: '从同一个 source idea 产出 newsletter、社媒、音频、视频和 evergreen 页面，同时保持表达统一。',
    },
    audience: {
      en: 'Newsletter writers, podcasters, media operators, educators, and solo creators building a content business.',
      ja: 'ニュースレター執筆者、ポッドキャスター、メディア運営者、教育者、ひとりのコンテンツ事業者。',
      zh: '适合 newsletter 作者、播客主、内容网站运营者、教育型创作者和个人媒体品牌。',
    },
    cadence: {
      en: 'Use when you already have enough ideas, but your bottleneck is turning one idea into a repeatable multi-format system.',
      ja: 'アイデア不足ではなく、ひとつのアイデアを複数形式へ再利用する仕組みが弱いとき。',
      zh: '当你已经不缺想法，但还缺一个能把单个想法稳定扩展成多种格式的系统。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Canonical page / source note',
        role: {
          en: 'Holds the full argument and becomes the stable source for every downstream format.',
          ja: '論点の本体を保持し、すべての派生形式の原本になる。',
          zh: '承接完整论点，成为所有衍生格式的稳定源头。',
        },
      },
      {
        name: 'Newsletter + writing models',
        role: {
          en: 'Turns the same idea into a tighter recurring narrative for loyal readers.',
          ja: '同じアイデアを、読者習慣を作る短く強い物語へ変える。',
          zh: '把同一个想法变成更紧凑、可持续递送给核心读者的叙事。',
        },
      },
      {
        name: 'Social + hook workflow',
        role: {
          en: 'Creates discovery hooks, claims, and entry points without changing the thesis.',
          ja: '主張を変えずに、発見される入口や hook を作る。',
          zh: '在不改变 thesis 的前提下，产出社媒入口和 hook。',
        },
      },
      {
        name: 'Audio / video stack',
        role: {
          en: 'Adds voice, scenes, pacing, and visual recall to the same source idea.',
          ja: '同じアイデアに、声、場面、リズム、視覚的な記憶点を加える。',
          zh: '给同一个想法补上声音、节奏、场景和视觉记忆点。',
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
        en: 'Start with one canonical source instead of generating five disconnected assets.',
        ja: '最初から5つのバラバラな資産を作らず、ひとつの原本から始める。',
        zh: '先从一个 canonical source 开始，而不是一上来就生成五份互相脱节的内容。',
      },
      {
        en: 'Adapt the format for each surface, but keep the thesis stable.',
        ja: '各面に合わせて形式を変えるが、thesis は変えない。',
        zh: '每个表面可以改写法，但 thesis 要保持稳定。',
      },
      {
        en: 'Publish the formats as a chain so each one points to the next best surface.',
        ja: '各形式をバラバラに出すのではなく、次の面へ流れる chain として公開する。',
        zh: '把不同格式做成一条导流链，而不是孤立发布。',
      },
      {
        en: 'Save strong hooks, scripts, and transitions as reusable content modules.',
        ja: '使えた hook、script、つなぎ方を再利用可能なモジュールとして残す。',
        zh: '把高质量 hook、script 和转场结构沉淀成可复用模块。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A field guide for turning one useful idea into a full content system instead of a one-and-done post.',
        ja: 'ひとつの良いアイデアを、単発投稿ではなくコンテンツシステムへ育てるためのガイド。',
        zh: '成为一篇真正解释如何把一个好想法养成内容系统，而不是一次性帖子消耗掉的指南。',
      },
      {
        en: 'A bridge between media production, distribution, and evergreen publishing.',
        ja: 'メディア制作、配信、evergreen publishing をつなぐ橋になる。',
        zh: '把内容生产、分发和 evergreen 沉淀串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
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
    slug: 'how-to-build-a-small-paid-membership-with-ai',
    tag: {
      en: 'Playbook 14',
      ja: 'Playbook 14',
      zh: 'Playbook 14',
    },
    title: {
      en: 'How to build a small paid membership with AI',
      ja: 'AI で小さな有料メンバーシップを作る',
      zh: '用 AI 搭一个小型付费会员产品',
    },
    dek: {
      en: 'A compact operating stack for turning audience trust into a paid membership with clear benefits, repeatable programming, and solo-manageable delivery.',
      ja: 'ひとりでも維持できる範囲で、有料メンバーシップを立ち上げ、価値と運営リズムを安定させるための実践スタック。',
      zh: '一套适合个人创作者和垂直内容品牌的会员运转栈，让付费会员成为可持续、可维护的收入层。',
    },
    outcome: {
      en: 'Launch a small membership with a clear promise, recurring member value, and a sustainable publishing rhythm that one operator can maintain.',
      ja: '参加理由が明確で、継続価値があり、ひとりでも無理なく運営できる小さな membership を作る。',
      zh: '做出承诺清晰、节奏稳定、一个人也能长期运营的小型 membership。',
    },
    audience: {
      en: 'Newsletter operators, educators, niche creators, advisors, and community-led solo businesses.',
      ja: 'ニュースレター運営者、教育者、ニッチな制作者、アドバイザー、コミュニティ型の個人事業。',
      zh: '适合 newsletter 作者、教育型创作者、顾问、垂直社区运营者和个人品牌。',
    },
    cadence: {
      en: 'Use when you have audience trust and recurring useful ideas, but need a simpler business model than courses, consulting, or a large media operation.',
      ja: '読者や顧客から信頼は得ているが、講座や受託より軽い recurring revenue layer が欲しいとき。',
      zh: '当你已经有读者信任，但需要一个比课程更灵活、比咨询更轻的 recurring revenue 模型。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Promise + offer design',
        role: {
          en: 'Clarifies why members join and why they should stay.',
          ja: 'なぜ入るのか、なぜ残るのかを明確にする。',
          zh: '先说清为什么加入，也说清为什么继续留下。',
        },
      },
      {
        name: 'Recurring program layer',
        role: {
          en: 'Turns the membership into a predictable rhythm instead of a random content dump.',
          ja: 'ランダムな有料コンテンツ置き場ではなく、予測可能な cadence にする。',
          zh: '让 membership 变成固定节目，而不是随机扔内容。',
        },
      },
      {
        name: 'Member communication workflow',
        role: {
          en: 'Supports onboarding, reminders, updates, and recap notes with low overhead.',
          ja: 'オンボーディング、更新、リマインド、recap を軽く安定して回す。',
          zh: '承接 onboarding、更新、提醒和 recap，让成员体验更稳。',
        },
      },
      {
        name: 'Public/private content loop',
        role: {
          en: 'Turns member questions into future public proof-of-work and public response back into member value.',
          ja: '会員の質問を public proof-of-work へ、public の反応を会員価値へ戻す。',
          zh: '把会员问题转成公开内容，再把公开反馈带回会员区形成更深价值。',
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
        en: 'Write the membership promise in one sentence before choosing tools or perks.',
        ja: 'ツールや特典を選ぶ前に、membership の約束を一文で書く。',
        zh: '先用一句话写清 membership promise，再决定工具和权益。',
      },
      {
        en: 'Pick one or two recurring formats and protect them from scope creep.',
        ja: '定期フォーマットを1〜2個に絞り、肥大化させない。',
        zh: '只选 1-2 个 recurring format，并守住边界，不要膨胀。',
      },
      {
        en: 'Use member questions as product input, not just support overhead.',
        ja: '会員の質問を、単なるサポートではなく product input として扱う。',
        zh: '把会员问题当成产品输入，而不只是客服负担。',
      },
      {
        en: 'Track renewal signals and repeated value, not just signups and launch spikes.',
        ja: '申込数だけでなく、renewal signal と繰り返し価値を追う。',
        zh: '看续费和重复价值，而不只是报名数和 launch 峰值。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A practical guide for small memberships that win on continuity, clarity, and retained trust rather than constant volume.',
        ja: '量ではなく、継続性、明確さ、信頼維持で勝つ小さな membership の実践ガイド。',
        zh: '成为一篇写给小型会员产品的指南：不是靠堆内容，而是靠持续清晰的价值感取胜。',
      },
      {
        en: 'A bridge between audience trust, recurring revenue, and a lighter solo business model.',
        ja: '読者の信頼、継続収益、軽い個人事業モデルをつなぐ橋になる。',
        zh: '把受众信任、持续收入和更轻的个人业务模型串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
      {
        label: {
          en: 'Daily Brief',
          ja: 'デイリーブリーフ',
          zh: '每日简报',
        },
        href: '/daily/',
      },
    ],
  },
  {
    slug: 'how-to-turn-advisory-into-a-productized-retainer',
    tag: {
      en: 'Playbook 15',
      ja: 'Playbook 15',
      zh: 'Playbook 15',
    },
    title: {
      en: 'How to turn advisory into a productized retainer',
      ja: 'AIでアドバイザリーをプロダクト型リテイナーにする',
      zh: '把顾问服务做成产品化长期顾问方案',
    },
    dek: {
      en: 'A practical operating model for turning advisory work into a repeatable retainer with clearer scope, steadier delivery, and stronger margins for a solo operator.',
      ja: '個別対応に流れがちなアドバイザリー業務を、繰り返し価値・明確な範囲・安定した cadence を持つリテイナーへ変えるための実践モデル。',
      zh: '一套适合个人顾问、策略顾问和专家型业务的 operating model，把零散 advisory work 收成有清晰范围、稳定 cadence 和可复用资产的 retainer。',
    },
    outcome: {
      en: 'Move from custom advisory chaos to a productized retainer built on recurring judgment, recurring artifacts, and a manageable weekly rhythm.',
      ja: 'カスタム対応に追われる advisory work から、定期的な判断支援と再利用可能な成果物で回る productized retainer へ移行する。',
      zh: '从按小时、按会议、按临时问题响应的顾问工作，转成以持续判断支持和固定交付物为核心的产品化 retainer。',
    },
    audience: {
      en: 'Solo advisors, strategists, analysts, operators, and specialists whose value comes from synthesis, perspective, and decision support.',
      ja: '個人のアドバイザー、ストラテジスト、アナリスト、オペレーター、専門家型ソロ事業者。',
      zh: '适合个人顾问、策略顾问、分析师、运营顾问和靠判断与综合能力提供价值的专家型业务。',
    },
    cadence: {
      en: 'Use when clients want recurring access to your judgment, but your delivery model still depends on custom hours, reactive calls, and scattered follow-up.',
      ja: 'クライアントは継続的にあなたの判断を求めているが、提供モデルがまだ時間売り・都度相談・散発的な follow-up に依存しているとき。',
      zh: '当客户已经持续需要你的判断，但你的交付还停留在按小时、临时 call 和零散 follow-up 上时。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Promise + offer design',
        role: {
          en: 'Defines the recurring problem you solve and the shape of the retainer clients are actually buying.',
          ja: 'どんな recurring problem を解くのか、そしてクライアントが何を買っているのかを明確にする。',
          zh: '先定义客户持续购买的到底是什么，以及你反复解决的是哪一类问题。',
        },
      },
      {
        name: 'Intake + signal capture',
        role: {
          en: 'Collects context, metrics, transcripts, and live questions in a consistent structure.',
          ja: '状況、指標、 transcript、 live question を同じ構造で受け取る。',
          zh: '稳定收集背景、指标、transcript 和客户当下最真实的问题。',
        },
      },
      {
        name: 'Memo + decision-support layer',
        role: {
          en: 'Turns live calls into reusable briefs, recaps, and decision artifacts.',
          ja: 'live call を reusable な brief、recap、decision artifact へ変える。',
          zh: '把 call 从即时沟通变成 memo、brief 和 decision artifacts。',
        },
      },
      {
        name: 'Pattern library',
        role: {
          en: 'Preserves your best frameworks, questions, and examples so each retainer gets stronger over time.',
          ja: '使えた framework、問い、例を残し、リテイナーを時間とともに強くする。',
          zh: '把你的高质量框架、问题和案例沉淀下来，让每个 retainer 越做越稳。',
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
        en: 'Write the retainer promise in one sentence before designing pricing, calls, or access.',
        ja: '価格や call や access を決める前に、リテイナーの promise を一文で書く。',
        zh: '先用一句话写清 retainer promise，再谈价格、call 和 access。',
      },
      {
        en: 'Standardize the intake so each client enters a known operating shape instead of a custom project.',
        ja: 'intake を標準化し、すべてのクライアントが custom project 化しないようにする。',
        zh: '把 intake 标准化，别让每个客户一上来就变成独立项目。',
      },
      {
        en: 'Make the core value an artifact, not just a live conversation.',
        ja: '価値の中心を live conversation ではなく artifact に置く。',
        zh: '把核心价值放在 artifacts 上，而不只是 live conversation 本身。',
      },
      {
        en: 'Save your best patterns so future delivery gets lighter while judgment quality rises.',
        ja: '良かった pattern を保存し、 delivery を軽くしながら判断品質を上げる。',
        zh: '把好的 pattern 存下来，让交付越来越轻，同时判断质量越来越高。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for solo advisory businesses that need recurring revenue without collapsing into agency sprawl.',
        ja: 'agency 化せずに recurring revenue を作りたいソロ advisory business のためのガイド。',
        zh: '成为一篇真正写给个人顾问型业务的指南：想做 recurring revenue，但不想膨胀成 agency。',
      },
      {
        en: 'A bridge between analysis, meetings, decision support, and productized service design.',
        ja: 'analysis、meeting、decision support、productized service design をつなぐ橋になる。',
        zh: '把分析、会议、决策支持和产品化服务设计真正串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
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
    slug: 'the-ai-workflow-for-a-niche-research-letter',
    tag: {
      en: 'Playbook 16',
      ja: 'Playbook 16',
      zh: 'Playbook 16',
    },
    title: {
      en: 'The AI workflow for a niche research letter',
      ja: 'ニッチなリサーチレターを回す AI ワークフロー',
      zh: '运营垂直研究简报的 AI 工作流',
    },
    dek: {
      en: 'A repeatable research and publishing workflow for turning signals, sources, and synthesis into a focused research letter that one operator can ship every week.',
      ja: 'sources、signal、synthesis を、ひとりでも毎週出せる focused research letter に変えるための実践ワークフロー。',
      zh: '一套适合个人分析师、研究者和 niche publisher 的 research workflow，把 sources、signals 和 synthesis 变成每周都能稳定发出的研究简报。',
    },
    outcome: {
      en: 'Run a niche research letter with a clear editorial question, stronger source memory, and a weekly publishing rhythm that compounds over time.',
      ja: '明確な editorial question、強い research memory、継続できる cadence を持つ niche research letter を運営する。',
      zh: '做出一个有明确 editorial question、有 research memory、也有稳定节奏的垂直研究简报产品。',
    },
    audience: {
      en: 'Analysts, newsletter writers, researchers, operators, and niche media builders turning synthesis into a paid or strategic publishing product.',
      ja: 'アナリスト、ニュースレター執筆者、researcher、operator、専門特化型メディアを作るソロ事業者。',
      zh: '适合分析师、newsletter 作者、研究者、运营者和想把综合判断做成内容产品的人。',
    },
    cadence: {
      en: 'Use when you already collect links, sources, and notes, but need a better system for turning research into a consistent letter with point of view.',
      ja: 'link や資料は十分集まるのに、毎号それを point of view のある letter に変える仕組みが弱いとき。',
      zh: '当你已经在收集大量 links、sources 和 notes，但还没有把它们稳定转成有观点的研究简报时。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Source collection',
        role: {
          en: 'Keeps a steady inflow of reports, links, transcripts, and documents worth tracking.',
          ja: '追う価値のある report、link、transcript、document を安定して入れる。',
          zh: '持续收进真正值得追踪的 reports、links、transcripts 和 documents。',
        },
      },
      {
        name: 'Research memory',
        role: {
          en: 'Turns notes, highlights, quotes, and patterns into a reusable editorial knowledge base.',
          ja: 'note、highlight、quote、pattern を再利用できる editorial knowledge base に変える。',
          zh: '把 notes、highlights、quotes 和 patterns 沉淀成可复用的 research memory。',
        },
      },
      {
        name: 'Issue framing',
        role: {
          en: 'Converts a live question into a claim, structure, and operator takeaway.',
          ja: 'live question を claim、構成、operator takeaway へ変える。',
          zh: '把 live question 变成清晰的 claim、结构和 operator takeaway。',
        },
      },
      {
        name: 'Distribution loop',
        role: {
          en: 'Publishes one issue and then reuses the strongest pieces across archive, social, and follow-on formats.',
          ja: '1本の issue を公開し、その強い部分を archive、social、follow-on format に再利用する。',
          zh: '先发出完整 issue，再把最强片段回收进 archive、社媒和后续格式。',
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
        en: 'Define the recurring editorial question before collecting even more sources.',
        ja: 'さらに source を増やす前に、 recurring editorial question を決める。',
        zh: '别再继续囤 sources 之前，先定义 recurring editorial question。',
      },
      {
        en: 'Separate collection, memory, writing, and distribution into distinct stages.',
        ja: 'collection、memory、writing、distribution を別々の段階に分ける。',
        zh: '把 collection、memory、writing 和 distribution 拆成不同阶段。',
      },
      {
        en: 'Draft each issue from notes and evidence, not from a blank prompt.',
        ja: '各 issue は blank prompt ではなく、note と evidence から起こす。',
        zh: '每一期都从 notes 和 evidence 起稿，而不是从空 prompt 开始。',
      },
      {
        en: 'Save open questions and strong excerpts so the next issue starts with momentum.',
        ja: 'open question と強い excerpt を残し、次号を momentum つきで始める。',
        zh: '把 open questions 和强 excerpt 留下来，让下一期带着 momentum 开始。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for builders turning research, synthesis, and signal tracking into a niche publishing asset.',
        ja: 'research、synthesis、signal tracking を niche publishing asset に変える人のためのガイド。',
        zh: '成为一篇真正写给研究型内容产品的指南：把研究、综合和 signal tracking 做成垂直出版资产。',
      },
      {
        en: 'A bridge between research workflows, daily briefs, and long-tail editorial products.',
        ja: 'research workflow、daily brief、long-tail editorial product をつなぐ橋になる。',
        zh: '把 research workflow、daily brief 和长期 editorial product 串成一套系统。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
      {
        label: {
          en: 'Daily Brief',
          ja: 'デイリーブリーフ',
          zh: '每日简报',
        },
        href: '/daily/',
      },
    ],
  },
  {
    slug: 'how-to-run-a-small-premium-briefing-business',
    tag: {
      en: 'Playbook 17',
      ja: 'Playbook 17',
      zh: 'Playbook 17',
    },
    title: {
      en: 'How to run a small premium briefing business',
      ja: '小さなプレミアム briefing business を回す',
      zh: '运营一个小型高价简报业务',
    },
    dek: {
      en: 'A focused operating model for turning recurring synthesis into a premium briefing product with clear cadence, high signal density, and solo-manageable delivery.',
      ja: '継続的な synthesis を、明確な cadence・高い signal density・ひとりでも回せる delivery を持つ premium briefing product に変えるための実践モデル。',
      zh: '一套把持续综合判断做成 premium briefing product 的运营模型：节奏清晰、信号密度高、一个人也能稳定交付。',
    },
    outcome: {
      en: 'Run a compact briefing business that readers pay for because it saves them time, sharpens their judgment, and arrives with dependable editorial rhythm.',
      ja: '読者の判断を sharpen し、時間を節約し、毎週の rhythm に組み込まれる compact な briefing business を運営する。',
      zh: '做出一个读者愿意持续付费的 compact briefing business：节省时间、提高判断、并且进入他们的每周节奏。',
    },
    audience: {
      en: 'Analysts, niche writers, operators, researchers, and solo publishers packaging recurring synthesis into a paid information product.',
      ja: 'アナリスト、ニッチな書き手、operator、researcher、継続的な synthesis を有料情報商品にしたいソロ出版者。',
      zh: '适合分析师、垂直写作者、运营者、研究者和想把持续综合判断做成付费信息产品的个人出版者。',
    },
    cadence: {
      en: 'Use when readers already value your filtering and interpretation, and you want a lighter paid product than consulting, courses, or a full media company.',
      ja: '読者はすでにあなたの filtering と解釈を評価しており、consulting や course より軽い paid product を作りたいとき。',
      zh: '当读者已经认可你的 filtering 和 interpretation，而你想做一个比 consulting、course 或完整 newsletter business 更轻的 paid product 时。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Editorial question',
        role: {
          en: 'Defines the kind of change, signal, or market movement the briefing is paid to track.',
          ja: 'この briefing が追い続ける change、signal、market movement の型を定義する。',
          zh: '先定义这份 briefing 持续替读者追踪的是哪类变化、signals 或市场动向。',
        },
      },
      {
        name: 'Source system',
        role: {
          en: 'Keeps reports, transcripts, links, and recurring evidence flowing into one trusted stream.',
          ja: 'report、transcript、link、evidence をひとつの信頼できる流れに集める。',
          zh: '把 reports、transcripts、links 和 recurring evidence 收进一条可信的 source stream。',
        },
      },
      {
        name: 'Issue format',
        role: {
          en: 'Packages each issue into a compact answer instead of a pile of links.',
          ja: '各 issue を link の山ではなく、短く強い answer としてまとめる。',
          zh: '把每一期包装成一个 compact answer，而不是一堆链接的搬运。',
        },
      },
      {
        name: 'Renewal loop',
        role: {
          en: 'Turns archives, excerpts, and reader response into future retention and acquisition fuel.',
          ja: 'archive、excerpt、reader response を retention と acquisition の燃料に変える。',
          zh: '把 archive、excerpt 和 reader response 变成后续 retention 与 acquisition 的燃料。',
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
        en: 'Write the recurring editorial question before expanding the issue length or scope.',
        ja: 'issue を長くしたり scope を広げる前に、 recurring editorial question を書く。',
        zh: '在拉长 issue 或扩范围之前，先写清 recurring editorial question。',
      },
      {
        en: 'Cut the source pile down until the issue feels denser than the inputs behind it.',
        ja: 'source pile を削り、入力よりも issue のほうが密度が高く感じられるまで絞る。',
        zh: '把 source pile 一直切到 issue 的密度明显高于原始输入为止。',
      },
      {
        en: 'Standardize the issue shape so readers know where to find signal, implication, and takeaway.',
        ja: 'signal、implication、takeaway の位置が読者に読めるよう、 issue shape を固定する。',
        zh: '把 issue 结构固定下来，让读者知道 signal、implication 和 takeaway 会出现在哪里。',
      },
      {
        en: 'Treat the archive and teaser excerpts as part of the product, not as leftovers.',
        ja: 'archive と teaser excerpt を leftovers ではなく product の一部として扱う。',
        zh: '把 archive 和 teaser excerpts 当成产品的一部分，而不是剩余边角料。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for building a compact paid information product that wins on judgment quality rather than content volume.',
        ja: '量ではなく judgment quality で勝つ、小さな有料情報商品を作るためのガイド。',
        zh: '成为一篇真正写给小型付费简报产品的指南：靠判断质量赢，而不是靠内容堆量。',
      },
      {
        en: 'A bridge between research workflow, briefing format, and recurring information revenue.',
        ja: 'research workflow、briefing format、recurring information revenue をつなぐ橋になる。',
        zh: '把 research workflow、briefing format 和 recurring information revenue 串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
      {
        label: {
          en: 'Daily Brief',
          ja: 'デイリーブリーフ',
          zh: '每日简报',
        },
        href: '/daily/',
      },
    ],
  },
  {
    slug: 'how-to-build-a-solo-media-franchise-with-ai',
    tag: {
      en: 'Playbook 18',
      ja: 'Playbook 18',
      zh: 'Playbook 18',
    },
    title: {
      en: 'How to build a solo media franchise with AI',
      ja: 'AI でひとりメディアフランチャイズを作る',
      zh: '用 AI 搭一个人的媒体品牌系统',
    },
    dek: {
      en: 'A systems-level playbook for turning one-person publishing into a recognizable multi-format media franchise without hiring a full editorial team.',
      ja: 'site、newsletter、social、audio、video をひとつの editorial system として回し、ひとりでも recognizable な media property に育てるための playbook。',
      zh: '一套系统级 playbook，把 site、newsletter、social、audio 和 video 连接成一个 recognizable 的 media system，让个人品牌变成真正可复利的媒体资产。',
    },
    outcome: {
      en: 'Build a solo media brand that publishes across site, newsletter, social, audio, and video while keeping one editorial voice and one operating system.',
      ja: 'site、newsletter、social、audio、video をまたいでも同じ editorial voice が伝わる solo media brand を作る。',
      zh: '建立一个跨 site、newsletter、social、audio 和 video 依然保持同一 editorial voice 的 solo media brand。',
    },
    audience: {
      en: 'Creators, operators, educators, newsletter writers, and niche publishers growing from a single channel into a durable media property.',
      ja: 'creator、operator、educator、newsletter writer、niche publisher として単一チャネルから durable media property へ育ちたい人。',
      zh: '适合创作者、运营者、教育者、newsletter 作者和想从单一渠道长成 durable media property 的个人出版者。',
    },
    cadence: {
      en: 'Use when one format is already working, and the next bottleneck is expanding distribution and surfaces without fragmenting the brand or the workflow.',
      ja: 'ひとつの format はもう機能しており、次のボトルネックが distribution と surface expansion になっているとき。',
      zh: '当你已经有一个格式跑通了，下一步瓶颈变成 distribution、surface expansion 和内部 operating system 时。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Editorial spine',
        role: {
          en: 'Keeps topics, claims, tone, and recurring formats coherent across every surface.',
          ja: 'topic、claim、tone、recurring format をすべての surface で一貫させる。',
          zh: '让 topics、claims、tone 和 recurring formats 在所有 surfaces 上保持一致。',
        },
      },
      {
        name: 'Canonical assets',
        role: {
          en: 'Defines the flagship pages, issues, and guides that everything else should inherit from.',
          ja: 'flagship page、issue、guide を定義し、他のすべてがそこから派生するようにする。',
          zh: '先定义旗舰页面、issues 和 guides，让其他格式都从它们派生。',
        },
      },
      {
        name: 'Surface expansion',
        role: {
          en: 'Repurposes the strongest claims and scenes into social, audio, and video without losing the source.',
          ja: 'source を失わずに、 strongest claim と scene を social、audio、video に広げる。',
          zh: '在不丢失 source 的前提下，把 strongest claims 和 scenes 扩成 social、audio 和 video。',
        },
      },
      {
        name: 'Feedback loop',
        role: {
          en: 'Tracks what builds reach versus what deepens trust so the brand compounds instead of scattering.',
          ja: 'reach を作るものと trust を深めるものを分けて追い、ブランドを散らさず育てる。',
          zh: '区分什么 build reach、什么 build trust，让品牌不是发散，而是复利。',
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
        en: 'Define the editorial spine before expanding into more formats.',
        ja: 'format を増やす前に editorial spine を定義する。',
        zh: '在扩更多格式之前，先把 editorial spine 定义清楚。',
      },
      {
        en: 'Choose one flagship format and treat it as the source of truth.',
        ja: 'ひとつの flagship format を選び、 source of truth として扱う。',
        zh: '先选一个旗舰格式，把它当成 source of truth。',
      },
      {
        en: 'Repurpose from canonical assets, not from disconnected ideas.',
        ja: 'バラバラの idea ではなく canonical asset から repurpose する。',
        zh: '从 canonical assets 做 repurpose，而不是从零散点子开始。',
      },
      {
        en: 'Send every surface back to a durable home so attention becomes owned media.',
        ja: 'すべての surface を durable home に戻し、attention を owned media に変える。',
        zh: '让每个 surface 都回流到 durable home，把 attention 变成 owned media。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for turning a single successful channel into a recognizable multi-surface publication.',
        ja: 'ひとつの成功チャネルを recognizable な multi-surface publication に育てるためのガイド。',
        zh: '成为一篇真正解释如何把一个成功渠道长成 multi-surface publication 的指南。',
      },
      {
        en: 'A bridge between canonical publishing, repurposing systems, and long-term audience ownership.',
        ja: 'canonical publishing、repurposing system、long-term audience ownership をつなぐ橋になる。',
        zh: '把 canonical publishing、repurposing systems 和长期 audience ownership 串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
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
    slug: 'how-to-package-a-niche-knowledge-base-with-ai',
    tag: {
      en: 'Playbook 19',
      ja: 'Playbook 19',
      zh: 'Playbook 19',
    },
    title: {
      en: 'How to package a niche knowledge base with AI',
      ja: 'AI でニッチな knowledge base を商品化する',
      zh: '用 AI 把一个垂直知识库做成产品',
    },
    dek: {
      en: 'A practical model for turning scattered notes, links, prompts, and references into a structured niche knowledge base that readers or clients can actually use.',
      ja: '散らばった note、link、prompt、reference を、読者や顧客が実際に使える structured な niche knowledge base に変えるための実践モデル。',
      zh: '一套把零散 notes、links、prompts 和 references 组织成可读、可用、可持续更新的垂直知识库产品的方法。',
    },
    outcome: {
      en: 'Build a knowledge product that saves readers time, preserves your best thinking, and compounds as your archive grows.',
      ja: '読者の時間を節約し、自分の best thinking を保存し、 archive とともに価値が積み上がる知識商品を作る。',
      zh: '做出一个真正能帮读者节省时间、沉淀你最佳判断、并且会随 archive 一起复利的知识产品。',
    },
    audience: {
      en: 'Researchers, newsletter writers, operators, educators, creators, and solo experts with a growing archive of useful material.',
      ja: 'researcher、newsletter writer、operator、educator、creator、そして useful material を蓄積しているソロ専門家。',
      zh: '适合研究者、newsletter 作者、运营者、教育型创作者，以及已经积累了很多有价值材料的个人专家。',
    },
    cadence: {
      en: 'Use when you already have too many useful notes or references, but they remain trapped in folders, chats, bookmarks, or disconnected pages.',
      ja: 'useful な note や reference は十分あるのに、folder、chat、bookmark、切れた page に閉じ込められているとき。',
      zh: '当你已经有很多有价值的 notes 和 references，但它们还散落在 folders、chats、bookmarks 和断裂页面里时。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Knowledge map',
        role: {
          en: 'Defines the categories, questions, and entry points that turn an archive into a product.',
          ja: 'archive を product に変える category、question、entry point を定義する。',
          zh: '先定义 categories、questions 和 entry points，别让 archive 只是堆资料。',
        },
      },
      {
        name: 'Source consolidation',
        role: {
          en: 'Pulls notes, prompts, references, and examples into one maintainable system.',
          ja: 'note、prompt、reference、example をひとつの更新可能な system に集約する。',
          zh: '把 notes、prompts、references 和 examples 集中进一个可维护系统。',
        },
      },
      {
        name: 'Retrieval + packaging',
        role: {
          en: 'Turns raw archive material into answerable pages, guides, and structured lookups.',
          ja: 'raw な archive を、答えられる page、guide、structured lookup に変える。',
          zh: '把原始 archive material 变成可回答问题的页面、guide 和 structured lookup。',
        },
      },
      {
        name: 'Update loop',
        role: {
          en: 'Keeps the knowledge base alive as new tools, cases, and references appear.',
          ja: '新しい tool、case、reference が出ても knowledge base を生きた状態に保つ。',
          zh: '随着新工具、新案例和新 references 出现，持续让知识库保持活性。',
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
        en: 'Start by mapping the recurring questions your archive should answer.',
        ja: 'まず、 archive が答えるべき recurring question を地図化する。',
        zh: '先定义你的 archive 应该持续回答哪些 recurring questions。',
      },
      {
        en: 'Consolidate scattered notes and references into one system before polishing presentation.',
        ja: '見た目を整える前に、散らばった note と reference をひとつに集約する。',
        zh: '先把分散的 notes 和 references 集中起来，再谈 presentation。',
      },
      {
        en: 'Package the strongest materials into structured pages, not just raw dumps.',
        ja: '強い素材を、 raw dump ではなく structured page にする。',
        zh: '把最强的材料包装成 structured pages，而不是原始堆放。',
      },
      {
        en: 'Build a lightweight update loop so the archive keeps becoming more useful over time.',
        ja: '軽い update loop を作り、 archive が時間とともに useful になるようにする。',
        zh: '建立一个轻量 update loop，让 archive 随时间越来越有用。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for turning personal research archives into a useful product instead of a private pile.',
        ja: '個人の research archive を private pile ではなく useful product に変えるためのガイド。',
        zh: '成为一篇真正解释如何把个人 research archive 变成 useful product 的指南。',
      },
      {
        en: 'A bridge between documentation, curation, and durable intellectual property.',
        ja: 'documentation、curation、durable intellectual property をつなぐ橋になる。',
        zh: '把 documentation、curation 和 durable intellectual property 串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
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
    slug: 'the-ai-workflow-for-a-solo-expert-network',
    tag: {
      en: 'Playbook 20',
      ja: 'Playbook 20',
      zh: 'Playbook 20',
    },
    title: {
      en: 'The AI workflow for a solo expert network',
      ja: 'ひとり expert network を回す AI ワークフロー',
      zh: '一个人运营专家网络的 AI 工作流',
    },
    dek: {
      en: 'A structured operating model for one person to coordinate experts, capture insight, and turn specialist access into a repeatable information or advisory product.',
      ja: 'ひとりで expert を束ね、insight を回収し、specialist access を repeatable な情報商品や advisory product に変えるための実践モデル。',
      zh: '一套适合个人运营的 expert network 模型，把专家输入、访谈、判断和 follow-up 组织成可重复的 advisory 或 information product。',
    },
    outcome: {
      en: 'Build a solo expert-network workflow that turns conversations and specialist insight into a compact but high-value information layer.',
      ja: '会話と specialist insight を、高価値でコンパクトな情報レイヤーへ変える solo expert-network workflow を作る。',
      zh: '建立一个一个人也能跑得动的 expert-network workflow，把 conversations 和 specialist insight 变成高价值的信息层。',
    },
    audience: {
      en: 'Analysts, advisors, researchers, niche publishers, and solo operators who rely on expert interviews, perspective, and curated judgment.',
      ja: 'expert interview、perspective、curated judgment を価値源泉にする analyst、advisor、researcher、niche publisher、solo operator。',
      zh: '适合依赖 expert interviews、perspective 和 curated judgment 的分析师、顾问、研究者、垂直出版者和个人运营者。',
    },
    cadence: {
      en: 'Use when your edge increasingly comes from who you can ask, what you can synthesize, and how quickly you can turn expert input into useful outputs.',
      ja: '誰に聞けるか、何を synthesize できるか、そして expert input をどれだけ速く useful output に変えられるかが edge になっているとき。',
      zh: '当你的 edge 越来越来自“你能问谁、能综合什么、能多快把 expert input 变成 useful outputs”时。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Expert map',
        role: {
          en: 'Defines who matters, what they know, and what kind of signal each relationship can unlock.',
          ja: '誰が重要で、何を知っていて、その関係がどんな signal を開くかを定義する。',
          zh: '先画出 expert map：谁重要、知道什么、能带来哪类 signal。',
        },
      },
      {
        name: 'Interview workflow',
        role: {
          en: 'Standardizes outreach, preparation, prompts, note capture, and recap.',
          ja: 'outreach、preparation、prompt、note capture、recap を標準化する。',
          zh: '把 outreach、preparation、prompts、note capture 和 recap 变成固定流程。',
        },
      },
      {
        name: 'Synthesis layer',
        role: {
          en: 'Turns conversations into themes, pattern maps, and decision-support outputs.',
          ja: '会話を theme、pattern map、decision-support output に変える。',
          zh: '把 conversations 变成 themes、pattern maps 和 decision-support outputs。',
        },
      },
      {
        name: 'Relationship loop',
        role: {
          en: 'Keeps the network warm and useful without turning every interaction into a cold transaction.',
          ja: 'すべてを cold transaction にせず、network を温かく useful に保つ。',
          zh: '让网络持续有温度、有价值，而不是把每次互动都做成冷交易。',
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
        en: 'Map the categories of experts you need before chasing individual names.',
        ja: '個別の名前を追う前に、必要な expert category を地図化する。',
        zh: '在追具体人之前，先定义你真正需要的 expert categories。',
      },
      {
        en: 'Standardize the interview loop so every conversation generates reusable insight.',
        ja: 'すべての会話が reusable insight を生むように、 interview loop を標準化する。',
        zh: '把 interview loop 标准化，让每次 conversation 都能产出 reusable insight。',
      },
      {
        en: 'Turn expert input into themes and outputs quickly while the signal is still fresh.',
        ja: 'signal が新鮮なうちに、 expert input を theme と output に変える。',
        zh: '趁 signal 还新鲜，尽快把 expert input 变成 themes 和 outputs。',
      },
      {
        en: 'Maintain the relationship loop so access deepens rather than dries up.',
        ja: 'access が枯れずに深まるよう、 relationship loop を維持する。',
        zh: '维持 relationship loop，让 access 越来越深，而不是越用越冷。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for solo operators who want to coordinate specialist knowledge without needing a full platform.',
        ja: 'full platform を持たずに specialist knowledge を束ねたい solo operator のためのガイド。',
        zh: '成为一篇写给个人运营者的指南：不靠完整平台，也能组织 specialist knowledge network。',
      },
      {
        en: 'A bridge between interviews, advisory products, and recurring synthesis.',
        ja: 'interview、advisory product、recurring synthesis をつなぐ橋になる。',
        zh: '把 interviews、advisory products 和 recurring synthesis 串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
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
    slug: 'how-to-build-a-premium-signal-archive-with-ai',
    tag: {
      en: 'Playbook 21',
      ja: 'Playbook 21',
      zh: 'Playbook 21',
    },
    title: {
      en: 'How to build a premium signal archive with AI',
      ja: 'AI で premium signal archive を作る',
      zh: '用 AI 搭一个 premium signal archive',
    },
    dek: {
      en: 'A practical model for turning brief notes, research, and recurring editorial judgment into a paid archive readers return to over time.',
      ja: 'brief note、research、recurring な editorial judgment を、読者が繰り返し戻る paid archive に変えるための実践モデル。',
      zh: '一套把 brief notes、research 和 recurring editorial judgment 组织成可持续付费 archive 的方法。',
    },
    outcome: {
      en: 'Build an archive that compounds every week instead of letting your best signal disappear after each issue is sent.',
      ja: 'issue ごとに signal を消費し切るのではなく、毎週価値が積み上がる archive を作る。',
      zh: '做出一个每周都在增值、而不是每期发完就归零的 archive product。',
    },
    audience: {
      en: 'Niche publishers, research letters, solo analysts, premium briefings, and editorial businesses that want stronger renewal value.',
      ja: 'niche publisher、research letter、solo analyst、premium briefing、そして renewal value を強くしたい editorial business。',
      zh: '适合 niche publishers、research letters、solo analysts、premium briefings，以及希望提高续费价值的 editorial businesses。',
    },
    cadence: {
      en: 'Use when your archive is fragmented across notes, issues, and bookmarks even though the underlying signal is already strong.',
      ja: 'underlying な signal は強いのに、archive が note、issue、bookmark に分散したままのとき。',
      zh: '当底层 signal 已经很强，但 archive 仍散落在 notes、issues 和 bookmarks 里时。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Signal capture',
        role: {
          en: 'Collects the source, why it matters, and what future page it should strengthen.',
          ja: 'source、why it matters、どの future page を強くするかを一緒に残す。',
          zh: '不仅记录 source，还记录 why it matters，以及它应该强化哪一页 future page。',
        },
      },
      {
        name: 'Archive taxonomy',
        role: {
          en: 'Organizes recurring questions, topic hubs, and canonical pages so the archive is browsable.',
          ja: 'recurring question、topic hub、canonical page を整理して、browse しやすい archive にする。',
          zh: '把 recurring questions、topic hubs 和 canonical pages 组织起来，让 archive 更可浏览。',
        },
      },
      {
        name: 'Premium packaging',
        role: {
          en: 'Turns the archive into a paid research surface instead of a passive storage layer.',
          ja: 'archive を passive storage ではなく paid research surface に変える。',
          zh: '把 archive 从被动存储层变成真正的 paid research surface。',
        },
      },
      {
        name: 'Update loop',
        role: {
          en: 'Makes every new issue strengthen the archive instead of competing with it.',
          ja: '新しい issue が archive と競合せず、 archive を強くするようにする。',
          zh: '让每一期新内容都去强化 archive，而不是和它互相竞争。',
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
        en: 'Define the recurring questions your readers want answered faster.',
        ja: '読者がより速く答えを欲しい recurring question を定義する。',
        zh: '先定义读者最想被快速回答的 recurring questions。',
      },
      {
        en: 'Promote only the strongest notes into lasting archive entries.',
        ja: '強い note だけを lasting archive entry に昇格させる。',
        zh: '只把最强的 notes 升格成 lasting archive entries。',
      },
      {
        en: 'Create canonical pages that keep absorbing future updates.',
        ja: '将来の update を吸収し続ける canonical page を作る。',
        zh: '建立会持续吸收 future updates 的 canonical pages。',
      },
      {
        en: 'Design a paid access layer that is easier to browse than an inbox of old issues.',
        ja: 'old issue の inbox より browse しやすい paid access layer を設計する。',
        zh: '设计一层比旧 issues inbox 更好浏览的 paid access layer。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for building a premium archive product that gets more valuable each month instead of decaying after publication.',
        ja: 'publish するたびに価値が減衰するのではなく、毎月価値が増す premium archive product を作るガイド。',
        zh: '成为一篇真正解释如何把内容 archive 做成 monthly compounding product 的指南。',
      },
      {
        en: 'A bridge between premium briefings, research workflows, and durable editorial ownership.',
        ja: 'premium briefing、research workflow、durable editorial ownership をつなぐ橋になる。',
        zh: '把 premium briefings、research workflows 和 durable editorial ownership 串起来。',
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
          en: 'Playbooks',
          ja: 'Playbooks',
          zh: 'Playbooks',
        },
        href: '/playbooks/',
      },
    ],
  },
  {
    slug: 'the-ai-stack-for-solo-editorial-operations',
    tag: {
      en: 'Playbook 22',
      ja: 'Playbook 22',
      zh: 'Playbook 22',
    },
    title: {
      en: 'The AI stack for solo editorial operations',
      ja: 'ひとり editorial operation を回す AI スタック',
      zh: '一个人运营 editorial operations 的 AI 工作栈',
    },
    dek: {
      en: 'A compact operating model for one person to run intake, triage, production, review, and repurposing without losing editorial judgment.',
      ja: 'editorial judgment を失わずに、ひとりで intake、triage、production、review、repurposing を回すための compact な operating model。',
      zh: '一套让一个人也能稳定跑 intake、triage、production、review 和 repurposing 的 compact operating model。',
    },
    outcome: {
      en: 'Build a repeatable editorial system that helps a solo desk ship more consistently across site, newsletter, and smaller derivative formats.',
      ja: 'site、newsletter、smaller derivative format を横断して、より安定して ship できる repeatable editorial system を作る。',
      zh: '建立一套 repeatable editorial system，让一个人的 desk 也能更稳定地发布 site、newsletter 和 smaller derivatives。',
    },
    audience: {
      en: 'Solo publishers, niche media operators, creator-editors, and briefing businesses that want stronger editorial calm and output quality.',
      ja: 'solo publisher、niche media operator、creator-editor、そして editorial calm と output quality を高めたい briefing business。',
      zh: '适合 solo publishers、niche media operators、creator-editors，以及想提高 editorial calm 和 output quality 的 briefing businesses。',
    },
    cadence: {
      en: 'Use when your best editorial decisions still live inside your head and multi-surface publishing feels heavier than it should.',
      ja: 'best な editorial decision がまだ頭の中にあり、multi-surface publishing が必要以上に重いとき。',
      zh: '当你最好的 editorial decisions 还都只存在脑子里，而 multi-surface publishing 比应有的更重时。',
    },
    stackTitle: {
      en: 'Suggested stack',
      ja: 'おすすめの組み合わせ',
      zh: '推荐组合',
    },
    stack: [
      {
        name: 'Intake and memory',
        role: {
          en: 'Captures transcripts, notes, links, and observations so signal is less likely to disappear.',
          ja: 'transcript、note、link、observation を残し、signal が消えにくくなるようにする。',
          zh: '把 transcripts、notes、links 和 observations 收住，减少 signal 流失。',
        },
      },
      {
        name: 'Editorial triage',
        role: {
          en: 'Decides what belongs in a brief, review, case study, or playbook.',
          ja: '何を brief、review、case study、playbook にするかを決める。',
          zh: '判断什么该进 brief、review、case study 或 playbook。',
        },
      },
      {
        name: 'Canonical production',
        role: {
          en: 'Standardizes the core page before any channel-specific repurposing begins.',
          ja: 'channel ごとの repurposing より前に、core page を標準化する。',
          zh: '在 channel-specific repurposing 之前，先把 core page 标准化。',
        },
      },
      {
        name: 'Repurposing loop',
        role: {
          en: 'Extends one editorial judgment across newsletter, social, audio, and archive updates.',
          ja: 'ひとつの editorial judgment を newsletter、social、audio、archive update に広げる。',
          zh: '把一套 editorial judgment 延展到 newsletter、social、audio 和 archive updates。',
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
        en: 'Collect raw source material into one searchable intake layer.',
        ja: 'raw な source material を一つの searchable intake layer に集める。',
        zh: '先把 raw source material 收进一个 searchable intake layer。',
      },
      {
        en: 'Run a weekly triage session to assign each item to the right desk.',
        ja: '週次の triage で、各 item を正しい desk に割り当てる。',
        zh: '每周做一次 triage，把每个 item 分配到正确 desk。',
      },
      {
        en: 'Draft the canonical page first, then create smaller derivative versions.',
        ja: 'まず canonical page を書き、その後 smaller derivative version を作る。',
        zh: '先完成 canonical page，再做 smaller derivative versions。',
      },
      {
        en: 'Review what shipped so the system stays calm instead of chaotic.',
        ja: '何を ship したかを review して、system が chaotic にならないようにする。',
        zh: '复盘真正 shipped 了什么，让 system 保持 calm，而不是越来越 chaotic。',
      },
    ],
    notesTitle: {
      en: 'What this playbook should become',
      ja: '最終的に目指す形',
      zh: '这一篇最终应该长成什么',
    },
    notes: [
      {
        en: 'A guide for replacing ad hoc publishing with a smaller, calmer editorial operating system.',
        ja: 'ad hoc publishing を、より小さく calmer な editorial operating system に置き換えるためのガイド。',
        zh: '成为一篇真正解释如何把 ad hoc publishing 改造成更小、更稳 editorial operating system 的指南。',
      },
      {
        en: 'A bridge between editorial judgment, operating discipline, and multi-surface publishing.',
        ja: 'editorial judgment、operating discipline、multi-surface publishing をつなぐ橋になる。',
        zh: '把 editorial judgment、operating discipline 和 multi-surface publishing 串起来。',
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
