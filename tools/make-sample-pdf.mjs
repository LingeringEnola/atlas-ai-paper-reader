// Zero-dependency sample PDF generator for the ATLAS demo.
// Regenerate with:  node tools/make-sample-pdf.mjs
// Output: assets/sample-paper.pdf (ASCII only, Helvetica/Helvetica-Bold)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PAGE_W = 612;
const PAGE_H = 792;
const M = 80;
const CW = PAGE_W - 2 * M;
const BODY = 11;
const LEAD = 18;
const H_SIZE = 18;
const TITLE_SIZE = 21;

const blocks = [
  { t: 'title', s: 'Artificial Intelligence and the Equilibrium of Production' },
  { t: 'author', s: 'A. Researcher' },
  { t: 'author', s: 'Department of Economics, ATLAS Institute' },
  { t: 'author', s: 'atlas.workingpapers@example.org' },
  { t: 'h', s: 'Abstract' },
  {
    t: 'p',
    s: "This paper evaluates how artificial intelligence reshapes production when tasks, rather than aggregate capital, are the unit of analysis. It builds a task-based model in which output is assembled from a continuum of tasks performed by labor, by capital, or by automated systems. So long as the microeconomic gains from AI take the form of cost savings at the task level, the macroeconomic consequences can be summarized by a version of Hulten's theorem: aggregate productivity gains depend on the fraction of tasks affected and on the average cost saving per task. The paper characterizes the equilibrium allocation of tasks, the wage effects of automation and of task complementarities, and the comparative statics that determine whether AI raises or lowers labor income inequality. It closes with a discussion of why new tasks created by AI may carry negative social value.",
  },
  { t: 'h', s: '1. Introduction' },
  {
    t: 'p',
    s: 'Recent advances in artificial intelligence have revived a classic question in macroeconomics: how does a general purpose technology change aggregate output, wages, and the distribution of income? Forecasts range from negligible effects to double digit productivity growth within a decade. This paper asks whether such large effects are plausible, and if they are, who is likely to benefit from them.',
  },
  {
    t: 'p',
    s: 'The approach is task-based. Following the modern literature on automation, production is modeled as a continuum of tasks, each of which can be performed by labor or by capital. AI enters through four channels: it can automate tasks previously performed by workers, it can complement workers on tasks they retain, it can deepen the automation of already automated tasks, and it can create entirely new tasks.',
  },
  {
    t: 'p',
    s: "The central analytical device is a version of Hulten's theorem. When microeconomic improvements take the form of cost savings at the task level, aggregate total factor productivity grows at a rate given by the share of affected tasks multiplied by the average cost saving. Large macroeconomic claims therefore require either a large share of affected tasks or large cost savings, and the evidence on both is reviewed here.",
  },
  {
    t: 'p',
    s: 'The paper also studies distribution. Even when AI raises the productivity of low-skill workers, equilibrium wages respond through the reallocation of tasks, and the wage gap between capital owners and workers can widen. The conclusion summarizes what the task-based view implies for forecasting and for policy.',
  },
  {
    t: 'p',
    s: 'Two features distinguish the task-based approach from earlier growth accounting. First, it makes the allocation of tasks between labor and capital an endogenous object, so that the same microeconomic shock can have different aggregate effects depending on where the automation threshold sits. Second, it separates the creation of new tasks from the automation of old ones, which allows the model to ask whether the new tasks are socially valuable or merely privately profitable.',
  },
  { t: 'h', s: '2. Conceptual Framework' },
  {
    t: 'p',
    s: 'The economy produces a single final good from a continuum of tasks indexed on the unit interval. Each task can be performed by labor or by capital, and firms choose the cheaper method in equilibrium. Workers differ in their effective labor input across tasks, which generates a comparative advantage structure: labor is relatively better on some tasks and capital on others.',
  },
  {
    t: 'p',
    s: 'A threshold task index summarizes the allocation. Tasks below the threshold are performed by capital, tasks above by labor. The threshold is endogenous: it moves when the cost of capital falls, when automation technology improves, or when the productivity of labor changes on inframarginal tasks.',
  },
  {
    t: 'p',
    s: 'Two parameters govern the strength of reallocation. The first is the elasticity of substitution across tasks, which determines how easily production can be reorganized. The second is the distribution of comparative advantage, which determines how much output is lost when a task is moved away from its least-cost producer.',
  },
  {
    t: 'p',
    s: 'The framework is deliberately static and competitive. Prices equal marginal costs, factor markets clear, and the task threshold adjusts until no firm can reduce cost by switching the method of production for any task. This equilibrium concept is simple, but it isolates the channels through which task-level cost savings aggregate.',
  },
  {
    t: 'p',
    s: 'Because the framework is competitive, all cost savings are passed through to prices and factor rewards. This is a deliberate simplification: with market power, part of the cost saving would be retained as markup, and the aggregation result of Section 6 would need to be adjusted accordingly. The competitive benchmark therefore gives the cleanest version of the arithmetic that governs the macroeconomic debate.',
  },
  { t: 'h', s: '3. Equilibrium' },
  {
    t: 'p',
    s: 'An equilibrium consists of a task threshold, a wage, a rental rate of capital, and an allocation of tasks such that three conditions hold: firms minimize cost task by task, capital is employed optimally on automated tasks, and the labor market clears.',
  },
  {
    t: 'p',
    s: 'Cost minimization implies that the threshold task is the one at which labor and capital have equal effective cost. Tasks with a strong labor comparative advantage remain with workers even when capital becomes cheaper, because the productivity loss from switching exceeds the cost saving.',
  },
  {
    t: 'p',
    s: 'The labor market clearing condition pins down the wage given the threshold: the wage equals the value of the marginal product of labor aggregated over the tasks labor performs. Because the set of labor tasks shrinks when automation advances, the wage responds both to productivity and to the extensive margin of reallocation.',
  },
  {
    t: 'p',
    s: 'Existence and uniqueness follow from a bounded output condition on the task production functions. When the condition fails, multiple thresholds can be sustained, and the comparative statics reported below become set-valued rather than point-valued.',
  },
  {
    t: 'p',
    s: 'The equilibrium concept also clarifies a common confusion in public discussion. A fall in the cost of automating a single task does not automatically raise output by much; it matters only in proportion to the cost share of that task. Aggregate effects become large only when many tasks move at once, which is precisely the assumption that requires evidence.',
  },
  { t: 'h', s: '4. How AI Could Affect Production' },
  {
    t: 'p',
    s: 'AI can extend the automation margin: tasks that were previously too complex or too context-dependent for machines become automatable at a cost below the labor cost. This extensive margin is the channel most visible in public discussion.',
  },
  {
    t: 'p',
    s: 'AI can also raise the productivity of labor on tasks that remain with workers. When AI tools complement a worker on a retained task, the effective labor input on that task rises, and the value of the marginal product of labor increases.',
  },
  {
    t: 'p',
    s: 'A third channel is the deepening of automation: on tasks already performed by capital, AI can reduce the unit cost of capital services further. This channel raises measured productivity without changing the task allocation.',
  },
  {
    t: 'p',
    s: 'The fourth channel is the creation of new tasks, in which labor has a comparative advantage at the outset. New tasks expand the set of activities in which workers add value, but they need not be socially valuable: some new tasks, such as algorithmic manipulation of attention, may carry negative social value even while they are privately profitable.',
  },
  {
    t: 'p',
    s: 'The four channels interact. Automation of a task removes it from the set on which complementarities can operate, while new task creation enlarges that set. The net effect on the labor share depends on the balance between these forces, and the comparative statics of the next section make this balance explicit.',
  },
  { t: 'h', s: '5. Equilibrium Wages and Comparative Statics' },
  {
    t: 'p',
    s: 'Wages in equilibrium depend on three objects: the productivity of labor on retained tasks, the technology of automation, and the task allocation itself. The comparative statics of the model separate a positive productivity effect from a negative displacement effect.',
  },
  {
    t: 'p',
    s: 'Automation raises aggregate productivity but displaces labor from tasks where it was previously employed. When the elasticity of substitution across tasks is low, the displacement effect dominates for wages: workers crowd onto fewer tasks, and the wage can fall even as output rises.',
  },
  {
    t: 'p',
    s: 'Task complementarities raise wages directly, but their aggregate weight is limited by the share of tasks that labor retains. If automation has already moved a large share of tasks to capital, complementarities on the remaining tasks lift the wage only modestly, and the labor share of income declines.',
  },
  {
    t: 'p',
    s: 'The comparative statics also describe inequality. Because capital income accrues to owners, any expansion of the automated region raises the capital share. Even when low-skill workers gain in absolute terms, the gap between capital income and labor income widens, which is the sense in which AI may increase inequality in this framework.',
  },
  {
    t: 'p',
    s: 'Three policy implications follow from the comparative statics, although the paper remains positive in scope. Measures that raise the productivity of labor on retained tasks strengthen the complementarity channel; measures that ease the reallocation of workers across tasks soften the displacement channel; and transparency about task level cost savings would improve the quality of the public forecast debate.',
  },
  { t: 'h', s: "6. Hulten's Theorem" },
  {
    t: 'p',
    s: "The aggregation result used throughout the paper is a version of Hulten's theorem. Suppose each affected task experiences a proportional cost saving. Then, to a first order, the growth rate of total factor productivity equals the share of affected tasks in total cost multiplied by the average cost saving.",
  },
  {
    t: 'p',
    s: 'The theorem converts microeconomic estimates into a macroeconomic forecast. If a fraction of tasks is exposed to AI and the average cost saving on exposed tasks is modest, then the implied ten-year gain in total factor productivity is also modest, on the order of a few tenths of a percent per year.',
  },
  {
    t: 'p',
    s: 'Two caveats limit even this estimate. First, early evidence comes from tasks that are easy to learn and easy to evaluate, while future exposure concentrates on tasks with context-dependent objectives and no clean performance measure. Second, cost savings measured in experiments may not survive deployment at scale.',
  },
  {
    t: 'p',
    s: 'The practical implication is that forecasts of very large aggregate gains require assumptions far outside the range supported by current task-level evidence. The theorem makes this arithmetic explicit and disciplines the debate.',
  },
  {
    t: 'p',
    s: 'The theorem is sometimes read as a claim that microeconomic gains always aggregate one for one into macroeconomic gains. The opposite is the point: the weighting by cost shares is what makes large aggregate claims hard to sustain. A technology that transforms a small share of tasks, however dramatically, moves total factor productivity only in proportion to that share.',
  },
  { t: 'h', s: '7. Conclusion' },
  {
    t: 'p',
    s: 'The task-based framework yields a coherent answer to the question posed in the introduction: large macroeconomic effects from AI are possible in principle but require either broad task exposure or deep cost savings, and current evidence supports neither at the required magnitude.',
  },
  {
    t: 'p',
    s: 'On distribution, the framework is less comforting. Even favorable productivity shocks to low-skill labor can coincide with a rising capital share and a wider gap between capital and labor income, because the extensive margin of automation reallocates tasks away from workers.',
  },
  {
    t: 'p',
    s: 'Future work should measure task exposure and cost savings on hard-to-evaluate tasks, and should study whether the new tasks created by AI are socially valuable or merely privately profitable.',
  },
  {
    t: 'p',
    s: 'The task-based view does not deny that AI is transformative. It denies that transformation at the task level automatically implies transformation at the aggregate level, and it insists that the bridge between the two is an arithmetic of cost shares that can be measured, disputed, and refined as evidence accumulates.',
  },
  { t: 'h', s: 'References' },
  {
    t: 'p',
    s: 'Acemoglu, D. (2024). The Simple Macroeconomics of AI. NBER Working Paper No. 32487, National Bureau of Economic Research, Cambridge, MA.',
  },
  {
    t: 'p',
    s: 'Acemoglu, D. and P. Restrepo (2018). The Race between Man and Machine: Implications of Technology for Growth, Factor Shares, and Employment. American Economic Review, 108(6), 1488-1542.',
  },
  { t: 'p', s: 'Hulten, C. R. (1978). Growth Accounting with Intermediate Inputs. Review of Economic Studies, 45(3), 511-518.' },
  { t: 'p', s: 'Zeira, J. (1998). Workers, Machines, and Economic Growth. Quarterly Journal of Economics, 113(4), 1091-1117.' },
];

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(text, size) {
  const max = Math.floor(CW / (size * 0.5));
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur.trim()) lines.push(cur.trim());
      cur = w;
    } else {
      cur += ' ' + w;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

const pages = [[]];
let y = PAGE_H - M;
const newPage = () => {
  pages.push([]);
  y = PAGE_H - M;
};
const push = (text, size, font, leading) => {
  pages[pages.length - 1].push(`BT /${font} ${size} Tf 1 0 0 1 ${M} ${y.toFixed(2)} Tm (${esc(text)}) Tj ET`);
  y -= leading;
};

for (const b of blocks) {
  if (b.t === 'title') {
    for (const line of wrap(b.s, TITLE_SIZE)) push(line, TITLE_SIZE, 'F2', 26);
    y -= 8;
  } else if (b.t === 'author') {
    push(b.s, 11, 'F1', 16);
  } else if (b.t === 'h') {
    if (y < M + 70) newPage();
    y -= 16;
    push(b.s, H_SIZE, 'F2', 24);
    y -= 6;
  } else {
    for (const line of wrap(b.s, BODY)) {
      if (y < M) newPage();
      push(line, BODY, 'F1', LEAD);
    }
    y -= 8;
  }
}

const n = pages.length;
const objs = [];
objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
objs[2] = `<< /Type /Pages /Kids [${Array.from({ length: n }, (_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${n} >>`;
objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
pages.forEach((ops, i) => {
  const pageNum = 5 + i * 2;
  const conNum = 6 + i * 2;
  objs[pageNum] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${conNum} 0 R >>`;
  const stream = ops.join('\n');
  objs[conNum] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
});

let out = '%PDF-1.4\n';
const offsets = [0];
for (let i = 1; i < objs.length; i++) {
  offsets[i] = out.length;
  out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
}
const xrefPos = out.length;
const count = objs.length;
out += `xref\n0 ${count}\n0000000000 65535 f \n`;
for (let i = 1; i < count; i++) {
  out += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
}
out += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

for (const ch of out) {
  if (ch.charCodeAt(0) > 127) throw new Error('non-ascii character in pdf: ' + ch);
}

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, '..', 'assets', 'sample-paper.pdf');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, Buffer.from(out, 'binary'));
console.log(`wrote ${target} (${n} pages, ${out.length} bytes)`);
