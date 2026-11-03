import { makeItem, type Item } from "./schema";

type SavedReply = { thread: string; body: string; time: string };
export function parseSavedReply(raw: string): SavedReply | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length !== 3 || !data.every(v => typeof v === "string")) return null;
    return { thread: data[0], body: data[1], time: data[2] };
  } catch {
    return null;
  }
}

export function isStagedKkt(items: Item[], thread: string): boolean {
  return items.some(i => i.title === thread && i.meta.kktReplyPhase !== undefined);
}

export function kktReplyCount(saved: string[], thread: string): number {
  return saved.filter(raw => parseSavedReply(raw)?.thread === thread).length;
}

/** Individual scripted conversations may end after one reply, while older stories keep their two-reply flow. */
export function kktReplyLimit(items: Item[], thread: string): number {
  const configured=items
    .filter(i=>i.title===thread && i.meta.kktReplyLimit)
    .at(-1)?.meta.kktReplyLimit;
  const parsed=Number(configured);
  return configured && Number.isInteger(parsed) && parsed>=1 && parsed<=20 ? parsed : 2;
}

export function visibleKktMessages(items: Item[], saved: string[]): Item[] {
  return items.filter(i => i.meta.kktReplyPhase === undefined ||
    Number(i.meta.kktReplyPhase) <= kktReplyCount(saved, i.title));
}

export function storyReplyTime(items: Item[], saved: string[], thread: string, fallback: string): string {
  if (!isStagedKkt(items, thread)) return fallback;
  const stage = String(kktReplyCount(saved, thread));
  return items.filter(i => i.title === thread && i.meta.kktReplyPhase === stage)
    .at(-1)?.meta.kktReplyAt || fallback;
}

export function threadKktMessages(items: Item[], saved: string[], thread: string, owner: string): Item[] {
  const script = visibleKktMessages(items, saved).filter(i => i.title === thread);
  const replies = saved.flatMap((raw, index) => {
    const r = parseSavedReply(raw);
    return r?.thread === thread ? [makeItem({
      id: "local-kkt-" + index, title: thread, body: r.body, time: r.time,
      sender: owner, outgoing: true, meta: { local: "true" },
    })] : [];
  });
  const merged = [...script, ...replies];
  return isStagedKkt(items, thread)
    ? merged.sort((a, b) => a.time.localeCompare(b.time))
    : merged;
}
