import { describe, expect, it } from "vitest";
import fixture from "../stories/template/story.json";
import { compileStory } from "./story-engine/compiler";
import { dispatch, visible } from "./engine";
import { initialRuntime } from "./schema";

describe("post-interview unlock after DAY 01",()=>{
 const compiled=compileStory(fixture).work;
 const chat=compiled.data.wechat.filter(i=>i.title==="節目組｜後採");
 it("preserves a separate interview from the existing production chat",()=>{
  const item=fixture.chats.find(x=>x.id==="chat-interview-wx");
  expect(item?.participants).toEqual(["owner","interview"]);
  expect(item?.messages).toHaveLength(7);
  expect(chat).toHaveLength(7);
  expect(fixture.chats.some(x=>x.id==="chat-producer-wx")).toBe(true);
 });
 it("keeps all questions hidden until the first day's diary is completed",()=>{
  const initial=initialRuntime(compiled);
  expect(chat.every(i=>!visible(i,initial))).toBe(true);
  const afterTask=dispatch(compiled,initial,"read","task-d01");
  expect(chat.every(i=>!visible(i,afterTask))).toBe(true);
  const afterDiary=dispatch(compiled,afterTask,"read","diary-d01");
  expect(afterDiary.variables.interviewDay1Ready).toBe(true);
  expect(chat.every(i=>visible(i,afterDiary))).toBe(true);
 });
});
