import { describe, expect, it } from "vitest";
import { makeItem } from "./schema";
import { isStagedKkt, kktReplyCount, kktReplyLimit, storyReplyTime, threadKktMessages, visibleKktMessages } from "./storyChat";
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
  it("supports the one-reply Masa conversation without changing Ayi's two-reply story", () => {
    const masaMessages=[
      makeItem({id:"masa-a",title:"瑪莎",body:"要去喔？",time:"2026-11-02 20:48",meta:{kktReplyPhase:"0"}}),
      makeItem({id:"masa-b",title:"瑪莎",body:"隨時回來",time:"2026-11-02 20:53",meta:{kktReplyPhase:"0",kktReplyAt:"2026-11-02 20:56"}}),
      makeItem({id:"masa-c",title:"瑪莎",body:"照顧好自己",time:"2026-11-02 20:59",meta:{kktReplyPhase:"1",kktReplyLimit:"1"}}),
    ];
    const reply=JSON.stringify(["瑪莎","我會啦","2026-11-02 20:56"]);
    expect(kktReplyLimit(masaMessages,"瑪莎")).toBe(1);
    expect(kktReplyLimit(items,"阿翊")).toBe(2);
    expect(visibleKktMessages(masaMessages,[]).map(x=>x.id)).toEqual(["masa-a","masa-b"]);
    expect(storyReplyTime(masaMessages,[],"瑪莎","09:41")).toBe("2026-11-02 20:56");
    expect(threadKktMessages(masaMessages,[reply],"瑪莎","陳信宏").map(x=>x.body))
      .toEqual(["要去喔？","隨時回來","我會啦","照顧好自己"]);
    expect(kktReplyCount([reply],"瑪莎")).toBe(kktReplyLimit(masaMessages,"瑪莎"));
  });
  it("reveals day two only after both first-day replies and timestamps the third reply in day two", () => {
    const previous=[
      makeItem({id:"first",title:"阿翊",body:"行前",time:"2026-11-02 22:07",meta:{kktReplyPhase:"1",kktReplyAt:"2026-11-02 22:09"}}),
      makeItem({id:"new",title:"阿翊",body:"晚上怎麼了？",time:"2026-11-04 22:27",meta:{kktReplyPhase:"2"}}),
      makeItem({id:"last",title:"阿翊",body:"你居然記得喔",time:"2026-11-04 22:44",meta:{kktReplyPhase:"2",kktReplyAt:"2026-11-04 22:47",kktReplyLimit:"3",kktReplyTrigger:"fullFriendsGame"}}),
    ];
    const two=[
      JSON.stringify(["阿翊","第一次","2026-11-02 22:01"]),
      JSON.stringify(["阿翊","第二次","2026-11-02 22:09"])
    ];
    expect(kktReplyLimit(previous,"阿翊")).toBe(3);
    expect(visibleKktMessages(previous,[]).map(x=>x.id)).toEqual([]);
    expect(visibleKktMessages(previous,two).map(x=>x.id)).toEqual(["first","new","last"]);
    expect(storyReplyTime(previous,two,"阿翊","09:41")).toBe("2026-11-04 22:47");
    const third=JSON.stringify(["阿翊","玩家第三次回覆","2026-11-04 22:47"]);
    expect(kktReplyCount([...two,third],"阿翊")).toBe(3);
    expect(threadKktMessages(previous,[...two,third],"阿翊","陳信宏").at(-1)?.body).toBe("玩家第三次回覆");
  });
  it("does not advance from another thread or malformed stored messages", () => {
    expect(kktReplyCount([JSON.stringify(["瑪莎","測試","22:00"]),"invalid"],"阿翊")).toBe(0);
    expect(threadKktMessages(items, [], "瑪莎","陳信宏").map(x=>x.body)).toEqual(["其他對話"]);
  });
});
