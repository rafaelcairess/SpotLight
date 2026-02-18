import { useEffect, useState } from "react";

import { X, Users, Star, Calendar, Building, ThumbsUp, ThumbsDown, Clock, Trash2, Pencil, Bell, Smile, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import { GameLibraryActions } from "@/components/game/GameLibraryActions";
import ReviewForm from "@/components/game/ReviewForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useReviewsByGame, useDeleteReview } from "@/hooks/useReviews";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useAddReviewReaction, useRemoveReviewReaction, useReviewReactions, type ReviewReactionType } from "@/hooks/useReviewReactions";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import steamIcon from "../../assets/steam.png";


interface GameModalProps {

  game: GameData | null;

  isOpen: boolean;

  onClose: () => void;

}



const GameModal = ({ game, isOpen, onClose }: GameModalProps) => {
  // Estado local da UI (editor de review + controles da lista).
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [editingReviewAppId, setEditingReviewAppId] = useState<number | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByGame(
    Number(game?.app_id)
  );
  const deleteReview = useDeleteReview();
  const { data: reactionData } = useReviewReactions(reviews.map((review) => review.id));
  const addReaction = useAddReviewReaction();
  const removeReaction = useRemoveReviewReaction();
  const {
    alerts: priceAlerts,
    addAlert,
    removeAlert,
    isLoading: alertsLoading,
  } = usePriceAlerts(Number(game?.app_id));

  useEffect(() => {
    if (!isOpen) {
      setIsReviewOpen(false);
      setShowAllReviews(false);
      setEditingReviewAppId(null);
      setIsAlertOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isAlertOpen) return;
    const currentAlert = priceAlerts[0];
    if (currentAlert?.target_price !== null && currentAlert?.target_price !== undefined) {
      setTargetPriceInput(String(currentAlert.target_price));
    } else {
      setTargetPriceInput("");
    }
  }, [isAlertOpen, priceAlerts]);

  if (!game) return null;


  // Helpers de UI para formataÃ§Ã£o de nota e jogadores.
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



  // CTA externo (Steam).
  const handleOpenSteam = () => {
    window.open(

      `https://store.steampowered.com/app/${game.app_id}`,

      "_blank",

      "noopener,noreferrer"

    );

  };



  // AÃ§Ãµes para criar/editar/excluir reviews.
  const handleWriteReview = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsReviewOpen(true);
  };

  const handleEditReview = () => {
    if (!user || !game) return;
    setEditingReviewAppId(Number(game.app_id));
  };

  const handleOpenAlert = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsAlertOpen(true);
  };

  const handleSaveAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!game) return;

    const raw = targetPriceInput.trim();
    const normalized = raw === "" ? null : Number(raw.replace(",", "."));
    if (normalized !== null && (Number.isNaN(normalized) || normalized < 0)) {
      toast({
        title: "PreÃ§o invÃ¡lido",
        description: "Informe um valor válido ou deixe vazio para qualquer promoção.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addAlert.mutateAsync({
        gameId: Number(game.app_id),
        targetPrice: normalized,
      });
      toast({ title: "Alerta de promoção ativado!" });
      setIsAlertOpen(false);
    } catch (error) {
      toast({ title: "NÃ£o foi possÃ­vel salvar o alerta", variant: "destructive" });
    }
  };

  const handleRemoveAlert = async () => {
    const currentAlert = priceAlerts[0];
    if (!currentAlert) return;
    try {
      await removeAlert.mutateAsync(currentAlert.id);
      toast({ title: "Alerta removido." });
      setIsAlertOpen(false);
    } catch (error) {
      toast({ title: "NÃ£o foi possÃ­vel remover o alerta", variant: "destructive" });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm("Tem certeza que deseja apagar sua review?");
    if (!confirmed) return;
    try {
      await deleteReview.mutateAsync(reviewId);
      toast({ title: "Review apagada!" });
    } catch (error) {
      toast({ title: "Erro ao apagar review", variant: "destructive" });
    }
  };

  // Mostra sÃ³ as reviews mais recentes por padrÃ£o (expandir sob demanda).
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const activeAlert = priceAlerts[0] ?? null;
  const isAlertBusy = addAlert.isPending || removeAlert.isPending;
  const isReactionBusy = addReaction.isPending || removeReaction.isPending;

  const reactionItems: Array<{
    type: ReviewReactionType;
    label: string;
    icon: typeof ThumbsUp;
    showLabel?: boolean;
  }> = [
    { type: "like", label: "Curtir", icon: ThumbsUp, showLabel: false },
    { type: "dislike", label: "Não curti", icon: ThumbsDown, showLabel: false },
    { type: "funny", label: "Engraçada", icon: Smile, showLabel: true },
    { type: "useful", label: "Útil", icon: BadgeCheck, showLabel: true },
  ];

  const handleToggleReaction = async (
    reviewId: string,
    reaction: ReviewReactionType,
    userSet: Set<ReviewReactionType>
  ) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const isActive = userSet.has(reaction);
    const opposite: ReviewReactionType | null =
      reaction === "like" ? "dislike" : reaction === "dislike" ? "like" : null;

    try {
      if (opposite && userSet.has(opposite)) {
        await removeReaction.mutateAsync({ reviewId, reaction: opposite });
      }

      if (isActive) {
        await removeReaction.mutateAsync({ reviewId, reaction });
      } else {
        await addReaction.mutateAsync({ reviewId, reaction });
      }
    } catch (error) {
      toast({ title: "Não foi possível atualizar a reação", variant: "destructive" });
    }
  };


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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">{author}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                            {isMine && (
                              <div className="ml-auto flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={handleEditReview}
                                  aria-label="Editar review"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteReview(review.id)}
                                  disabled={deleteReview.isPending}
                                  aria-label="Apagar review"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
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
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {reactionItems.map((item) => {
                          const counts =
                            reactionData?.counts.get(review.id) ?? {
                              like: 0,
                              dislike: 0,
                              funny: 0,
                              useful: 0,
                            };
                          const userSet =
                            reactionData?.userReactions.get(review.id) ?? new Set();
                          const isActive = userSet.has(item.type);

                          return (
                            <button
                              key={item.type}
                              type="button"
                              disabled={isReactionBusy}
                              onClick={() => handleToggleReaction(review.id, item.type, userSet)}
                              aria-label={item.label}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border border-border/40 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground",
                                isActive && "border-primary/50 bg-primary/10 text-primary"
                              )}
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              {item.showLabel && <span>{item.label}</span>}
                              <span className="text-[11px] tabular-nums text-muted-foreground">
                                {counts[item.type]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
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


          <Dialog
            open={editingReviewAppId !== null}
            onOpenChange={(open) => {
              if (!open) setEditingReviewAppId(null);
            }}
          >
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Editar review</DialogTitle>
                <DialogDescription>
                  Atualize sua opinião sobre {game.title}.
                </DialogDescription>
              </DialogHeader>
              {editingReviewAppId !== null && (
                <ReviewForm
                  appId={editingReviewAppId}
                  onClose={() => setEditingReviewAppId(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Alerta de promoção</DialogTitle>
                <DialogDescription>
                  Defina um preço alvo ou deixe vazio para ser avisado em qualquer desconto.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveAlert} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-target-price">Preço alvo (opcional)</Label>
                  <Input
                    id="alert-target-price"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Ex: 49.90"
                    value={targetPriceInput}
                    onChange={(event) => setTargetPriceInput(event.target.value)}
                  />
                </div>

                {activeAlert && (
                  <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 text-xs text-muted-foreground">
                    Alerta ativo {activeAlert.target_price ? "com preço alvo" : "para qualquer promoção"}.
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {activeAlert && (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={handleRemoveAlert}
                      disabled={isAlertBusy}
                    >
                      Remover alerta
                    </Button>
                  )}
                  <Button type="submit" disabled={isAlertBusy}>
                    {isAlertBusy ? "Salvando..." : "Salvar alerta"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Price & CTA */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border/50">
            <div className="space-y-2">
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

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleOpenAlert}
                  disabled={isAlertBusy}
                >
                  <Bell className="w-4 h-4" />
                  {alertsLoading
                    ? "Carregando alerta..."
                    : activeAlert
                    ? "Editar alerta de promoção"
                    : "Receber alerta de promoção"}
                </Button>
                {activeAlert && (
                  <span className="text-xs text-muted-foreground">
                    Alerta ativo
                  </span>
                )}
              </div>
            </div>

            <Button onClick={handleOpenSteam} variant="outline" className="gap-2">
              <img src={steamIcon} alt="Steam" className="w-4 h-4" />
              Ver na Steam
            </Button>
          </div>
        </div>

      </DialogContent>

    </Dialog>

  );

};



export default GameModal;

