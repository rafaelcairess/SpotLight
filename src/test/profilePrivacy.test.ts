import { describe, expect, it } from "vitest";
import {
  canCommentOnProfile,
  canViewProfileSection,
  isGameVisibleToViewer,
} from "@/lib/profilePrivacy";

describe("profile privacy", () => {
  const stranger = { isOwner: false, isFriend: false };
  const friend = { isOwner: false, isFriend: true };
  const owner = { isOwner: true, isFriend: false };

  it("allows public sections and protects private sections", () => {
    expect(canViewProfileSection("public", stranger)).toBe(true);
    expect(canViewProfileSection("private", stranger)).toBe(false);
  });

  it("allows friends-only sections only to accepted friends", () => {
    expect(canViewProfileSection("friends", friend)).toBe(true);
    expect(canViewProfileSection("friends", stranger)).toBe(false);
  });

  it("always allows the owner to view their own sections", () => {
    expect(canViewProfileSection("private", owner)).toBe(true);
  });

  it("applies comment permissions independently from profile visibility", () => {
    expect(canCommentOnProfile("public", stranger)).toBe(true);
    expect(canCommentOnProfile("friends", friend)).toBe(true);
    expect(canCommentOnProfile("friends", stranger)).toBe(false);
    expect(canCommentOnProfile("disabled", friend)).toBe(false);
    expect(canCommentOnProfile("public", owner)).toBe(false);
  });
});

describe("private library games", () => {
  it("never exposes hidden games and exposes private games only to the owner", () => {
    expect(isGameVisibleToViewer({ is_hidden: true, is_private: false }, true)).toBe(false);
    expect(isGameVisibleToViewer({ is_hidden: false, is_private: true }, false)).toBe(false);
    expect(isGameVisibleToViewer({ is_hidden: false, is_private: true }, true)).toBe(true);
    expect(isGameVisibleToViewer({ is_hidden: false, is_private: false }, false)).toBe(true);
  });
});
