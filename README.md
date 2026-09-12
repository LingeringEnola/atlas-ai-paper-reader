# ATLAS — AI 论文阅读器 / AI Paper Reader

一个纯静态（零构建）的 AI 论文阅读网站：三栏黑白极简界面，左侧目录 / 思维导图，中间 pdf.js 阅读器，右侧双语结构化综述与闪卡、笔记、问答、知识卡片导出。

A zero-build static site: three-column minimal reader with TOC / mind map on the left, a pdf.js viewer in the middle, and a bilingual structured review plus flashcards, notes, chat and knowledge-card export on the right.

## 本地运行 / Run locally

仓库根目录即站点根目录，任意静态服务器均可：

```bash
npx serve .
# 或 / or
python -m http.server 8000
```

然后打开 http://localhost:8000 （端口以服务器输出为准）。

> 注意：不能用 `file://` 直接打开 index.html。ES modules 与 fetch 在 file 协议下被浏览器禁止，页面会给出提示。

首屏会自动加载内置示例论文 `assets/sample-paper.pdf`，无需配置任何 AI 接口即可体验完整演示（演示综述、章节中文要点、选区解释、预置问答）。

## 功能 / Features

- **PDF 阅读**：拖拽或点击「打开 PDF」上传；翻页 / 滚动双模式（滚动模式懒渲染并回收远端页面）；缩放 50%–300%、Fit width。
- **目录 TOC**：优先读取 PDF outline，无 outline 时按字号启发式提取标题；点击跳转；底部显示 READING n / N 进度。
- **思维导图**：由 TOC 与章节中文要点生成双侧水平 SVG 脑图，节点点击跳页，Fit 按钮重新适配。
- **AI EXPLAIN**：在正文选中文本弹出解释浮层，可复制、存为闪卡、存为笔记、转入问答。
- **结构化综述**：双语（English | 中文）章节表格，支持行内编辑、复制为 Markdown、导出 .md。
- **闪卡 / 笔记 / 问答 / 知识卡片**：全部保存在浏览器 localStorage，刷新后恢复；知识卡片可勾选范围导出 Markdown 或 JSON。
- **顶栏导出**：「导出知识库卡片」一键导出当前文档的综述 + 闪卡 + 笔记。

## AI 接入 / AI configuration

默认演示模式（仅示例论文）。在右栏「设置」中填入任意 OpenAI 兼容接口即可切换为真实生成：

- API Base URL（如 `https://api.openai.com/v1`，缺少 `/v1` 时会自动补全重试）
- API Key（仅存本机 localStorage，不会上传或导出）
- Model（留空为 `gpt-4o-mini`）
- 流式输出开关

长文档会按章节分块摘要后归并生成综述；解释与问答为单次请求。接口不可用（CORS、401、429 等）时会给出中文错误提示并回退到演示/引导状态。

## 目录结构 / Layout

```
index.html            唯一页面骨架
css/                  base / layout / pdf / panels 四份样式
js/
  main.js             入口与模块装配
  state.js            全局状态 + 发布订阅
  vendor/             pdf.js CDN 加载（版本 pin 唯一处）
  pdf/                viewer、toc、selection
  mindmap/            SVG 思维导图
  ai/                 adapter、openai-client、prompts
  data/               演示数据、选区匹配、导出
  store/              localStorage 封装
  panels/             右栏六个标签页
  ui/                 顶栏、浮层、toast、剪贴板
tools/make-sample-pdf.mjs   零依赖生成示例 PDF
assets/sample-paper.pdf     生成产物（已提交）
```

重新生成示例论文：

```bash
node tools/make-sample-pdf.mjs
```

## 发布到 GitHub Pages / Publishing

1. 推送本仓库到 GitHub；
2. Settings → Pages → Source 选择 `Deploy from a branch`，分支 `main`（或 `master`）、目录 `/ (root)`；
3. 保存后访问 `https://<user>.github.io/<repo>/`。

站点全部使用相对路径，并提交了 `.nojekyll`，子目录部署无需额外配置。pdf.js 通过 jsDelivr CDN 加载（失败自动回退 unpkg），示例论文随仓库分发。

## 浏览器要求 / Requirements

现代浏览器（Chrome / Edge / Firefox / Safari 近两年版本），需启用 JavaScript 与 localStorage。
