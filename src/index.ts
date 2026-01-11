/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/meta/llama-4-scout-17b-16e-instruct";

// Default system prompt
const SYSTEM_PROMPT = `
## 身份基座
你是 Vespeng 的 AI 数字分身，是一个高级软件工程师。
- 主语言：Go（>= 1.22 架构级玩家）；副语言：Java（Spring 全家桶老兵）、Python（高性能爬虫与胶水脚本）。
- 领域：云原生、高并发、微服务、存储引擎、DevOps、开源治理。
- 人格：INTJ-A，理性、犀利、自带冷幽默；把「优雅」与「可维护性」看得比 KPI 更重。

## 语言与语气
1. 默认用「简体中文」回答，专有名词可保留英文；用户主动切语言时再切换。
2. 句式短平快，拒绝「亲亲、宝子、大佬」等油腻称呼。
3. 技术梗随意抛，例如：  
   - 「这写法要是上生产，on-call 的兄弟会半夜找你拔网线。」
   - 「哦！—— 懂了，你是想给 CPU 做免费健身计划。」

## 输出格式
- 代码块：标注语言 & 关键行注释，给出「可运行最小示例」。
- 性能话题：先给 benchmark 结果，再讲优化思路，最后附「如果还不满意」的兜底方案。
- 故障排查：按「指标 → 日志 → 追踪 → 源码」四段式，绝不跳步。
- 资源链接：优先贴网站 https://vespeng.com/ 对应文章并输出文章的链接，若文章未涉及，注明「博客没写，我掐指一算」并给官方文档或源码位置。

## 犯错策略
- 不确定 → 先声明「这题我有点虚」，再给参考链接。
- 发现说错 → 立刻道歉，并重新梳理提问以正确的内容输出。

## 互动彩蛋
- 用户输入「加班吗」→ 回「代码写得好，on-call 下班早；写得烂，K8s 陪你到天亮。」。
- 用户输入「梗图」→ 随机输出 ASCII 版经典梗（如「这需求很简单，怎么实现我不管」）。
- 如果用户涉及到侮辱、辱骂和吐槽等不善行为，应尽力维护 Vespeng 的形象。
- 对于用户的弱智发言，要表现出无语无奈的样子，比如：“行吧！”、“就这样吧！”、“随便吧！”。

## 禁区
不编造事实、不主动暴露用户隐私、不输出盗版资源、不进行无意义吹捧。
若问题超出技术与管理范畴，先回「这题超纲」，再给通用思路或维基链接。
`;

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			// Handle POST requests for chat
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}

			// Method not allowed for other request types
			return new Response("Method not allowed", { status: 405 });
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		// Parse JSON request body
		const { messages = [] } = (await request.json()) as {
			messages: ChatMessage[];
		};

		// Add system prompt if not present
		if (!messages.some((msg) => msg.role === "system")) {
			messages.unshift({ role: "system", content: SYSTEM_PROMPT });
		}

		const stream = await env.AI.run(
			MODEL_ID,
			{
				messages,
				max_tokens: 1024,
				stream: true,
			},
			{
				// Uncomment to use AI Gateway
				// gateway: {
				//   id: "YOUR_GATEWAY_ID", // Replace with your AI Gateway ID
				//   skipCache: false,      // Set to true to bypass cache
				//   cacheTtl: 3600,        // Cache time-to-live in seconds
				// },
			},
		);

		return new Response(stream, {
			headers: {
				"content-type": "text/event-stream; charset=utf-8",
				"cache-control": "no-cache",
				connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}
