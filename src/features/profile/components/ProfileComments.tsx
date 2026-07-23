import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAddProfileComment,
  useDeleteProfileComment,
  useProfileComments,
} from "@/hooks/useProfileComments";
import { useToast } from "@/hooks/use-toast";

interface ProfileCommentsProps {
  profileUserId: string;
  permission: "public" | "friends" | "disabled";
  isFriend: boolean;
  isOwner?: boolean;
}

export function ProfileComments({
  profileUserId,
  permission,
  isFriend,
  isOwner = false,
}: ProfileCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const { data: comments = [], isLoading } = useProfileComments(profileUserId);
  const addComment = useAddProfileComment();
  const deleteComment = useDeleteProfileComment();
  const canComment =
    !!user && !isOwner && permission !== "disabled" && (permission === "public" || isFriend);

  const submit = async () => {
    try {
      await addComment.mutateAsync({ profileUserId, content });
      setContent("");
    } catch {
      toast({
        title: "Não foi possível publicar. Aguarde alguns segundos e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="rounded-2xl border border-border/50 bg-card/70 overflow-hidden">
      <header className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Comentários</h2>
          <span className="text-xs text-muted-foreground">{comments.length}</span>
        </div>
        {permission === "disabled" && (
          <span className="text-xs text-muted-foreground">Desativados pelo dono</span>
        )}
      </header>

      {canComment && (
        <div className="border-b border-border/40 p-4 space-y-3">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Deixe um comentário no perfil..."
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/600</span>
            <Button
              size="sm"
              onClick={submit}
              disabled={!content.trim() || addComment.isPending}
              className="gap-2"
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publicar
            </Button>
          </div>
        </div>
      )}

      {!user && permission !== "disabled" && (
        <p className="p-4 text-sm text-muted-foreground">Entre na sua conta para comentar.</p>
      )}
      {user && !isOwner && permission === "friends" && !isFriend && (
        <p className="p-4 text-sm text-muted-foreground">
          Somente amigos podem comentar neste perfil.
        </p>
      )}

      <div className="divide-y divide-border/30">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum comentário ainda.</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="flex gap-3 p-4">
              <Link to={`/u/${comment.author.username}`}>
                <UserAvatar
                  src={comment.author.avatar_url}
                  displayName={comment.author.display_name}
                  username={comment.author.username}
                  size="sm"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/u/${comment.author.username}`}
                      className="text-sm font-semibold hover:text-primary"
                    >
                      {comment.author.display_name || comment.author.username}
                    </Link>
                    <time className="ml-2 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
                        new Date(comment.created_at),
                      )}
                    </time>
                  </div>
                  {(isOwner || comment.author_id === user?.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir comentário"
                      onClick={() => deleteComment.mutate({ id: comment.id, profileUserId })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/85">
                  {comment.content}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
