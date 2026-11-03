import { useEffect } from "react";
import type { Item } from "./schema";
import type { SkinProps } from "./AppSkins";
import { useSkinState } from "./skinState";

/** A conversation's already-archived days remain readable. Only the newest available day plays like a live conversation. */
export function newestChatDate(items: Item[], thread: string): string {
  return items.filter(i => i.title === thread).reduce((best, i) => {
    const date = i.time.slice(0, 10);
    return date > best ? date : best;
  }, "");
}

export function visiblePacedMessages(
  items: Item[], delivered: readonly string[], thread: string, creator = false,
): Item[] {
  if (!thread || creator) return items;
  const latest = newestChatDate(items, thread);
  const seen = new Set(delivered);
  return items.filter(i =>
    i.title !== thread || i.meta.local === "true" ||
    i.time.slice(0, 10) < latest || seen.has(i.id)
  );
}

export function pendingPacedMessages(
  items: Item[], delivered: readonly string[], thread: string,
): Item[] {
  if (!thread) return [];
  const latest = newestChatDate(items, thread);
  const seen = new Set(delivered);
  return items
    .filter(i =>
      i.title === thread && i.meta.local !== "true" &&
      i.time.slice(0, 10) === latest && !seen.has(i.id)
    )
    .sort((a, b) => a.time.localeCompare(b.time));
}

function timeMinutes(time: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  return Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]))/60000;
}

/** Delay in real milliseconds. Story timestamps remain unchanged; the playback is intentionally accelerated. */
export function chatMessageDelay(previous: Item | undefined, next: Item): number {
  if (!previous) return 450;
  const a=timeMinutes(previous.time),b=timeMinutes(next.time);
  const minutes=a===null||b===null?1:Math.max(0,Math.min(12,b-a));
  const base=previous.sender===next.sender?780:1270;
  return Math.min(3900,Math.max(850,Math.round(base+minutes*155+Math.min(650,next.body.length*13))));
}

export function usePacedThread(p: SkinProps, allItems: Item[]) {
  const [delivered, setDelivered] = useSkinState<string[]>(p,"pacedMessageIds",[]);
  const waiting = !p.creator && !!p.thread
    ? pendingPacedMessages(allItems,delivered,p.thread)
    : [];
  const next = waiting[0];
  const before = allItems
    .filter(i=>i.title===p.thread && (i.meta.local==="true" || delivered.includes(i.id) ||
      i.time.slice(0,10)<newestChatDate(allItems,p.thread)))
    .at(-1);
  const delay = next ? chatMessageDelay(before,next) : 0;
  const nextId = next?.id ?? "";
  useEffect(()=>{
    if(p.creator||!p.thread||!nextId||!p.onUi)return;
    const timer=window.setTimeout(()=>{
      setDelivered(current=>current.includes(nextId)?current:[...current,nextId]);
    },delay);
    return ()=>window.clearTimeout(timer);
    // The scheduled message's ID is the stable playback key; parent UI callbacks are recreated every render.
  },[p.creator,p.thread,nextId,delay]);
  return {
    items: visiblePacedMessages(allItems,delivered,p.thread,p.creator),
    pending: waiting.length>0,
    next,
    delivered,
  };
}
