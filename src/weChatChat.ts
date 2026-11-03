import { makeItem, type Item } from "./schema";

/** Stored as a JSON tuple to remain compatible with serializable UI saves. */
export type SavedWeChatReply = { thread: string; body: string; time: string };
export function parseWeChatReply(raw: string): SavedWeChatReply | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length !== 3 || !data.every(v => typeof v === "string")) return null;
    return { thread: data[0], body: data[1], time: data[2] };
  } catch {
    return null;
  }
}

export function hasWeChatReplyGate(items: Item[], thread: string): boolean {
  return items.some(i => i.title === thread && i.meta.wechatReplyPhase !== undefined);
}

export function weChatReplyCount(saved: string[], thread: string): number {
  return saved.reduce((n, raw) => n + (parseWeChatReply(raw)?.thread === thread ? 1 : 0), 0);
}

export function weChatReplyLimit(items: Item[], thread: string): number {
  const text = items.filter(i => i.title === thread && i.meta.wechatReplyLimit)
    .at(-1)?.meta.wechatReplyLimit;
  const n=Number(text);
  return text && Number.isInteger(n) && n>0 && n<=20 ? n : 1;
}

export function visibleWeChatScript(items: Item[], saved: string[]): Item[] {
  return items.filter(i => i.meta.wechatReplyPhase === undefined ||
    Number(i.meta.wechatReplyPhase) <= weChatReplyCount(saved, i.title));
}

export function weChatReplyTime(items: Item[], saved: string[], thread: string, fallback: string): string {
  if (!hasWeChatReplyGate(items, thread)) return fallback;
  const phase = String(weChatReplyCount(saved, thread));
  return items.filter(i => i.title === thread && i.meta.wechatReplyPhase === phase)
    .at(-1)?.meta.wechatReplyAt || fallback;
}

export function threadWeChatMessages(items: Item[], saved: string[], thread: string, owner: string): Item[] {
  const scripted = visibleWeChatScript(items, saved).filter(i => i.title === thread);
  const replies = saved.flatMap((raw, index) => {
    const reply = parseWeChatReply(raw);
    if (!reply || reply.thread !== thread) return [];
    return [makeItem({
      id: "local-wechat-" + index, title: thread, body: reply.body, time: reply.time,
      sender: owner, outgoing: true, meta: { local: "true" },
    })];
  });
  const combined = [...scripted, ...replies];
  return hasWeChatReplyGate(items, thread)
    ? combined.sort((a, b) => a.time.localeCompare(b.time))
    : combined;
}
