import { describe, expect, it } from "vitest";
import { makeItem } from "./schema";
import { chatMessageDelay, newestChatDate, pendingPacedMessages, visiblePacedMessages } from "./paceChat";
const history=makeItem({id:"old",title:"團員群",body:"之前的內容",time:"2026-11-02 21:10",sender:"瑪莎"});
const a=makeItem({id:"a",title:"團員群",body:"新的第一句",time:"2026-11-03 21:11",sender:"瑪莎"});
const b=makeItem({id:"b",title:"團員群",body:"再說一句",time:"2026-11-03 21:15",sender:"陳信宏"});
const other=makeItem({id:"other",title:"阿翊",body:"其他會話",time:"2026-11-02 21:00",sender:"阿翊"});
const local=makeItem({id:"reply",title:"團員群",body:"玩家輸入",time:"2026-11-03 21:12",sender:"陳信宏",outgoing:true,meta:{local:"true"}});
describe("paced chat playback",()=>{
  it("keeps archived days and other conversations readable, while pacing newly unlocked messages",()=>{
    const items=[history,a,b,other];
    expect(newestChatDate(items,"團員群")).toBe("2026-11-03");
    expect(visiblePacedMessages(items,[],"團員群").map(x=>x.id)).toEqual(["old","other"]);
    expect(pendingPacedMessages(items,[],"團員群").map(x=>x.id)).toEqual(["a","b"]);
    expect(visiblePacedMessages(items,["a"],"團員群").map(x=>x.id)).toEqual(["old","a","other"]);
    expect(pendingPacedMessages(items,["a","b"],"團員群")).toEqual([]);
  });
  it("does not delay the player's own reply or creator preview",()=>{
    const items=[a,local,b];
    expect(visiblePacedMessages(items,[],"團員群").map(x=>x.id)).toEqual(["reply"]);
    expect(pendingPacedMessages(items,[],"團員群").map(x=>x.id)).toEqual(["a","b"]);
    expect(visiblePacedMessages(items,[],"團員群",true)).toEqual(items);
  });
  it("computes natural capped delays without slowing down many historical days",()=>{
    expect(chatMessageDelay(undefined,a)).toBe(450);
    expect(chatMessageDelay(a,b)).toBeGreaterThan(1000);
    expect(chatMessageDelay(a,b)).toBeLessThanOrEqual(3900);
    const long=makeItem({id:"long",title:"團員群",body:"之後的話",time:"2026-11-20 18:00",sender:"陳信宏"});
    expect(chatMessageDelay(a,long)).toBeLessThanOrEqual(3900);
  });
});
