import { describe, expect, it } from "vitest";
import { makeItem } from "./schema";
import {
  hasWeChatReplyGate, weChatReplyCount, weChatReplyLimit, weChatReplyTime,
  visibleWeChatScript, threadWeChatMessages,
} from "./weChatChat";
const items=[
  makeItem({id:"a",title:"節目組｜後採",body:"第一句",time:"2026-11-03 22:22",sender:"節目組｜後採",meta:{wechatReplyPhase:"0"}}),
  makeItem({id:"b",title:"節目組｜後採",body:"玩家請回覆",time:"2026-11-03 22:31",sender:"節目組｜後採",meta:{wechatReplyPhase:"0",wechatReplyAt:"2026-11-03 22:34"}}),
  makeItem({id:"c",title:"節目組｜後採",body:"和你一樣",time:"2026-11-03 22:36",sender:"節目組｜後採",meta:{wechatReplyPhase:"1",wechatReplyLimit:"1"}}),
  makeItem({id:"other",title:"節目組｜小周",body:"其他聊天",time:"2026-11-03 22:05",sender:"節目組｜小周"}),
];
const answer=JSON.stringify(["節目組｜後採","我的形容","2026-11-03 22:34"]);
describe("one-reply post-show interview on WeChat",()=>{
 it("holds the last answer until the player replies and doesn't affect other chats",()=>{
  expect(hasWeChatReplyGate(items,"節目組｜後採")).toBe(true);
  expect(weChatReplyLimit(items,"節目組｜後採")).toBe(1);
  expect(visibleWeChatScript(items,[]).map(x=>x.id)).toEqual(["a","b","other"]);
  expect(weChatReplyCount([answer],"節目組｜後採")).toBe(1);
  expect(weChatReplyCount([answer],"節目組｜小周")).toBe(0);
 });
 it("places the player's text in the correct chronological slot",()=>{
  expect(weChatReplyTime(items,[],"節目組｜後採","00:00")).toBe("2026-11-03 22:34");
  expect(threadWeChatMessages(items,[answer],"節目組｜後採","陳信宏").map(x=>x.body))
   .toEqual(["第一句","玩家請回覆","我的形容","和你一樣"]);
 });
 it("keeps full-friends dialogue behind the player's one free reply",()=>{
  const group=[
    makeItem({id:"q",title:"滿分朋友｜遊戲群",body:"你覺得滿分朋友應該是什麼樣？",time:"2026-11-04 22:51",sender:"周可",meta:{wechatReplyPhase:"0"}}),
    makeItem({id:"answer",title:"滿分朋友｜遊戲群",body:"我的四個團員啊",time:"2026-11-04 22:52",sender:"阿翊",meta:{wechatReplyPhase:"0",wechatReplyAt:"2026-11-04 22:55"}}),
    makeItem({id:"question2",title:"滿分朋友｜遊戲群",body:"阿信哥來說一下",time:"2026-11-04 22:58",sender:"陸景",meta:{wechatReplyPhase:"1",wechatReplyLimit:"1"}}),
  ];
  const playerReply=JSON.stringify(["滿分朋友｜遊戲群","我自己說一句","2026-11-04 22:55"]);
  expect(visibleWeChatScript(group,[]).map(x=>x.id)).toEqual(["q","answer"]);
  expect(weChatReplyTime(group,[],"滿分朋友｜遊戲群","09:41")).toBe("2026-11-04 22:55");
  expect(threadWeChatMessages(group,[playerReply],"滿分朋友｜遊戲群","陳信宏").map(x=>x.body))
    .toEqual(["你覺得滿分朋友應該是什麼樣？","我的四個團員啊","我自己說一句","阿信哥來說一下"]);
  expect(weChatReplyCount([playerReply],"節目組｜後採")).toBe(0);
 });
 it("ignores malformed saved values",()=>{
  expect(weChatReplyCount(["bad json",JSON.stringify(["only two","values"])],"節目組｜後採")).toBe(0);
  expect(hasWeChatReplyGate(items,"節目組｜小周")).toBe(false);
 });
});
