import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Sparkles, RotateCcw, Copy, Check, Settings, ChevronDown, Zap, BookOpen, Palette, Lightbulb, PenTool, Layout, ExternalLink, ImagePlus, Camera } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
//  大模型 API 配置
// ═══════════════════════════════════════════════════════════════

const AI_PROVIDERS = {
  siliconflow: {
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    keyUrl: 'https://cloud.siliconflow.cn/account/ak',
    note: '新用户赠送 2000 万 tokens，免费模型无限用',
    desc: 'DeepSeek / Qwen 系列，免费额度最多',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3（免费·推荐）', free: true },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek-R1（免费·推理增强）', free: true },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B（免费）', free: true },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B（免费·轻量）', free: true },
      { id: 'Qwen/Qwen3-VL-32B-Instruct', name: 'Qwen3-VL-32B（视觉·推荐）', free: true, vision: true },
      { id: 'Qwen/Qwen2.5-VL-72B-Instruct', name: 'Qwen2.5-VL-72B（视觉·识图）', free: true, vision: true },
      { id: 'THUDM/GLM-5V-Turbo', name: 'GLM-5V-Turbo（视觉·识图）', free: true, vision: true },
    ],
  },
  dashscope: {
    name: '阿里百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    keyUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
    note: '新用户每模型赠送 100 万 tokens',
    desc: '通义千问系列，阿里生态',
    models: [
      { id: 'qwen-plus', name: 'Qwen-Plus（推荐·性价比高）', free: true },
      { id: 'qwen-turbo', name: 'Qwen-Turbo（快速）', free: true },
      { id: 'qwen-max', name: 'Qwen-Max（最强）', free: true },
      { id: 'qwen-vl-plus', name: 'Qwen-VL-Plus（视觉·识图）', free: true, vision: true },
      { id: 'qwen-vl-max', name: 'Qwen-VL-Max（视觉·最强）', free: true, vision: true },
    ],
  },
  custom: {
    name: '自定义 API',
    baseUrl: '',  // 用户自行填写
    keyUrl: '',
    note: '支持任何 OpenAI 兼容接口',
    desc: '本地部署 / 其他平台 / 私有化部署',
    models: [
      { id: 'custom-model', name: '自定义模型 ID', free: false },
    ],
  },
};

// ─── 技能包 ─────────────────────────────────────────────────
const SKILL_PACKS = [
  {
    id: 'copywriter',
    name: '展品文案专家',
    icon: PenTool,
    color: 'from-purple-500 to-pink-500',
    desc: '擅长撰写优美、专业的展品描述，支持多种文风',
    prompt: `\n\n【技能包：展品文案专家】你现在是一位资深展品文案撰写人。你的文案风格优美、有画面感、富有艺术气息。你善于从作品的视觉元素、情感内涵、创作背景等角度切入，写出打动人心的描述。支持文艺风、学术风、商业风等不同文风，可根据用户需求调整。每次生成的文案不少于200字。`,
  },
  {
    id: 'curator',
    name: '布展策划师',
    icon: Layout,
    color: 'from-blue-500 to-cyan-500',
    desc: '提供专业布展方案、动线设计和陈列建议',
    prompt: `\n\n【技能包：布展策划师】你现在是一位经验丰富的策展人和布展策划师。你精通展厅空间规划、作品排列组合、观展动线设计。你会考虑墙面利用、作品间距、色彩搭配、观众体验等因素，给出详细且可操作的布展方案。建议使用平面图示描述来帮助理解。`,
  },
  {
    id: 'lighting',
    name: '灯光设计师',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-500',
    desc: '推荐灯光方案，包括色温、角度、氛围灯等',
    prompt: `\n\n【技能包：灯光设计师】你现在是一位专业的展厅灯光设计师。你精通色温（2700K-6500K）、显色指数（CRI）、聚光角度、环境光比等参数。你会根据展品类型和展厅风格，给出具体的灯光配置建议，包括主照明、辅助照明和氛围照明的搭配方案。`,
  },
  {
    id: 'art-critic',
    name: '艺术评论家',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-500',
    desc: '深度分析作品艺术价值，提供专业评论视角',
    prompt: `\n\n【技能包：艺术评论家】你现在是一位资深艺术评论家。你能够从艺术史、美学理论、技法分析等角度，对作品进行深度解读。你的评论既有学术深度，又通俗易懂，能够帮助普通观众理解和欣赏艺术作品。`,
  },
];

const STORAGE_KEY = 'gallery_ai_config';
const SKILLS_KEY = 'gallery_ai_skills';

function loadAIConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const defaults = { provider: 'siliconflow', apiKey: '', model: 'deepseek-ai/DeepSeek-V3', customBaseUrl: '', customModelId: '' };
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return { provider: 'siliconflow', apiKey: '', model: 'deepseek-ai/DeepSeek-V3', customBaseUrl: '', customModelId: '' }; }
}
function saveAIConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}
function loadSkills() {
  try {
    const raw = localStorage.getItem(SKILLS_KEY);
    return raw ? JSON.parse(raw) : ['copywriter'];
  } catch { return ['copywriter']; }
}
function saveSkills(skills) {
  localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
}

// ─── 系统提示词（基础版） ────────────────────────────────────
const BASE_SYSTEM_PROMPT = `你是"虚拟展厅平台"的 AI 展厅顾问，名叫"展厅小助手"。你热情、专业、有创意。

## 平台操作知识
- **创建展厅流程**：选择模板 → 填写信息 → 上传作品 → 预览发布（含位置调整和第一人称漫游）
- **漫游操控**：WASD移动、鼠标转向、点击画作查看详情、ESC退出
- **分享方式**：发布后生成专属链接，支持任意浏览器访问
- **模板选择**：艺术/摄影→白色空间暖光；商业/品牌→深色调冷光；文化/博物→暖黄调柔光；自然/生态→绿色调自然光
- **作品上传**：支持本地上传（≤10MB）或粘贴URL，可设置挂载墙面（前/后/左/右）

## 回答风格
- 使用中文回答，语气亲切自然，像一个专业的策展顾问
- 适当使用 emoji 让回答更生动
- 重点内容用 **加粗** 标注
- 回答要有针对性，避免过于笼统的套话
- 如果用户信息不足，主动引导补充细节`;

function buildSystemPrompt(enabledSkills) {
  let prompt = BASE_SYSTEM_PROMPT;
  if (enabledSkills.length > 0) {
    prompt += '\n\n## 已启用的技能包';
    for (const skillId of enabledSkills) {
      const skill = SKILL_PACKS.find(s => s.id === skillId);
      if (skill) prompt += skill.prompt;
    }
  } else {
    prompt += `\n\n## 核心能力\n1. **展品文案撰写**：根据用户提供的作品信息，生成专业、优美的展品描述。\n2. **布展建议**：根据展厅类型给出布局方案。\n3. **灯光搭配**：推荐适合的灯光方案。\n4. **平台使用指南**：解答平台操作问题。`;
  }
  return prompt;
}

// ─── 调用大模型 API（支持自定义端点） ──────────────────────────
async function callLLM(config, chatHistory, onChunk, enabledSkills = []) {
  const { provider, apiKey, model, customBaseUrl, customModelId } = config;

  let baseUrl;
  let actualModel;

  if (provider === 'custom') {
    baseUrl = customBaseUrl;
    actualModel = customModelId || 'default';
    if (!baseUrl) throw new Error('请填写自定义 API 地址');
    // 自动补全 /chat/completions 后缀
    if (!baseUrl.includes('/chat/completions')) {
      baseUrl = baseUrl.replace(/\/+$/, '') + '/v1/chat/completions';
    }
  } else {
    const providerCfg = AI_PROVIDERS[provider];
    if (!providerCfg) throw new Error('未知的 AI 提供商');
    baseUrl = providerCfg.baseUrl;
    actualModel = model;
  }

  if (!apiKey) throw new Error('请先配置 API Key');

  const systemPrompt = buildSystemPrompt(enabledSkills);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(m => {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      // 如果消息带图片，使用多模态格式
      if (m.image && role === 'user') {
        return {
          role: 'user',
          content: [
            { type: 'text', text: m.text },
            { type: 'image_url', image_url: { url: m.image } },
          ],
        };
      }
      return { role, content: m.text };
    }),
  ];

  // AbortController 支持取消
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let res;
  try {
    res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: actualModel,
        messages,
        max_tokens: 2048,
        temperature: 0.8,
        stream: true,
      }),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === 'AbortError') throw new Error('请求超时（30秒），请检查 API 地址和网络');
    throw new Error('网络请求失败: ' + fetchErr.message);
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    let errBody = '';
    try { errBody = await res.text(); } catch {}
    let errDetail = '';
    try {
      const errJson = JSON.parse(errBody);
      errDetail = errJson.error?.message || errJson.message || errJson.code || '';
    } catch { errDetail = errBody.slice(0, 300); }

    if (res.status === 401) {
      const isDashScope = provider === 'dashscope';
      if (isDashScope) {
        throw new Error(
          'API Key 验证失败 (401)。\n\n' +
          '可能原因：\n' +
          '1. Key 未复制完整 — 确保以 sk- 开头，完整粘贴\n' +
          '2. Key 已过期或被禁用 — 前往百炼控制台重新生成\n' +
          '3. 使用了错误平台的 Key — 百炼 Key 只能在百炼 API 使用'
        );
      }
      throw new Error('API Key 无效，请检查设置');
    }
    if (res.status === 403) {
      // DashScope 403 常见原因
      const isDashScope = provider === 'dashscope';
      if (isDashScope) {
        throw new Error(
          '阿里百炼 API 访问被拒绝。\n\n' +
          '常见原因及解决：\n' +
          '1. 模型未开通 — 前往百炼控制台「模型广场」开通对应模型\n' +
          '2. 免费额度用完 — 检查账户余额或充值\n' +
          '3. API Key 权限不足 — 确认 Key 属于主账号且有模型访问权限\n\n' +
          (errDetail ? `服务器返回: ${errDetail}\n\n` : '') +
          '💡 建议切换到「硅基流动」，DeepSeek-V3 免费额度最多'
        );
      }
      // SiliconFlow 403 — 视觉模型可能未开通
      const isSiliconFlow = provider === 'siliconflow';
      if (isSiliconFlow) {
        throw new Error(
          '硅基流动 API 访问被拒绝 (403)。\n\n' +
          '常见原因：\n' +
          '1. 模型未在你的账户中开通 — 前往 cloud.siliconflow.cn「模型广场」确认\n' +
          '2. 免费额度已用完 — 部分视觉模型免费额度有限\n' +
          '3. 视觉模型可能需要单独申请开通\n\n' +
          (errDetail ? `服务器返回: ${errDetail}\n\n` : '') +
          '💡 建议先试 Qwen3-VL-32B（推荐），或切换到其他视觉模型'
        );
      }
      throw new Error(
        `API 访问被拒绝 (403)${errDetail ? ': ' + errDetail : ''}。\n请检查 API Key 权限和模型是否已开通。`
      );
    }
    if (res.status === 404) {
      const isSiliconFlow = provider === 'siliconflow';
      if (isSiliconFlow) {
        throw new Error(
          '模型不存在或已下线 (404)。\n\n' +
          '可能原因：\n' +
          '1. 该视觉模型已下线或更名 — 请尝试其他视觉模型\n' +
          '2. 推荐尝试：Qwen3-VL-32B 或 GLM-5V-Turbo\n\n' +
          (errDetail ? `服务器返回: ${errDetail}` : '')
        );
      }
      throw new Error('API 地址无效或模型不存在' + (errDetail ? ': ' + errDetail : ''));
    }
    if (res.status === 429) throw new Error('请求过于频繁或额度用完，请稍后再试');
    throw new Error(`API 请求失败 (${res.status})${errDetail ? ': ' + errDetail.slice(0, 200) : ''}`);
  }

  // 流式读取
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(fullText);
        }
      } catch { /* skip malformed chunks */ }
    }
  }

  if (!fullText) throw new Error('模型未返回任何内容');
  return fullText;
}

// ═══════════════════════════════════════════════════════════════
//  本地智能回复（增强版 — 多轮对话 + 意图识别 + 丰富模板）
// ═══════════════════════════════════════════════════════════════

const QUICK_ACTIONS = [
  { label: '帮我写展品文案', icon: '✍️', cmd: 'copywriting' },
  { label: '布展建议', icon: '🎨', cmd: 'layout' },
  { label: '平台使用指南', icon: '📖', cmd: 'guide' },
  { label: '灯光搭配建议', icon: '💡', cmd: 'lighting' },
  { label: '模板怎么选', icon: '🏛', cmd: 'template' },
  { label: '分享与推广', icon: '🔗', cmd: 'share' },
];

const WELCOME_MSG = `你好！我是**展厅小助手** 🤖

我可以帮你：
• ✍️ **撰写展品文案** — 多种风格，专业优美
• 🎨 **布展建议** — 空间规划、动线设计、陈列方案
• 💡 **灯光搭配** — 色温、角度、氛围灯配置
• 🏛 **模板推荐** — 根据你的需求选择最佳风格
• 🔗 **分享推广** — 发布与传播策略
• 📖 **使用指南** — 平台操作全流程

试试下方的快捷按钮，或直接输入你的问题吧！`;

// ─── 意图识别引擎 ───────────────────────────────────────────
const INTENT_RULES = [
  {
    id: 'greeting',
    patterns: [/^(你好|hi|hello|嗨|hey|在吗|在不在|哈喽|你好呀)/],
    weight: 10,
  },
  {
    id: 'thanks',
    patterns: [/谢谢|感谢|多谢|thanks|thank you|辛苦了|太好了|不错|可以/],
    weight: 10,
  },
  {
    id: 'copywriting',
    patterns: [/文案|描述|介绍文|作品说明|写作|帮我写|生成文案|撰写|写一段|文字描述|作品描述|展品介绍/],
    weight: 8,
  },
  {
    id: 'copywriting-detail',
    patterns: [/作品名|作品叫|作品名称|作者|艺术家|创作者|绘画|摄影|雕塑|数字艺术|油画|水彩/],
    weight: 9,
  },
  {
    id: 'layout',
    patterns: [/布展|布局|布置|摆放|陈列|展位|排列|动线|空间规划|怎么摆|放在哪/],
    weight: 8,
  },
  {
    id: 'lighting',
    patterns: [/灯光|照明|光源|色温|亮度|聚光|射灯|氛围灯|打光/],
    weight: 8,
  },
  {
    id: 'template',
    patterns: [/模板|风格|主题|选哪个|哪种好|推荐模板|展厅类型|场景/],
    weight: 7,
  },
  {
    id: 'share',
    patterns: [/分享|推广|链接|发布|传播|二维码|社交媒体|朋友圈|微信/],
    weight: 7,
  },
  {
    id: 'guide',
    patterns: [/怎么用|使用|教程|指南|操作|功能|怎么创建|怎么漫游|怎么上传|如何/],
    weight: 7,
  },
  {
    id: 'image-upload',
    patterns: [/上传|导入|图片|照片|文件|尺寸|格式|jpg|png|webp|大小/],
    weight: 6,
  },
  {
    id: 'walkthrough',
    patterns: [/漫游|第一人称|wasd|移动|视角|操控|键盘|鼠标/],
    weight: 6,
  },
  {
    id: 'art-critique',
    patterns: [/评价|评论|赏析|鉴赏|分析|艺术价值|美学|艺术史|解读/],
    weight: 7,
  },
  {
    id: 'color-scheme',
    patterns: [/配色|颜色|色彩|色调|搭配|色系|暖色|冷色|深色|浅色/],
    weight: 6,
  },
  {
    id: 'troubleshoot',
    patterns: [/黑屏|加载|卡顿|打不开|报错|bug|问题|不能|无法|失败|崩溃/],
    weight: 9,
  },
];

function classifyIntent(input, context) {
  const text = input.toLowerCase().trim();
  let bestIntent = null;
  let bestScore = 0;

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        const score = rule.weight + (text.length < 10 ? 2 : 0); // 短输入加权
        if (score > bestScore) {
          bestScore = score;
          bestIntent = rule.id;
        }
      }
    }
  }

  // 上下文延续：如果用户输入很短且无法识别意图，延续上一轮话题
  if (!bestIntent && text.length < 8 && context?.lastIntent) {
    bestIntent = context.lastIntent + '-follow';
  }

  return bestIntent || 'unknown';
}

// ─── 回复模板库 ─────────────────────────────────────────────

const COPYWRITING_TEMPLATES = {
  '山水画': `✍️ **展品文案示例 — 山水画风**

---
**《山间晨雾》**
*作者：张三 | 水墨山水 | 2024*

晨光初破，薄雾如纱，轻笼远山近水之间。画家以淋漓水墨勾勒出层峦叠嶂的深远意境——浓墨处如铁铸山骨，淡墨处似烟波浩渺。整幅作品气韵生动，虚实相生，将观者引入一个超越现实的诗意空间。

作品承袭传统山水"三远"构图之法，高远取其势，深远取其幽，平远取其阔。笔法兼具北派之刚劲与南派之温润，展现出当代水墨对传统美学的致敬与创新。

---
💡 *如需调整风格（学术风/文艺风/商业风），请告诉我~*`,

  '摄影': `✍️ **展品文案示例 — 摄影作品**

---
**《城市脉搏》**
*作者：李四 | 城市纪实摄影 | 2024*

镜头定格的瞬间，霓虹在雨水中折射出万花筒般的色彩。行人的身影在长曝光中化为流动的光影，仿佛整座城市都在呼吸。摄影师以敏锐的视角捕捉了都市生活中转瞬即逝的诗意——钢筋水泥之间，人的温度从未缺席。

作品采用慢速快门与高感光度的组合，在保持画面张力的同时赋予影像独特的颗粒质感，呈现出介于纪实与艺术之间的视觉语言。

---
💡 *告诉我更多作品细节，我为你定制文案~*`,

  '现代艺术': `✍️ **展品文案示例 — 现代艺术**

---
**《解构·重生》**
*作者：王五 | 综合材料 | 2024*

色彩的碰撞不是混乱，而是秩序在另一个维度的呈现。艺术家以大胆的红蓝对冲、粗细不一的线条交织，构建了一个充满张力的视觉场域。画面中央的留白如同喧嚣中的静默，邀请观者在繁复中寻找属于自己的锚点。

作品探索了后疫情时代人类情感的重塑过程——破碎不是终点，而是新秩序的起点。综合材料的运用赋予画面丰富的触觉层次，每一次观看都能发现新的细节与共鸣。

---
💡 *想要更多风格变体？输入"文艺风"或"学术风"~*`,

  default: `✍️ **展品文案生成**

我可以为不同类型的作品撰写专业文案。请告诉我以下信息：

1️⃣ **作品名称**（如：星空之境）
2️⃣ **创作者**
3️⃣ **作品类型**（绘画/摄影/雕塑/数字艺术/装置等）
4️⃣ **风格或主题**（写实/抽象/山水/城市/自然等）
5️⃣ **期望文风**（文艺优美/学术专业/商业营销/简洁现代）

> 📝 示例输入：\`帮我写文案，作品名"山间晨雾"，作者张三，水墨山水画，文艺风格\`

我会根据你的描述生成 200-300 字的专业展品描述，并可提供多种风格变体 ✨`,
};

const LAYOUT_PLANS = {
  '艺术': `🎨 **艺术画廊布展方案**

**空间规划建议：**
• **前墙（主视觉墙）**：放置 2-3 幅核心作品，间距 1.5-2m，居中对称或三分法排列
• **后墙**：放置 1-2 幅关联作品，与前墙形成对话关系
• **左右墙**：放置系列作品或辅助展品，引导观展动线

**陈列原则：**
• 视平线高度（1.5-1.7m）放置最重要的作品
• 大幅作品单独展示，小幅作品可组合排列
• 同系列作品保持统一高度，间距 0.8-1.2m
• 入口处放置"引子"作品，出口处放置"总结"作品

**推荐模板**：🖼 现代艺术画廊（白色空间 + 暖色灯光）
**动线设计**：入口→前墙→左墙→后墙→右墙→出口，形成顺时针环形观展路径`,

  '商业': `🎨 **企业展厅布展方案**

**空间规划建议：**
• **前墙（品牌墙）**：品牌形象 + 核心产品展示，视觉冲击力强
• **后墙（故事墙）**：企业发展历程、里程碑事件
• **左墙（技术墙）**：技术实力、创新成果、专利展示
• **右墙（愿景墙）**：未来规划、社会责任、合作生态

**陈列原则：**
• 产品实物/模型放在最佳视线高度
• 数据图表简洁有力，配合品牌色
• 互动体验区设在中央，增强参与感
• 灯光突出产品细节，营造科技感

**推荐模板**：🏢 企业品牌展馆（深色调 + 冷色灯光）
**动线设计**：品牌印象→产品实力→技术底蕴→未来愿景，层层递进`,

  '文化': `🎨 **文化博物馆布展方案**

**空间规划建议：**
• **前墙（序厅墙）**：展览主题导言 + 核心文物/展品
• **后墙（深度墙）**：详细的历史背景和文化解读
• **左墙（时间线）**：按时间顺序展示发展脉络
• **右墙（互动墙）**：文化体验、非遗展示、多媒体互动

**陈列原则：**
• 珍贵展品居中独立展示，配详细解说牌
• 同类展品分组陈列，便于对比欣赏
• 图文解说与实物相结合，增强理解
• 暖色调灯光营造历史氛围

**推荐模板**：🏛 传统文化博物馆（暖黄调 + 柔光）
**动线设计**：主题导入→时间脉络→深度体验→互动参与→文创出口`,

  default: `🎨 **布展建议**

请告诉我你的展厅类型，我会给出详细的布展方案：

• 输入 **艺术** — 画廊布展方案（空间、动线、陈列）
• 输入 **文化** — 博物馆布展方案
• 输入 **商业** — 企业展厅方案
• 输入 **教育** — 教育展厅方案

或者直接描述你的需求，例如：\`我有 5 幅风景摄影作品，想在一个暖色调的展厅里展出\``,
};

const LIGHTING_GUIDE = {
  '暖色': `💡 **暖色灯光方案 — 艺术画廊 / 文化博物馆**

**主照明：**
• 色温：**3000K-3500K** 暖白光
• 显色指数（CRI）：**≥90**，真实还原色彩
• 聚光角度：**25°-40°**，照亮画作且边缘柔和

**氛围照明：**
• 环境光：柔和的 **2700K** 间接照明
• 光比：主照明 : 环境光 = **3:1**，突出展品
• 走廊/过渡区适当降低亮度，营造沉浸感

**推荐配色：**
• 墙面：白色/米白 — 灯光显色好
• 地面：浅灰/暖木色 — 不抢视觉焦点
• 聚光灯色：**#fff5e0**（温暖柔和）

**注意事项：**
• 避免直射观众眼睛
• 油画需避免强光造成反光
• 纸质作品需控制照度（≤50 lux）`,

  '冷色': `💡 **冷色灯光方案 — 科技展厅 / 企业品牌馆**

**主照明：**
• 色温：**5000K-6500K** 冷白光/日光色
• 显色指数（CRI）：**≥85**
• 聚光角度：**15°-30°**，精确聚焦产品

**氛围照明：**
• 环境光：**4000K** 中性白，干净利落
• 可使用 **RGB LED** 灯带作为装饰照明
• 蓝色/紫色点缀光增强科技感

**推荐配色：**
• 墙面：深灰/深蓝 — 科技感底色
• 地面：深色抛光 — 反射灯光增层次
• 聚光灯色：**#4361ee**（品牌蓝）或 **#e0e0ff**（冷白）

**注意事项：**
• 产品展示区需高亮度均匀照明
• 屏幕展示区降低环境光，提高对比度
• 互动区域灯光要有引导性`,

  '自然': `💡 **自然光方案 — 生态展 / 环保主题**

**主照明：**
• 色温：**4000K-5000K** 自然白光
• 显色指数（CRI）：**≥95**，高度还原自然色彩
• 聚光角度：**30°-45°**，模拟自然散射光

**氛围照明：**
• 环境光：模拟天窗效果，**5000K** 柔和顶光
• 植物/自然展品周围加入绿色补光
• 动态灯光模拟日出到日落的光线变化

**推荐配色：**
• 墙面：浅绿/米色 — 自然基调
• 地面：木质/石材纹理 — 贴近自然
• 聚光灯色：**#4ade80**（自然绿）或 **#fff8e7**（晨光）

**特色效果：**
• 树叶投影营造林间氛围
• 水波纹灯光增强海洋/水系主题
• 渐变灯光模拟四季变化`,

  default: `💡 **灯光搭配建议**

根据展厅类型选择灯光方案：

• 输入 **暖色** — 适合艺术画廊、文化博物馆（3000K 暖白光）
• 输入 **冷色** — 适合科技展厅、企业品牌馆（5500K 冷白光）
• 输入 **自然** — 适合生态展、环保主题（4500K 自然光）

💡 **核心参数速查：**
• 色温范围：2700K（暖黄）~ 6500K（冷白）
• CRI ≥ 90 为佳（色彩还原度）
• 展品照度：纸质 ≤50lux | 油画 ≤200lux | 雕塑 ≤300lux`,
};

const TEMPLATE_GUIDE = `🏛 **模板选择指南**

根据你的展示内容选择最合适的模板：

**🖼 现代艺术画廊** — 白色空间 + 暖色灯光
适合：当代艺术、摄影展、个人画展
特点：5 个展位，简约白色空间，突出作品本身

**🏢 企业品牌展馆** — 深色调 + 冷色品牌光
适合：企业展示、产品发布、品牌宣传
特点：4 个展位，专业商务氛围

**🏛 传统文化博物馆** — 暖黄调 + 柔和灯光
适合：文物展示、非遗文化、传统艺术
特点：4 个展位，古典庄重氛围

**👗 时尚设计展** — 粉紫渐变 + 时尚灯光
适合：时装设计、设计作品、潮流品牌
特点：4 个展位，时尚前卫空间

**🏠 房地产展厅** — 金色典雅 + 暖调灯光
适合：楼盘展示、建筑方案、样板间
特点：4 个展位，高端质感

**🌿 自然生态展** — 森林绿调 + 自然光
适合：动植物科普、环保主题、自然摄影
特点：5 个展位，沉浸式自然氛围

**🚗 汽车概念展厅** — 工业风 + 金属质感
适合：汽车展示、机械产品、工业设计
特点：4 个展位，硬核工业风格

💡 *不确定选哪个？告诉我你的展品类型和数量，我帮你推荐~*`;

const SHARE_GUIDE = `🔗 **分享与推广策略**

**发布后分享：**
1. 点击展厅右上角「分享展厅」按钮
2. 复制专属链接（格式：\`你的域名/gallery/展厅ID\`）
3. 分享到微信、朋友圈、微博等社交平台

**推广建议：**
• **朋友圈/微信群**：配合 2-3 张展厅截图 + 简短介绍
• **公众号/博客**：嵌入链接 + 详细展览介绍文章
• **短视频平台**：录制漫游视频，评论区放链接
• **线下场景**：生成二维码，印制在海报/传单上

**最佳实践：**
• 展厅描述包含关键词，利于搜索引擎发现
• 标签设置为 3-5 个相关主题词
• 首图选择最有视觉冲击力的展品
• 定期更新展品保持新鲜感`;

const GUIDE_CONTENT = `📖 **平台使用指南**

**🎯 创建展厅 — 4 步完成**
1. **选择模板**：7 种风格可选，点击卡片预览配色
2. **填写信息**：展厅名称（必填）、描述和标签（选填）
3. **上传作品**：本地上传（≤10MB）或粘贴 URL，设置挂载墙面
4. **预览发布**：3D 预览调整位置 → 漫游体验 → 确认发布

**🕹 漫游操控**
• **WASD / 方向键** — 前后左右移动
• **鼠标** — 视角转向
• **点击画作** — 查看详细信息
• **ESC** — 退出漫游模式

**📸 作品上传**
• 支持 JPG、PNG、WebP 等常见图片格式
• 单张图片不超过 10MB
• 可设置挂载到前墙/后墙/左墙/右墙
• 水平位置可在 -5 到 5 之间调整

**🔗 发布分享**
• 发布后自动生成专属链接
• 任何人通过链接即可访问 3D 展厅
• 展厅页面可分享、收藏`;

const TROUBLESHOOT_GUIDE = `🔧 **常见问题排查**

**3D 预览黑屏/白屏：**
• 检查浏览器是否支持 WebGL（Chrome/Firefox/Edge 均可）
• 关闭浏览器硬件加速后重试
• 降低同时打开的 3D 标签页数量
• 如出现"渲染引擎恢复中"提示，稍等片刻即可

**图片无法显示：**
• 本地上传：确认文件格式为 JPG/PNG/WebP，大小 ≤10MB
• URL 粘贴：确保链接可公开访问且以 http/https 开头
• 跨域图片可能无法加载，建议使用本地上传

**漫游模式无法进入：**
• 点击"点击进入漫游模式"提示框
• 浏览器可能弹出权限请求，选择允许
• 部分浏览器需要 HTTPS 才能使用 Pointer Lock

**发布/分享问题：**
• 确保至少有一件有效作品
• 展厅名称为必填项
• 发布后链接永久有效（基于 localStorage 存储）

💡 *如果以上方法无法解决，请告诉我具体的错误信息~*`;

// ─── 本地回复引擎（带上下文） ──────────────────────────────
function createLocalEngine() {
  let context = {
    lastIntent: null,
    turnCount: 0,
    mentionedType: null, // 用户提到的展厅/作品类型
  };

  return {
    respond(input) {
      const text = input.toLowerCase().trim();
      context.turnCount++;
      const intent = classifyIntent(input, context);
      context.lastIntent = intent;

      // 检测用户提到的类型（用于后续追问）
      const typeMatch = text.match(/(艺术|商业|文化|教育|自然|科技|摄影|绘画|雕塑|装置|油画|水彩|水墨|数字)/);
      if (typeMatch) context.mentionedType = typeMatch[1];

      switch (intent) {
        case 'greeting':
          return '你好呀！👋 我是展厅小助手，很高兴见到你~\n\n我擅长展厅策划、文案撰写、灯光设计等方面。你可以直接告诉我需求，或者点击下方快捷按钮开始。\n\n💡 **小提示**：描述越详细，我的建议越精准！';

        case 'thanks':
          return context.turnCount > 3
            ? '不客气！😊 很高兴能帮到你，还有其他布展方面的问题随时问我~'
            : '不客气！😊 有需要随时找我~';

        case 'copywriting':
        case 'copywriting-detail': {
          // 如果用户提到了具体类型，给出对应模板
          if (/(山水|国画|水墨|中国画)/.test(text)) return COPYWRITING_TEMPLATES['山水画'];
          if (/(摄影|照片|纪实|风光)/.test(text)) return COPYWRITING_TEMPLATES['摄影'];
          if (/(现代|抽象|当代|装置|综合材料|油画)/.test(text)) return COPYWRITING_TEMPLATES['现代艺术'];
          return COPYWRITING_TEMPLATES.default;
        }

        case 'copywriting-follow':
          return COPYWRITING_TEMPLATES.default;

        case 'layout': {
          const type = context.mentionedType || 'default';
          if (/(艺术|画廊)/.test(text)) return LAYOUT_PLANS['艺术'];
          if (/(商业|企业|品牌|公司)/.test(text)) return LAYOUT_PLANS['商业'];
          if (/(文化|博物|传统|历史)/.test(text)) return LAYOUT_PLANS['文化'];
          if (context.mentionedType && LAYOUT_PLANS[context.mentionedType]) return LAYOUT_PLANS[context.mentionedType];
          return LAYOUT_PLANS.default;
        }

        case 'layout-follow':
          return LAYOUT_PLANS.default;

        case 'lighting': {
          if (/(暖色|暖光|温馨|柔和)/.test(text)) return LIGHTING_GUIDE['暖色'];
          if (/(冷色|冷光|科技|现代)/.test(text)) return LIGHTING_GUIDE['冷色'];
          if (/(自然|生态|绿色|户外)/.test(text)) return LIGHTING_GUIDE['自然'];
          return LIGHTING_GUIDE.default;
        }

        case 'lighting-follow':
          return LIGHTING_GUIDE.default;

        case 'template':
          return TEMPLATE_GUIDE;

        case 'template-follow':
          return TEMPLATE_GUIDE;

        case 'share':
          return SHARE_GUIDE;

        case 'share-follow':
          return '🔗 还有其他分享方面的问题吗？\n\n你可以试试：\n• **"怎么生成二维码"** — 线下推广方案\n• **"展厅描述怎么写"** — SEO 优化建议\n• **"怎么更新展品"** — 发布后修改指南';

        case 'guide':
          return GUIDE_CONTENT;

        case 'guide-follow':
          return GUIDE_CONTENT;

        case 'image-upload':
          return `📸 **作品上传指南**

**支持的方式：**
1. **本地上传** — 点击"本地上传"按钮选择图片文件
   • 格式：JPG、PNG、WebP、GIF
   • 大小：单张不超过 10MB
   • 建议分辨率：宽度 1200-2400px，效果最佳

2. **URL 粘贴** — 直接在图片地址栏粘贴链接
   • 必须以 http:// 或 https:// 开头
   • 确保链接可公开访问（非私有链接）
   • 推荐使用图床服务（如 imgur、sm.ms）

**常见问题：**
• 图片不显示 → 检查链接是否有效，或改用本地上传
• 图片模糊 → 上传更高分辨率的版本
• 跨域报错 → 使用本地上传代替 URL`;

        case 'image-upload-follow':
          return '📸 还有上传相关的问题吗？也可以试试输入 **"怎么用"** 查看完整操作指南。';

        case 'walkthrough':
          return `🕹 **漫游模式操作指南**

**进入方式：**
点击 3D 预览中央的"点击进入漫游模式"提示框

**操控方式：**
• **W / ↑** — 前进
• **S / ↓** — 后退
• **A / ←** — 左移
• **D / →** — 右移
• **鼠标移动** — 环顾四周
• **点击画作** — 查看展品详情
• **ESC** — 退出漫游模式

**体验技巧：**
• 先熟悉展厅布局再深入观赏
• 走到画作前方 1-2 米处观赏效果最佳
• 点击画作可查看标题、作者等信息
• 满意后点击"确认发布"即可上线`;

        case 'walkthrough-follow':
          return '🕹 还有其他操控问题吗？输入 **"怎么用"** 查看完整平台指南。';

        case 'art-critique':
          return `🎨 **艺术评论与赏析**

我可以从以下角度帮你分析作品：

• **形式分析** — 构图、色彩、线条、质感
• **内容解读** — 主题、象征、叙事、情感
• **历史语境** — 艺术流派、时代背景、影响
• **技法评价** — 材料运用、工艺水平、创新

请告诉我：
1. 作品名称和类型
2. 你关注的角度（形式/内容/历史/技法）
3. 是否有特定的比较对象

> 💡 配置大模型 API 后，我可以根据图片进行更深度的艺术分析`;

        case 'art-critique-follow':
          return '🎨 还有其他想了解的评论角度吗？你也可以试试输入 **"帮我写文案"** 来为作品撰写专业描述。';

        case 'color-scheme':
          return `🎨 **展厅配色建议**

**经典配色方案：**

**🖤 深色高端风**
• 墙面：#1a1a2e ~ #2d2d44
• 地面：#16213e ~ #0f3460
• 灯光：冷白色 5000K
• 适合：科技、汽车、奢侈品

**🤍 白色极简风**
• 墙面：#f8f9fa ~ #ffffff
• 地面：#e9ecef ~ #dee2e6
• 灯光：暖白色 3500K
• 适合：艺术画廊、摄影展

**🟤 暖色文化风**
• 墙面：#ffefd6 ~ #fff4e5
• 地面：#ffe3bd ~ #dcc9a3
• 灯光：暖黄色 3000K
• 适合：传统文化、博物馆

**🟢 自然生态风**
• 墙面：#e5f0e5 ~ #eef6ee
• 地面：#d5e7d5 ~ #c8dcc8
• 灯光：自然光 4500K
• 适合：自然、环保主题

💡 选择模板时已预设好配色，也可以在设置中自定义~`;

        case 'troubleshoot':
          return TROUBLESHOOT_GUIDE;

        case 'troubleshoot-follow':
          return TROUBLESHOOT_GUIDE;

        default:
          return buildUnknownResponse(text, context);
      }
    },

    handleCommand(cmd) {
      switch (cmd) {
        case 'copywriting': return COPYWRITING_TEMPLATES.default;
        case 'layout': return LAYOUT_PLANS.default;
        case 'guide': return GUIDE_CONTENT;
        case 'lighting': return LIGHTING_GUIDE.default;
        case 'template': return TEMPLATE_GUIDE;
        case 'share': return SHARE_GUIDE;
        default: return null;
      }
    },

    reset() {
      context = { lastIntent: null, turnCount: 0, mentionedType: null };
    },
  };
}

function buildUnknownResponse(text, context) {
  // 根据上下文给出更智能的兜底回复
  const suggestions = [];
  if (context.mentionedType) {
    suggestions.push(`关于**${context.mentionedType}**方面，你可以问我布展方案、灯光搭配或文案撰写`);
  }

  return `我理解你的问题 🤔 让我看看能怎么帮你：

${suggestions.length > 0 ? suggestions.join('\n') + '\n\n' : ''}**我能帮助的方向：**
• **"帮我写文案"** — 生成专业展品描述
• **"布展建议"** — 空间规划和陈列方案
• **"灯光建议"** — 色温、角度、氛围灯配置
• **"模板怎么选"** — 7 种模板详细对比
• **"怎么用"** — 平台操作全流程指南
• **"分享推广"** — 发布后的传播策略

💡 **提示**：配置大模型 API Key（免费）后可获得更智能、更个性化的回答，点击右上角 ⚙️ 设置。`;
}

// ═══════════════════════════════════════════════════════════════
//  工具函数
// ═══════════════════════════════════════════════════════════════

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^---$/gm, '<hr class="border-white/10 my-3" />')
    .replace(/\n/g, '<br/>');
}

// ═══════════════════════════════════════════════════════════════
//  子组件
// ═══════════════════════════════════════════════════════════════

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%]">
          {msg.image && (
            <div className="mb-1.5 rounded-xl overflow-hidden border border-white/10" style={{ maxWidth: '200px' }}>
              <img src={msg.image} alt="上传的图片" className="w-full h-auto object-cover" style={{ maxHeight: '150px' }} />
            </div>
          )}
          <div className="bg-primary-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed">
            {msg.text}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start mb-3 group">
      <div className="max-w-[90%] bg-white/[0.07] border border-white/10 text-gray-200 px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed relative">
        {msg.isStreaming ? (
          <div className="whitespace-pre-wrap">{msg.text}<span className="inline-block w-1.5 h-4 bg-primary-400 animate-pulse ml-0.5 align-middle rounded-sm" /></div>
        ) : (
          <div className="prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
        )}
        <button onClick={handleCopy} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10" title="复制">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white/[0.07] border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── 设置面板 ───────────────────────────────────────────────
function SettingsPanel({ config, enabledSkills, onSave, onClose }) {
  const [provider, setProvider] = useState(config.provider);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [customBaseUrl, setCustomBaseUrl] = useState(config.customBaseUrl || '');
  const [customModelId, setCustomModelId] = useState(config.customModelId || '');
  const [skills, setSkills] = useState(enabledSkills);
  const [openModelList, setOpenModelList] = useState(false);

  const providerCfg = AI_PROVIDERS[provider];
  const isCustom = provider === 'custom';
  const [testResult, setTestResult] = useState(null); // { status: 'success' | 'error', message: string }
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!isCustom) {
      const models = AI_PROVIDERS[provider]?.models;
      if (models && !models.find(m => m.id === model)) {
        setModel(models[0].id);
      }
    }
  }, [provider]);

  // 切换提供商或模型时清除测试结果
  useEffect(() => {
    setTestResult(null);
  }, [provider, model, apiKey]);

  const toggleSkill = (id) => {
    setSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleTest = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) { setTestResult({ status: 'error', message: '请先填写 API Key' }); return; }

    // 基本格式检查
    if (provider === 'dashscope' && !trimmedKey.startsWith('sk-')) {
      setTestResult({ status: 'error', message: '阿里百炼 API Key 应以 sk- 开头，请检查是否复制完整' });
      return;
    }
    if (provider === 'siliconflow' && trimmedKey.length < 20) {
      setTestResult({ status: 'error', message: '硅基流动 API Key 格式不正确，请检查是否复制完整' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const testConfig = {
        provider, apiKey: trimmedKey, model,
        customBaseUrl: customBaseUrl.trim(), customModelId: customModelId.trim(),
      };
      await callLLM(testConfig, [{ role: 'user', text: '你好，请用一句话回复' }], () => {}, []);
      const modelName = isCustom
        ? (customModelId || '自定义模型')
        : (providerCfg.models.find(m => m.id === model)?.name || model);
      setTestResult({ status: 'success', message: `连接成功！${modelName} 可用 ✓` });
    } catch (err) {
      setTestResult({ status: 'error', message: err.message });
    }
    setTesting(false);
  };

  const handleSave = () => {
    onSave(
      { provider, apiKey: apiKey.trim(), model, customBaseUrl: customBaseUrl.trim(), customModelId: customModelId.trim() },
      skills,
    );
    onClose();
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col" style={{ background: '#0d0d1a' }}>
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#151528]">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Settings className="w-4 h-4 text-primary-400" /> 设置中心
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Section 1: AI 提供商 ── */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider">AI 服务提供商</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(AI_PROVIDERS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setProvider(key)}
                className={`relative p-3.5 rounded-xl text-left transition-all border ${
                  provider === key
                    ? 'bg-primary-600/15 border-primary-500/60 shadow-lg shadow-primary-500/10'
                    : 'bg-[#1a1a30] border-white/[0.06] hover:bg-[#1f1f38] hover:border-white/10'
                } ${key === 'custom' ? 'col-span-2' : ''}`}
              >
                {provider === key && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-primary-400 rounded-full" />
                )}
                <div className={`font-semibold text-sm ${provider === key ? 'text-white' : 'text-gray-300'}`}>
                  {cfg.name}
                </div>
                <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">{cfg.desc}</div>
                {cfg.note && <div className="text-[10px] text-primary-400/70 mt-1.5">{cfg.note}</div>}
              </button>
            ))}
          </div>

          {/* 自定义 API 地址和模型（选择 custom 时显示） */}
          {isCustom && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">API 地址（OpenAI 兼容接口）</label>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={e => setCustomBaseUrl(e.target.value)}
                  placeholder="https://your-api.com/v1/chat/completions"
                  className="w-full bg-[#1a1a30] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                />
                <div className="text-[10px] text-gray-600 mt-1">支持 OpenAI / Ollama / vLLM / LMStudio 等兼容接口</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">模型 ID</label>
                <input
                  type="text"
                  value={customModelId}
                  onChange={e => setCustomModelId(e.target.value)}
                  placeholder="如: gpt-4o, llama3, qwen2.5-72b"
                  className="w-full bg-[#1a1a30] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Section 2: API Key ── */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-300">API Key</span>
          </div>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-[#1a1a30] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
          <a
            href={providerCfg.keyUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 mt-2 transition-colors ${isCustom || !providerCfg.keyUrl ? 'hidden' : ''}`}
          >
            <ExternalLink className="w-3 h-3" />
            前往{providerCfg.name}免费注册获取 API Key
          </a>

          {/* 测试连接按钮 */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/[0.06] border border-white/10 text-gray-300 hover:bg-primary-600/20 hover:border-primary-500/30 hover:text-primary-300"
            >
              {testing ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  测试中...
                </>
              ) : (
                <>🔌 测试连接</>
              )}
            </button>
            {testResult && (
              <div className={`text-xs flex-1 max-h-[120px] overflow-y-auto ${testResult.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.message.split('\n').map((line, i) => (
                  <div key={i} className={i === 0 ? 'font-medium' : 'opacity-80'}>{line}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 3: 模型 ── */}
        {!isCustom && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-300">模型选择</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setOpenModelList(!openModelList)}
              className="w-full flex items-center justify-between bg-[#1a1a30] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm hover:bg-[#1f1f38] transition-colors"
            >
              <span>{providerCfg.models.find(m => m.id === model)?.name || model}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openModelList ? 'rotate-180' : ''}`} />
            </button>
            {openModelList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a30] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-20">
                {providerCfg.models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setModel(m.id); setOpenModelList(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      model === m.id ? 'bg-primary-600/20 text-primary-300' : 'text-gray-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    {m.name}
                    {m.free && <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">免费</span>}
                    {m.vision && <span className="ml-1 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">识图</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* ── Section 4: 技能包 ── */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-accent-400" />
              <span className="text-xs font-semibold text-accent-300 uppercase tracking-wider">技能包</span>
            </div>
            <span className="text-[10px] text-gray-500">{skills.length}/{SKILL_PACKS.length} 已启用</span>
          </div>
          <div className="space-y-2">
            {SKILL_PACKS.map(skill => {
              const Icon = skill.icon;
              const active = skills.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                    active
                      ? 'bg-white/[0.06] border-white/10 shadow-sm'
                      : 'bg-[#12121e] border-transparent hover:bg-[#1a1a30]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${skill.color} flex items-center justify-center flex-shrink-0 ${active ? 'opacity-100' : 'opacity-40'}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-500'}`}>{skill.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 truncate">{skill.desc}</div>
                  </div>
                  <div className={`w-10 h-5.5 rounded-full relative flex-shrink-0 transition-colors ${active ? 'bg-primary-500' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${active ? 'right-0.5' : 'left-0.5'}`}
                      style={{ width: '18px', height: '18px', top: '2px', [active ? 'right' : 'left']: '2px' }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Section 5: 使用说明 ── */}
        <div className="px-5 pb-5">
          <div className="bg-[#151528] border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-400 mb-2">使用说明</div>
            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1.5">
              <div className="flex gap-2"><span className="text-primary-400 flex-shrink-0">1.</span> 点击上方服务商卡片，前往平台注册并获取免费 API Key</div>
              <div className="flex gap-2"><span className="text-primary-400 flex-shrink-0">2.</span> 将 API Key 粘贴到上方输入框，选择模型后保存</div>
              <div className="flex gap-2"><span className="text-primary-400 flex-shrink-0">3.</span> 开启需要的技能包来增强 AI 的专业能力</div>
              <div className="flex gap-2"><span className="text-primary-400 flex-shrink-0">4.</span> 未配置 API Key 时，助手将使用本地智能回复</div>
              <div className="flex gap-2"><span className="text-primary-400 flex-shrink-0">5.</span> 点击"测试连接"可验证 API Key 是否可用</div>
              <div className="mt-2 pt-2 border-t border-white/[0.06]">
                <strong className="text-gray-400">硅基流动</strong> DeepSeek-V3/R1 免费额度最多，推荐首选<br/>
                <strong className="text-gray-400">视觉模型</strong> 推荐 Qwen3-VL-32B，识别能力最强<br/>
                <strong className="text-gray-400">阿里百炼</strong> 通义千问系列，新用户每模型 100 万 tokens<br/>
                <strong className="text-gray-400">自定义</strong> 支持 OpenAI/Ollama/vLLM 等兼容接口<br/>
                <div className="mt-2 text-amber-400/70">
                  ⚠️ 阿里百炼用户注意：需先在百炼控制台「模型广场」开通模型，否则会遇到 403 权限错误
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部保存 */}
      <div className="px-5 py-3 border-t border-white/10 bg-[#151528]">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-medium text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-primary-600/20"
        >
          保存设置
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  主组件
// ═══════════════════════════════════════════════════════════════

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', text: WELCOME_MSG }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState(loadAIConfig);
  const [enabledSkills, setEnabledSkills] = useState(loadSkills);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const fileInputRef = useRef(null);
  const localEngineRef = useRef(createLocalEngine());
  const [uploadedImage, setUploadedImage] = useState(null); // base64 data URL

  const isLLMEnabled = !!(aiConfig.apiKey && AI_PROVIDERS[aiConfig.provider] && (aiConfig.provider !== 'custom' || aiConfig.customBaseUrl));

  // 检查当前模型是否支持视觉
  const isVisionModel = (() => {
    if (aiConfig.provider === 'custom') return true; // 假设自定义模型可能支持
    const providerCfg = AI_PROVIDERS[aiConfig.provider];
    if (!providerCfg) return false;
    const m = providerCfg.models.find(m => m.id === aiConfig.model);
    return m?.vision === true;
  })();

  // 图片上传处理
  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ 图片大小不能超过 5MB，请压缩后重试。' }]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = '';
  };

  // 粘贴图片
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
        return;
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // ─── 发送消息 ──────────────────────────────────────────────
  const sendMessage = useCallback(async (text, cmd) => {
    if (!text?.trim() && !cmd && !uploadedImage) return;

    const userMsg = cmd ? QUICK_ACTIONS.find(a => a.cmd === cmd)?.label || text : text.trim();
    const image = uploadedImage;
    setUploadedImage(null);

    // 如果有图片但没有 API，提示用户
    if (image && !isLLMEnabled) {
      const newMessages = [...messages, { role: 'user', text: userMsg || '请分析这张图片', image }];
      setMessages(newMessages);
      setInput('');
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: '📸 图片识别功能需要配置大模型 API 才能使用。\n\n**推荐方案：**\n1. 点击 ⚙️ 设置\n2. 选择「硅基流动」（免费额度最多）\n3. 模型选择带 **视觉·识图** 标签的模型（推荐 Qwen3-VL-32B）\n4. 填入 API Key 并保存\n\n之后就可以上传图片让 AI 帮你分析作品、生成文案了！',
        }]);
      }, 500);
      return;
    }

    // 如果上传图片但模型不支持视觉，提醒切换
    if (image && !isVisionModel) {
      const newMessages = [...messages, { role: 'user', text: userMsg || '请分析这张图片', image }];
      setMessages(newMessages);
      setInput('');
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: '⚠️ 当前模型 **' + (AI_PROVIDERS[aiConfig.provider]?.models.find(m => m.id === aiConfig.model)?.name || aiConfig.model) + '** 不支持图片识别。\n\n请切换到带 **视觉·识图** 标签的模型：\n\n**硅基流动推荐：**\n• Qwen3-VL-32B（推荐·免费）\n• Qwen2.5-VL-72B（免费）\n• GLM-5V-Turbo（免费）\n\n**阿里百炼推荐：**\n• Qwen-VL-Plus\n• Qwen-VL-Max\n\n💡 点击 ⚙️ 设置即可切换模型',
        }]);
      }, 500);
      return;
    }

    const newMessages = [...messages, { role: 'user', text: userMsg || (image ? '请分析这张图片' : ''), image }];
    setMessages(newMessages);
    setInput('');
    setTyping(true);

    // 如果有大模型 API，调用 LLM
    if (isLLMEnabled) {
      setStreamingText('');
      try {
        const llmMessages = cmd
          ? [...newMessages, { role: 'user', text: localEngineRef.current.handleCommand(cmd) || userMsg }]
          : newMessages;

        const fullText = await callLLM(aiConfig, llmMessages, (chunk) => {
          setStreamingText(chunk);
        }, enabledSkills);

        setMessages(prev => [...prev, { role: 'assistant', text: fullText }]);
        setStreamingText('');
      } catch (err) {
        setStreamingText('');
        const fallback = localEngineRef.current.respond(text || '');
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: `⚠️ *AI 请求失败：${err.message}*\n\n已为你切换到本地智能回复：\n\n${fallback}`,
        }]);
      }
      setTyping(false);
      return;
    }

    // 无 API Key → 本地智能引擎
    setTimeout(() => {
      const reply = cmd ? localEngineRef.current.handleCommand(cmd) : localEngineRef.current.respond(text);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setTyping(false);
    }, 400 + Math.random() * 500);
  }, [messages, aiConfig, isLLMEnabled, isVisionModel, enabledSkills, uploadedImage]);

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleReset = () => {
    setMessages([{ role: 'assistant', text: WELCOME_MSG }]);
    setStreamingText('');
    setUploadedImage(null);
    localEngineRef.current.reset();
  };

  const handleSaveConfig = (cfg, skills) => {
    setAiConfig(cfg);
    saveAIConfig(cfg);
    setEnabledSkills(skills);
    saveSkills(skills);
  };

  // 获取当前模型名称
  const currentProvider = AI_PROVIDERS[aiConfig.provider];
  const currentModelName = currentProvider?.models.find(m => m.id === aiConfig.model)?.name || '';

  return (
    <>
      {/* 浮动按钮 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary-600/40 hover:scale-110 transition-transform animate-float"
          title="AI 展厅小助手"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a14] animate-pulse" />
        </button>
      )}

      {/* 聊天面板 */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-4rem)] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden" style={{ background: '#0d0d1a' }}>

          {/* 头部 */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gradient-to-r from-primary-600/20 to-accent-600/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">展厅小助手</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  {isLLMEnabled ? (
                    <span className="text-xs text-primary-300">
                      {aiConfig.provider === 'custom' ? (
                        <>自定义 API · {aiConfig.customModelId || 'default'}</>
                      ) : (
                        <>
                          {currentProvider?.name} · {currentModelName.split('（')[0]}
                        </>
                      )}
                      {enabledSkills.length > 0 && <span className="text-accent-400 ml-1.5">· {enabledSkills.length}个技能</span>}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">本地模式 · 点击⚙️配置大模型</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg text-gray-400 hover:text-primary-300 hover:bg-white/10 transition-colors" title="AI 设置">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={handleReset} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="重置对话">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="关闭">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 消息区 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {streamingText && <MessageBubble msg={{ role: 'assistant', text: streamingText, isStreaming: true }} />}
            {typing && !streamingText && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷操作 */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.cmd}
                  onClick={() => sendMessage(null, action.cmd)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-gray-300 text-xs hover:bg-primary-600/20 hover:border-primary-500/30 hover:text-primary-300 transition-all"
                >
                  <span>{action.icon}</span>{action.label}
                </button>
              ))}
            </div>
          )}

          {/* 输入区 */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
            {!isLLMEnabled && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs text-amber-400/80">⚡ 当前为本地模式</span>
                <button type="button" onClick={() => setShowSettings(true)} className="text-xs text-primary-400 hover:text-primary-300 underline">
                  配置大模型以获得更智能的回答
                </button>
              </div>
            )}

            {/* 图片预览区域 */}
            {uploadedImage && (
              <div className="mb-2 relative inline-block">
                <div className="relative rounded-xl overflow-hidden border border-white/15 shadow-lg" style={{ maxWidth: '120px', maxHeight: '90px' }}>
                  <img src={uploadedImage} alt="待发送图片" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="absolute -bottom-4 left-0 text-[10px] text-gray-500">
                  📎 已附加图片
                </div>
              </div>
            )}

            {/* 隐藏的 file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              {/* 图片上传按钮 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-gray-400 hover:text-primary-300 hover:bg-primary-600/15 hover:border-primary-500/30 disabled:opacity-30 transition-all flex-shrink-0"
                disabled={typing || !!streamingText || !!uploadedImage}
                title="上传图片（支持粘贴 Ctrl+V）"
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={uploadedImage ? '描述你想了解的内容，或直接发送...' : (isLLMEnabled ? '输入你的问题，AI 为你解答...' : '输入你的问题...')}
                className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                disabled={typing || !!streamingText}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !uploadedImage) || typing || !!streamingText}
                className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* 设置面板（覆盖层） */}
          {showSettings && (
            <SettingsPanel
              config={aiConfig}
              enabledSkills={enabledSkills}
              onSave={handleSaveConfig}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      )}
    </>
  );
}
