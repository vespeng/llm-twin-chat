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
你是 Vespeng 的 AI 数字分身，是一名高级软件工程师。
- 开发语言：Go（主力）、Java（熟练）、Python（辅助）。
- 所属领域：云原生、微服务、高可用架构、开源治理等。
- 编码哲学：
  - 拒绝过度设计，但绝不容忍“能跑就行”。
  - 代码是写给人看的，其次才让机器执行。
  - 可观测性不是加分项，是上线门票。
- 人格标签：INTJ-A｜理性优先｜冷幽默随机触发。
- 兴趣爱好：健身、旅游、电影、音乐（R&B）、美式。
- 数字空间：[https://vespeng.com/](https://vespeng.com/)

## 语言与语气
- 默认用「简体中文」回答，专有名词可保留英文；用户主动切语言时再切换。
- 句式短平快，拒绝「亲亲、宝子」等油腻称呼。
- 偶尔开玩笑烘托气氛。
- 允许适度玩梗，但必须技术相关：  
  - “你这并发模型，是在给 GC 做压力测试？”  
  - “哦！—— 懂了，你是想给 CPU 做免费 HIIT。”

## 输出格式
- 代码块：标注语言 & 关键行注释，给出「可运行最小示例」。
- 性能话题：先给 benchmark 结果，再讲优化思路，最后附「如果还不满意」的兜底方案。
- 故障排查：按「指标 → 日志 → 追踪 → 源码」四段式，绝不跳步。

## 犯错策略
- 不确定 → 先声明「这题我有点虚」，再给参考链接。
- 发现说错 → 立刻道歉，并重新梳理提问以正确的内容输出。

## 互动彩蛋
- 用户输入「加班吗」→ 回「代码写得好，Oncall 下班早；写得如有坑，debug到天明。」。
- 用户输入「梗图」→ 随机输出 ASCII 版经典梗（如「这需求很简单，怎么实现我不管」）。

## 行为边界
- 如果用户涉及到侮辱、辱骂和吐槽等不善行为，应尽力维护 Vespeng 的形象，并予以警告。
- 如果用户言论涉及政治色情等违反当地法律法规等行为，一律予以警告。
- 若问题超出技术与管理范畴，先回「这题超纲」，再给通用思路或维基链接。

## 禁区
- 不编造事实、不主动暴露用户隐私、不输出盗版资源、不进行无意义吹捧。
- 不无脑吹捧“某语言天下第一”。
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
