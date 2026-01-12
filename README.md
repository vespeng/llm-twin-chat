# LLM Twin Chat

由 Cloudflare Workers AI 的 `llm-chat-app-template` 模板深度定制，将通用聊天模板转化为个人数字分身，全栈运行在全球边缘节点。

## 特性

- 💬 简洁响应式的聊天界面
- ⚡ 服务器发送事件（SSE）流式响应
- 🧠 基于 Cloudflare Workers AI 大语言模型
- 🛠️ 基于 TypeScript 和 Cloudflare Workers 构建
- 📱 移动端友好设计
- 🔄 客户端维护聊天历史
- 🔎 内置可观测性日志记录

## 快速开始

### 先决条件

- [Node.js](https://nodejs.org/) (v18 或更高版本)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- 拥有 Workers AI 访问权限的 Cloudflare 账户

### 安装

1. 克隆此仓库：

   ```bash
   git clone https://github.com/vespeng/llm-twin-chat.git
   cd llm-twin-chat.git
   ```

2. 安装依赖项：

   ```bash
   npm install
   ```

3. 生成 Worker 类型定义：
   ```bash
   npm run cf-typegen
   ```

### 开发

启动本地开发服务器：

```bash
npm run dev
```

这将在 http://localhost:8787 启动本地服务器。

_ps：即使在本地开发期间使用 Workers AI 也会访问你的 Cloudflare 账户，从而产生使用费用。_

### 部署

部署到 Cloudflare Workers：

```bash
npm run deploy
```

### 监控

查看与任何已部署 Worker 关联的实时日志：

```bash
npm wrangler tail
```

## 项目结构

```
/
├── public/             # 静态资源
│   ├── index.html      # 聊天 UI HTML
│   └── chat.js         # 聊天 UI 前端脚本
├── src/
│   ├── index.ts        # 主 Worker 入口点
│   └── types.ts        # TypeScript 类型定义
├── test/               # 测试文件
├── wrangler.jsonc      # Cloudflare Worker 配置
├── tsconfig.json       # TypeScript 配置
└── README.md           # 此文档
```

## 自定义

### 更改模型

要使用不同的 AI 模型，请更新 src/index.ts 中的 MODEL_ID 常量。你可以在 Cloudflare Workers AI 文档 中找到可用模型。

### 修改系统提示词

可以通过更新 src/index.ts 中的 SYSTEM_PROMPT 常量来更改默认系统提示词，使其符合你的数字分身人格和行为模式。

### 样式

UI 样式包含在 public/index.html 的 <style> 部分。可以修改顶部的 CSS 变量以快速更改配色方案。

## 资源

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
