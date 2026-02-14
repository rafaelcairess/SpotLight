import { useMemo, useState } from "react";
import { ThumbsUp, ThumbsDown, Clock, Trash2, Pencil } from "lucide-react";
import { Review, useDeleteReview } from "@/hooks/useReviews";
import { useGamesByIds } from "@/hooks/useGames";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReviewForm from "@/components/game/ReviewForm";

interface ProfileReviewsProps {
  reviews: Review[];
  isLoading: boolean;
}

export function ProfileReviews({ reviews, isLoading }: ProfileReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const deleteReview = useDeleteReview();
  const [editingAppId, setEditingAppId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  const appIds = reviews.map((review) => review.app_id);
  const { data: catalogGames = [], isLoading: catalogLoading } = useGamesByIds(appIds);
  const gameMap = useMemo(
    () => new Map(catalogGames.map((game) => [game.app_id, game])),
    [catalogGames]
  );

  if (isLoading || catalogLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-secondary/50 rounded-lg p-4">
            <div className="h-4 bg-secondary rounded w-1/4 mb-2" />
            <div className="h-3 bg-secondary rounded w-full mb-1" />
            <div className="h-3 bg-secondary rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Você ainda não escreveu nenhuma review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const gameInfo = gameMap.get(review.app_id);
        const isMine = user?.id === review.user_id;

        return (
          <div
            key={review.id}
            className="bg-card rounded-lg border border-border/50 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-secondary/30">
              {gameInfo && (
                <img
                  src={gameInfo.image}
                  alt={gameInfo.title}
                  className="w-16 h-10 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{gameInfo?.title || `App ID: ${review.app_id}`}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  {review.hours_at_review !== null && review.hours_at_review > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {review.hours_at_review}h jogadas
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                    review.is_positive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  )}
                >
                  {review.is_positive ? (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      Recomendado
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="w-4 h-4" />
                      Não recomendado
                    </>
                  )}
                </div>
                {typeof review.score === "number" && (
                  <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                    {review.score}/5
                  </div>
                )}
                {isMine && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingAppId(review.app_id);
                        setEditingTitle(gameInfo?.title || `App ID: ${review.app_id}`);
                      }}
                      aria-label="Editar review"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={deleteReview.isPending}
                      onClick={async () => {
                        const confirmed = window.confirm(
                          "Tem certeza que deseja apagar sua review?"
                        );
                        if (!confirmed) return;
                        try {
                          await deleteReview.mutateAsync(review.id);
                          toast({ title: "Review apagada!" });
                        } catch (error) {
                          toast({ title: "Erro ao apagar review", variant: "destructive" });
                        }
                      }}
                      aria-label="Apagar review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
              <p className="text-foreground/90 whitespace-pre-wrap">{review.content}</p>
            </div>
          </div>
        );
      })}

      <Dialog
        open={editingAppId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAppId(null);
            setEditingTitle("");
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar review</DialogTitle>
            <DialogDescription>Atualize sua opinião sobre {editingTitle}.</DialogDescription>
          </DialogHeader>
          {editingAppId !== null && (
            <ReviewForm
              appId={editingAppId}
              onClose={() => {
                setEditingAppId(null);
                setEditingTitle("");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
