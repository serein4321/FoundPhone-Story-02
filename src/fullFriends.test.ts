import { describe, expect, it } from "vitest";
import fixture from "../stories/template/story.json";
import { compileStory, type Story } from "./story-engine/compiler";
import { dispatch, visible } from "./engine";
import { initialRuntime } from "./schema";

describe("full-friends game group", () => {
  const compiled = compileStory(fixture).work;
  const lobby = compiled.data.wechat.find(i=>i.id==="full-friends-group-lobby");
  const rules = compiled.data.files.find(i=>i.id==="full-friends-game-rules");
  it("has a truly empty group with all original guests, later replacements and the program coordinator", () => {
    const group = fixture.chats.find(c=>c.id==="chat-perfect-friends-wx");
    expect(group?.messages).toEqual([]);
    expect(group?.participants).toHaveLength(11);
    expect(lobby?.meta.groupLobby).toBe("fullFriends");
    expect(lobby?.meta.memberNames.split("|")).toHaveLength(11);
  });
  it("unlocks the lobby and rule card only after day two's diary is completed", () => {
    expect(lobby).toBeDefined();
    expect(rules).toBeDefined();
    const start = dispatch(compiled, initialRuntime(compiled), "start");
    expect(visible(lobby!, start)).toBe(false);
    expect(visible(rules!, start)).toBe(false);
    const first = dispatch(compiled, start,"read","diary-d01");
    expect(visible(lobby!,first)).toBe(false);
    const second = dispatch(compiled,first,"read","diary-d02");
    expect(second.variables.fullFriendsStarted).toBe(true);
    expect(visible(lobby!,second)).toBe(true);
    expect(visible(rules!,second)).toBe(true);
    expect(second.notifications.some(x=>x.includes("滿分朋友"))).toBe(true);
  });
  it("future authored group messages inherit the same day two gate", () => {
    const copy=structuredClone(fixture) as unknown as Story;
    const group=copy.chats.find(c=>c.id==="chat-perfect-friends-wx");
    if (!group) throw Error("No group");
    group.messages.push({id:"future-user-message",senderId:"owner",body:"新填寫內容",time:"2026-11-04 22:31"});
    const work=compileStory(copy).work;
    const message=work.data.wechat.find(x=>x.id==="future-user-message");
    if(!message)throw Error("No message");
    expect(message.unlock).toBe("fullFriendsStarted");
    const initial=initialRuntime(work);
    expect(visible(message,initial)).toBe(false);
    expect(visible(message,dispatch(work,initial,"read","diary-d02"))).toBe(true);
  });
});
