import { describe, expect, it } from "vitest";
import { makeItem } from "./schema";
import { isStagedKkt, kktReplyCount, storyReplyTime, threadKktMessages, visibleKktMessages } from "./storyChat";
const items = [
  makeItem({ id: "a", title: "阿翊", body: "第一則", time: "2026-11-02 21:59", meta: { kktReplyPhase: "0", kktReplyAt: "2026-11-02 22:01" } }),
  makeItem({ id: "b", title: "阿翊", body: "第二則", time: "2026-11-02 22:03", meta: { kktReplyPhase: "1", kktReplyAt: "2026-11-02 22:09" } }),
  makeItem({ id: "c", title: "瑪莎", body: "其他對話", time: "2026-11-02 21:00" }),
];
const reply1 = JSON.stringify(["阿翊", "自由輸入1", "2026-11-02 22:01"]);
const reply2 = JSON.stringify(["阿翊", "自由輸入2", "2026-11-02 22:09"]);

describe("KKT staged free-form replies", () => {
  it("locks the second part until a player sends something", () => {
    expect(isStagedKkt(items, "阿翊")).toBe(true);
    expect(visibleKktMessages(items, []).map(x => x.id)).toEqual(["a", "c"]);
    expect(storyReplyTime(items, [], "阿翊", "00:00")).toBe("2026-11-02 22:01");
  });
  it("places both user messages chronologically between scripted replies", () => {
    expect(kktReplyCount([reply1], "阿翊")).toBe(1);
    expect(threadKktMessages(items, [reply1], "阿翊", "陳信宏").map(x=>x.body)).toEqual(["第一則","自由輸入1","第二則"]);
    expect(storyReplyTime(items,[reply1],"阿翊","00:00")).toBe("2026-11-02 22:09");
    expect(threadKktMessages(items,[reply1,reply2],"阿翊","陳信宏").map(x=>x.body)).toEqual(["第一則","自由輸入1","第二則","自由輸入2"]);
  });
  it("does not advance from another thread or malformed stored messages", () => {
    expect(kktReplyCount([JSON.stringify(["瑪莎","測試","22:00"]),"invalid"],"阿翊")).toBe(0);
    expect(threadKktMessages(items, [], "瑪莎","陳信宏").map(x=>x.body)).toEqual(["其他對話"]);
  });
});
