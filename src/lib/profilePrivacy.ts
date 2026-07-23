export type ProfileVisibility = "public" | "friends" | "private";
export type CommentPermission = ProfileVisibility | "disabled";

type ViewerRelationship = {
  isOwner: boolean;
  isFriend: boolean;
};

/**
 * Espelha no frontend a mesma decisão aplicada pelas políticas RLS.
 * A RLS continua sendo a barreira de segurança; esta função evita mostrar
 * controles e estados que o backend recusará.
 */
export function canViewProfileSection(
  visibility: string | null | undefined,
  relationship: ViewerRelationship,
) {
  if (relationship.isOwner) return true;
  if (visibility === "public") return true;
  return visibility === "friends" && relationship.isFriend;
}

export function canCommentOnProfile(
  permission: string | null | undefined,
  relationship: ViewerRelationship,
) {
  if (relationship.isOwner || permission === "disabled") return false;
  if (permission === "public") return true;
  return permission === "friends" && relationship.isFriend;
}

export function isGameVisibleToViewer(
  game: { is_hidden: boolean; is_private: boolean },
  isOwner: boolean,
) {
  if (game.is_hidden) return false;
  return isOwner || !game.is_private;
}
