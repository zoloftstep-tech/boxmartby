const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

const ORDER_PARSE_PROMPT = `Ты — модуль распознавания заявок на изготовление картонных коробок для 
компании БОКСМАРТ. Твоя задача — проанализировать сообщение менеджера из 
рабочей Telegram-группы и извлечь из него параметры заказа, если они там есть.

Извлекай следующие параметры:
- length, width, height — габариты коробки в миллиметрах (длина, ширина, высота)
- quantity — тираж (количество штук)
- price_per_unit — цена за одну штуку

Правила определения is_order_data:
- true, если сообщение содержит попытку описать параметры заказа коробки 
  (даже если не все данные указаны или указаны неполно)
- false, если сообщение не связано с заказом коробок вообще: обычная 
  переписка, вопросы о графике работы, эмодзи, приветствия, обсуждение 
  других тем

Правила определения is_new_order:
- true, если сообщение описывает самостоятельный, новый заказ с нуля
- false, если сообщение является уточнением, правкой или комментарием к 
  заказу, который уже был упомянут ранее в переписке — например, содержит 
  фразы вида "тот заказ", "по предыдущему", "уточнение по", "поправка", 
  "можно изменить", "а если вместо X сделать Y", либо содержит только 
  ЧАСТЬ параметров без полного описания нового заказа (например, только 
  одно число без остальных)

- Если тебе передан контекст предыдущих сообщений группы, используй его, 
  чтобы понять, ссылается ли текущее сообщение на что-то, что уже 
  обсуждалось

Правила извлечения чисел:
- Габариты могут быть указаны в разных форматах: "600х400х400", 
  "600x400x400", "600*400*400", "600 на 400 на 400", через запятую 
  или другие разделители — распознавай все варианты
- Тираж может сопровождаться словами "шт", "штук", "тираж", или быть 
  просто числом рядом с указанием количества
- Цена может быть указана как "2.5", "2,5", "2.5 руб", "2.5 BYN", 
  "по 2.5 за штуку" — приводи разделитель дробной части к точке
- Если какой-то параметр явно не упомянут в сообщении, верни null 
  для этого поля — не пытайся угадывать или подставлять значения 
  по умолчанию

Важно: отвечай ТОЛЬКО в формате JSON согласно заданной схеме, без 
дополнительных пояснений, комментариев или текста до/после JSON.`;

const ORDER_REPLY_PARSE_PROMPT = `Ты — модуль классификации reply-сообщений к уже созданной заявке на коробки БОКСМАРТ.

Верни intent: field_change | status_query | ignore.

intent = status_query:
- вопросы о текущем этапе заказа: «какой статус», «на каком этапе», «готов?», «когда будет» в смысле статуса, без правки параметров заказа.

intent = field_change:
- явная правка параметров заказа: изменить/поставить/сделать тираж, цену, длину/ширину/высоту.
- примеры: «тираж 600», «цена 1.5», «поставь 100 шт», «изменить высоту на 300», «вместо 50 сделай 80».
- для field_change заполни field_changed + new_value и/или changes[{field,value}].
- поля: length, width, height, quantity, price_per_unit.

intent = ignore:
- операционный контекст, даже если есть числа: «100шт есть», «можно забрать», «нужно срочно 50шт», «готовы», наличие на складе, срочность, самовывоз, комментарии без явной правки карточки.
- число + «есть/готовы/срочно/забрать» без глагола изменения параметров → ignore, НЕ field_change.
- неоднозначные фразы без явной правки → ignore.

has_change должен быть true только при intent=field_change, иначе false.

Отвечай ТОЛЬКО JSON по схеме, без пояснений.`;

export type ParsedOrder = {
  is_order_data: boolean;
  is_new_order: boolean;
  length: number | null;
  width: number | null;
  height: number | null;
  quantity: number | null;
  price_per_unit: number | null;
};

export type ReplyIntent = "field_change" | "status_query" | "ignore";

export type ParsedOrderChange = {
  intent: ReplyIntent;
  has_change: boolean;
  field_changed?: string | null;
  new_value?: number | null;
  changes?: Array<{ field: string; value: number }> | null;
};

const ORDER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    is_order_data: { type: "boolean" },
    is_new_order: { type: "boolean" },
    length: { type: ["number", "null"] },
    width: { type: ["number", "null"] },
    height: { type: ["number", "null"] },
    quantity: { type: ["integer", "null"] },
    price_per_unit: { type: ["number", "null"] },
  },
  required: [
    "is_order_data",
    "is_new_order",
    "length",
    "width",
    "height",
    "quantity",
    "price_per_unit",
  ],
};

const ORDER_REPLY_CHANGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: { type: "string", enum: ["field_change", "status_query", "ignore"] },
    has_change: { type: "boolean" },
    field_changed: { type: ["string", "null"] },
    new_value: { type: ["number", "null"] },
    changes: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string" },
          value: { type: "number" },
        },
        required: ["field", "value"],
      },
    },
  },
  required: ["intent", "has_change"],
};

async function perplexityJson<T>(params: {
  apiKey: string;
  systemPrompt: string;
  userInput: string;
  schema: unknown;
  schemaName: string;
}): Promise<T | null> {
  const response = await fetch(PERPLEXITY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userInput },
      ],
      temperature: 0,
      max_tokens: 500,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: params.schemaName,
          schema: params.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("[perplexity] API error", response.status, errText.slice(0, 500));
    return null;
  }

  const body = (await response.json().catch(() => null)) as unknown;
  const content = (body as any)?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    console.error("[perplexity] empty content", JSON.stringify(body)?.slice(0, 500));
    return null;
  }

  try {
    return JSON.parse(content) as T;
  } catch (err) {
    console.error("[perplexity] JSON parse failed", content.slice(0, 500), err);
    return null;
  }
}

export async function parseOrderFromOptopak(params: {
  text: string;
  recentContext: string[];
}): Promise<ParsedOrder> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return {
      is_order_data: false,
      is_new_order: false,
      length: null,
      width: null,
      height: null,
      quantity: null,
      price_per_unit: null,
    };
  }

  const userInput = [
    `Текущее сообщение менеджера:\n${params.text}`,
    params.recentContext.length
      ? `\n\nКонтекст последних сообщений (для определения is_new_order):\n${params.recentContext
          .map((t, i) => `${i + 1}) ${t}`)
          .join("\n")}`
      : "",
  ].join("");

  const data =
    await perplexityJson<ParsedOrder>({
      apiKey,
      systemPrompt: ORDER_PARSE_PROMPT,
      userInput,
      schema: ORDER_SCHEMA,
      schemaName: "order_data",
    });

  // If parsing failed -> treat as not an order.
  if (!data) {
    console.error("[perplexity] parseOrderFromOptopak failed — returning empty");
    return {
      is_order_data: false,
      is_new_order: false,
      length: null,
      width: null,
      height: null,
      quantity: null,
      price_per_unit: null,
    };
  }

  return data;
}

function normalizeReplyChange(data: ParsedOrderChange): ParsedOrderChange {
  const intent: ReplyIntent =
    data.intent === "field_change" || data.intent === "status_query" || data.intent === "ignore"
      ? data.intent
      : data.has_change
        ? "field_change"
        : "ignore";

  const hasFieldPayload =
    Boolean(data.changes?.length) ||
    (Boolean(data.field_changed) && typeof data.new_value === "number");

  const has_change =
    intent === "field_change" && (Boolean(data.has_change) || hasFieldPayload);

  return {
    intent: has_change ? "field_change" : intent === "status_query" ? "status_query" : intent,
    has_change,
    field_changed: data.field_changed ?? null,
    new_value: data.new_value ?? null,
    changes: data.changes ?? null,
  };
}

export async function parseReplyChange(params: {
  originalText: string;
  replyText: string;
}): Promise<ParsedOrderChange> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return { intent: "ignore", has_change: false };
  }

  const userInput = `Исходная заявка менеджера:\n${params.originalText}\n\nНовый текст (reply):\n${params.replyText}`;

  const data =
    await perplexityJson<ParsedOrderChange>({
      apiKey,
      systemPrompt: ORDER_REPLY_PARSE_PROMPT,
      userInput,
      schema: ORDER_REPLY_CHANGE_SCHEMA,
      schemaName: "order_reply_change",
    });

  if (!data) return { intent: "ignore", has_change: false };
  return normalizeReplyChange(data);
}

