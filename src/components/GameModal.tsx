import { useEffect, useState } from "react";
import { X, Users, Star, Calendar, Building, ExternalLink, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import { GameLibraryActions } from "@/components/game/GameLibraryActions";
import ReviewForm from "@/components/game/ReviewForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useReviewsByGame } from "@/hooks/useReviews";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GameModalProps {
  game: GameData | null;
  isOpen: boolean;
  onClose: () => void;
}

const GameModal = ({ game, isOpen, onClose }: GameModalProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByGame(
    Number(game?.app_id)
  );

  useEffect(() => {
    if (!isOpen) {
      setIsReviewOpen(false);
      setShowAllReviews(false);
    }
  }, [isOpen]);

  if (!game) return null;

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-muted-foreground";
    if (rating >= 80) return "rating-positive";
    if (rating >= 50) return "rating-mixed";
    return "rating-negative";
  };

  const formatPlayers = (count?: number) => {
    if (!count) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleOpenSteam = () => {
    window.open(
      `https://store.steampowered.com/app/${game.app_id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleWriteReview = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsReviewOpen(true);
  };

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 bg-card border-border/50 gap-0 max-h-[90vh] overflow-hidden grid-rows-[auto_1fr]">
        {/* Compact Header */}
        <div className="border-b border-border/50 bg-gradient-to-br from-background via-background/95 to-background p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-24 sm:w-28 md:w-32 aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-black/40 flex-shrink-0">
              <img
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.app_id}/library_600x900.jpg`}
                alt={game.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(event) => {
                  const target = event.currentTarget;
                  if (target.src !== game.image) {
                    target.src = game.image;
                  }
                }}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold">{game.title}</h2>
              {game.genre && (
                <Badge variant="secondary" className="mt-2">
                  {game.genre}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto min-h-0">
          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-6">
            {game.activePlayers && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jogando Agora</p>
                  <p className="font-semibold">
                    {formatPlayers(game.activePlayers)}
                  </p>
                </div>
              </div>
            )}

            {game.communityRating && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    game.communityRating >= 80
                      ? "bg-emerald-500/10"
                      : game.communityRating >= 50
                      ? "bg-amber-500/10"
                      : "bg-red-500/10"
                  )}
                >
                  <Star
                    className={cn(
                      "w-4 h-4 fill-current",
                      getRatingColor(game.communityRating)
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avaliação</p>
                  <p
                    className={cn("font-semibold", getRatingColor(game.communityRating))}
                  >
                    {game.communityRating}%
                  </p>
                </div>
              </div>
            )}

            {game.releaseDate && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-secondary">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lançamento</p>
                  <p className="font-semibold">{game.releaseDate}</p>
                </div>
              </div>
            )}

            {game.developer && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-secondary">
                  <Building className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Desenvolvedor</p>
                  <p className="font-semibold">{game.developer}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {game.short_description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Sobre o Jogo
              </h3>
              <p className="text-foreground/90 leading-relaxed">
                {game.short_description}
              </p>
            </div>
          )}

          {/* Library Actions */}
          <div className="pt-4 border-t border-border/50 space-y-4">
            <GameLibraryActions appId={Number(game.app_id)} onWriteReview={handleWriteReview} />
            {isReviewOpen && (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3">
                <h3 className="text-sm font-medium text-foreground">Escrever Review</h3>
                <ReviewForm
                  appId={Number(game.app_id)}
                  onClose={() => setIsReviewOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Community Reviews */}
          <div className="pt-4 border-t border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Reviews da comunidade</h3>
              <span className="text-xs text-muted-foreground">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, idx) => (
                  <div key={idx} className="animate-pulse bg-secondary/30 rounded-lg p-4">
                    <div className="h-3 bg-secondary rounded w-1/3 mb-2" />
                    <div className="h-3 bg-secondary rounded w-full mb-1" />
                    <div className="h-3 bg-secondary rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhuma review ainda. Seja o primeiro a comentar.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleReviews.map((review) => {
                  const author =
                    review.profiles?.display_name ||
                    review.profiles?.username ||
                    "Jogador";
                  const isMine = !!user && review.user_id === user.id;

                  return (
                    <div
                      key={review.id}
                      className={cn(
                        "rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3",
                        isMine && "border-primary/40 bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          src={review.profiles?.avatar_url}
                          displayName={author}
                          username={review.profiles?.username}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{author}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(review.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                                review.is_positive
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-rose-500/10 text-rose-500"
                              )}
                            >
                              {review.is_positive ? (
                                <>
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  Recomendado
                                </>
                              ) : (
                                <>
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  Não recomendado
                                </>
                              )}
                            </span>
                            {typeof review.score === "number" && (
                              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary">
                                {review.score}/5
                              </span>
                            )}
                            {review.hours_at_review !== null &&
                              review.hours_at_review > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  {review.hours_at_review}h
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                        {review.content}
                      </p>
                    </div>
                  );
                })}
                {reviews.length > 3 && !showAllReviews && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowAllReviews(true)}
                  >
                    Ver todas as reviews
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            {game.price && (
              <div>
                <p className="text-xs text-muted-foreground">Preço</p>
                <p className="text-xl font-bold text-primary">
                  {game.price === "Free" || game.price === "0"
                    ? "Grátis"
                    : game.price}
                </p>
              </div>
            )}
            <Button onClick={handleOpenSteam} variant="outline" className="gap-2">
              Ver na Steam
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameModal;
