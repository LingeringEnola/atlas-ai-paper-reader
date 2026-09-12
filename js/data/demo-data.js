export const DEMO_DOC_ID = 'sample-paper-v1';

export const demoReview = {
  title: { en: 'Artificial Intelligence and the Equilibrium of Production', zh: '人工智能与生产均衡' },
  authors: { en: 'A. Researcher', zh: '示例作者' },
  venue: { en: 'ATLAS Working Paper No. 1, 2025', zh: 'ATLAS 工作论文第 1 号，2025' },
  sections: [
    {
      no: 'I',
      titleEn: 'Research Question',
      titleZh: '研究问题',
      rows: [
        {
          en: 'This paper evaluates claims about large macroeconomic implications of new advances in AI. It asks: are such large effects plausible, and if productivity gains materialize, who will be their beneficiaries?',
          zh: '本文评估关于 AI 新进展具有重大宏观影响的论断。它追问：如此巨大的效应是否可信？若生产率提升确实发生，谁将是受益者？',
        },
        {
          en: 'Specifically, it investigates the medium-term (about ten-year) effects of AI on aggregate productivity (TFP and GDP), wages, and inequality.',
          zh: '具体而言，本文考察 AI 在中长期（约十年）对总体生产率（TFP 与 GDP）、工资与不平等的效应。',
        },
      ],
    },
    {
      no: 'II',
      titleEn: 'Core Methodology',
      titleZh: '核心方法',
      rows: [
        {
          en: 'A task-based model in which a continuum of tasks can be performed by labor or capital; firms choose the cheaper method, and a threshold task index summarizes the equilibrium allocation.',
          zh: '任务模型：连续统任务可由劳动或资本完成，企业择廉而用，阈值任务指数刻画均衡任务分配。',
        },
        {
          en: "A version of Hulten's theorem aggregates task-level cost savings: TFP growth equals the cost share of affected tasks times the average cost saving.",
          zh: '以 Hulten 定理加总任务层成本节约：TFP 增速等于受影响任务的成本份额乘以平均成本节约。',
        },
        {
          en: 'Comparative statics on the four AI channels: automation of new tasks, task complementarities, deepening of existing automation, and new-task creation.',
          zh: '对 AI 的四种渠道进行比较静态分析：新任务自动化、任务互补、既有自动化深化与新任务创造。',
        },
      ],
    },
    {
      no: 'III',
      titleEn: 'Main Findings',
      titleZh: '主要发现',
      rows: [
        {
          en: "So long as AI's microeconomic effects take the form of cost savings at the task level, macroeconomic consequences are modest: implied TFP gains are on the order of a few tenths of a percent per year on current evidence.",
          zh: '只要 AI 的微观效应表现为任务层成本节约，宏观后果就相当有限：按现有证据，隐含的 TFP 增益约为每年零点几个百分点。',
        },
        {
          en: 'Early evidence comes from easy-to-learn tasks with clean performance measures; future exposure concentrates on hard-to-learn, context-dependent tasks, so predicted gains shrink further.',
          zh: '早期证据来自易学且有清晰绩效度量的任务；未来暴露集中于依赖情境的难学任务，故预测增益进一步缩小。',
        },
      ],
    },
    {
      no: 'IV',
      titleEn: 'Wages and Inequality',
      titleZh: '工资与不平等',
      rows: [
        {
          en: 'Even when AI raises the productivity of low-skill workers, equilibrium reallocation can increase rather than reduce inequality: the capital share rises and the capital-labor income gap widens.',
          zh: '即使 AI 提升低技能工人的生产率，均衡再分配也可能扩大而非缩小不平等：资本份额上升，资本与劳动的收入差距扩大。',
        },
        {
          en: 'When the elasticity of substitution across tasks is low, the displacement effect dominates: workers crowd onto fewer tasks and wages can fall even as output rises.',
          zh: '当任务间替代弹性较低时，替代效应主导：工人挤向更少的任务，产出上升的同时工资可能下降。',
        },
      ],
    },
    {
      no: 'V',
      titleEn: 'Limitations and Outlook',
      titleZh: '局限与展望',
      rows: [
        {
          en: 'The framework is static and competitive; it abstracts from dynamics, market power, and institutional responses.',
          zh: '框架为静态竞争均衡，抽象掉了动态过程、市场势力与制度反应。',
        },
        {
          en: 'Some new tasks created by AI (for example, algorithmic manipulation of attention) may carry negative social value despite being privately profitable.',
          zh: 'AI 创造的某些新任务（例如算法化的注意力操纵）虽私人盈利，却可能具有负社会价值。',
        },
      ],
    },
  ],
  source: 'demo',
};

export const demoTocBullets = {
  Abstract: ['用任务模型评估 AI 的宏观影响', '宏观增益 = 受影响任务份额 × 平均成本节约'],
  '1. Introduction': ['AI 快速普及，各方预测生产率大幅提升', '本文以任务模型评估未来十年的宏观影响'],
  '2. Conceptual Framework': ['任务连续统上劳动与资本择廉而用', '阈值任务指数内生决定任务分配'],
  '3. Equilibrium': ['均衡三条件：成本最小化、资本最优、劳动市场清市', '有限产出条件保证均衡唯一'],
  '4. How AI Could Affect Production': ['AI 四渠道：自动化、互补、深化、新任务', '新任务可能具有负社会价值'],
  '5. Equilibrium Wages and Comparative Statics': ['自动化有正生产率效应与负替代效应', '替代弹性低时任务互补对工资提升有限，劳动份额下降'],
  "6. Hulten's Theorem": ['TFP 增速 = 受影响任务成本份额 × 平均成本节约', '早期证据来自易学任务，宏观预测应更保守'],
  '7. Conclusion': ['宏观大效应需广暴露或深节约，当前证据不足', '资本份额上升或扩大资本-劳动收入差距'],
};

export const demoExplains = [
  {
    match: 'task-based',
    zh: '任务模型（task-based model）把生产拆解为一系列“任务”，每种任务可由劳动或资本完成。AI 的影响因此可以被精确地定位到具体任务上：哪些任务被自动化、哪些任务上劳动生产率被增强、哪些新任务被创造。相比把 AI 当作笼统的“资本”或“全要素生产率冲击”，任务模型能同时刻画生产率与收入分配两条通道。',
  },
  {
    match: "Hulten's theorem",
    zh: "Hulten 定理把微观层面的成本节约加总为宏观生产率增长：TFP 增速 ≈ 受影响任务的成本份额 × 平均成本节约率。它意味着“影响面 × 深度”的算术——若只有少数任务被显著改进，宏观效应必然有限。文中用它把任务层证据直接换算为十年 TFP 预测。",
  },
  {
    match: 'comparative statics',
    zh: '比较静态分析考察外生参数（自动化成本、互补强度、替代弹性等）变化后均衡如何移动。本文借此分离自动化的正生产率效应与负替代效应，并给出工资与劳动份额升跌的条件。',
  },
  {
    match: 'threshold',
    zh: '阈值任务指数是任务分配的充分统计量：索引低于阈值的任务由资本完成，高于阈值的由劳动完成。阈值内生决定于劳动与资本的相对成本及各自的比较优势，自动化推进即阈值右移。',
  },
  {
    match: 'total factor productivity',
    zh: '全要素生产率（TFP）衡量不能被要素投入解释的产出增长。文中借助 Hulten 定理说明：任务层成本节约必须足够广、足够深，才能产生可观的 TFP 增长；当前任务层证据支持的幅度很小。',
  },
  {
    match: 'automation',
    zh: '自动化渠道指 AI 接管原先由劳动执行的任务。它一方面降低生产成本、提升总体生产率，另一方面把劳动挤出这些任务（替代效应）；当任务间替代弹性低时，被挤出的工人涌向剩余任务，压低工资。',
  },
  {
    match: 'complement',
    zh: '任务互补渠道指 AI 增强仍由劳动执行的任务上的有效劳动投入，直接抬高这些任务的边际产品价值与工资。但其宏观权重受限于劳动保留任务的份额：若自动化已拿走大量任务，互补的工资效应有限。',
  },
  {
    match: 'new tasks',
    zh: '新任务渠道指 AI 创造出劳动起初具有比较优势的新活动。它扩大了劳动创造价值的空间，但文中提醒：某些新任务（如算法化的注意力操纵）私人盈利却可能具有负社会价值，故新任务创造不自动等于社会进步。',
  },
  {
    match: 'inequality',
    zh: '在本框架中，不平等的关键机制是任务再分配：自动化区域扩张提高资本份额，即使低技能工人绝对收入上升，资本与劳动之间的收入差距仍会扩大——这是 AI"可能加剧不平等"的精确含义。',
  },
  {
    match: 'elasticity of substitution',
    zh: '任务间替代弹性刻画生产重组的难易程度。弹性低时，劳动被挤出后难以在剩余任务上保持产出，替代效应主导，工资可能随产出上升而下降；弹性高时再分配平滑，生产率效应更充分地传递到工资。',
  },
  {
    match: 'cost saving',
    zh: '成本节约是文中微观效应的统一度量：无论自动化、深化还是互补，最终都表现为某类任务单位成本的下降。Hulten 加总正是以成本份额为权重对这些节约加权平均。',
  },
  {
    match: 'wage',
    zh: '均衡工资等于劳动在其保留任务集合上的边际产品价值加总。因此工资同时受三个对象驱动：保留任务上的生产率、自动化技术、以及任务分配本身（广延边际）。这解释了"产出升而工资跌"的可能性。',
  },
];

export const demoChat = [
  {
    q: '这篇文章的核心结论是什么？',
    a: '核心结论是：只要 AI 的微观效应表现为任务层的成本节约，其宏观后果就是有限的——按当前任务层证据，十年期 TFP 增益约为每年零点几个百分点；且早期证据来自易学任务，真实增益可能更低。分配方面，即使低技能工人生产率上升，资本份额扩张仍可能扩大不平等。',
  },
  {
    q: "Hulten 定理在文中起什么作用？",
    a: '它是全文的加总工具：把"受影响任务的成本份额 × 平均成本节约"换算为 TFP 增速，使作者能用任务层微观证据直接约束宏观预测，并说明"大效应"需要"广暴露"或"深节约"，而两者都缺乏证据支持。',
  },
  {
    q: 'AI 一定会缩小不平等吗？',
    a: '不一定。文中表明：即使 AI 提升低技能工人的生产率，均衡的任务再分配也会抬高资本份额，扩大资本与劳动的收入差距；当任务间替代弹性低时，工人挤向更少的任务，工资甚至可能绝对下降。',
  },
  {
    q: '什么是"负社会价值的新任务"？',
    a: '指 AI 创造出的、私人盈利但社会价值为负的新活动，文中例子是算法化的注意力操纵。它们计入 GDP 与就业，却不增进福利，因此"AI 创造新任务"不自动构成乐观理由。',
  },
];
