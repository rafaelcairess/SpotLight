/**
 * Componente da feature games.
 */

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Clock, Trash2, Pencil, Smile, BadgeCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useReviewsByGame, useDeleteReview } from "@/hooks/useReviews";
import {
  useAddReviewReaction,
  useRemoveReviewReaction,
  useReviewReactions,
  type ReviewReactionType,
} from "@/hooks/useReviewReactions";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDateLocale } from "@/i18n/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReviewForm from "@/features/reviews/components/ReviewForm";
import { cn } from "@/lib/utils";

interface GameModalReviewsProps {
  appId: number;
  gameTitle: string;
}

export const GameModalReviews = ({ appId, gameTitle }: GameModalReviewsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const dateLocale = getDateLocale(locale);

  // Carrega as reviews e reacoes desta pagina.
  const { data: reviews = [], isLoading } = useReviewsByGame(appId);
  const deleteReview = useDeleteReview();
  const { data: reactionData } = useReviewReactions(reviews.map((review) => review.id));
  const addReaction = useAddReviewReaction();
  const removeReaction = useRemoveReviewReaction();

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const isReactionBusy = addReaction.isPending || removeReaction.isPending;

  const reactionItems: Array<{
    type: ReviewReactionType;
    label: string;
    icon: typeof ThumbsUp;
    showLabel?: boolean;
  }> = [
    { type: "like", label: t("gameModal.reactionLike"), icon: ThumbsUp, showLabel: false },
    { type: "dislike", label: t("gameModal.reactionDislike"), icon: ThumbsDown, showLabel: false },
    { type: "funny", label: t("gameModal.reactionFunny"), icon: Smile, showLabel: true },
    { type: "useful", label: t("gameModal.reactionUseful"), icon: BadgeCheck, showLabel: true },
  ];

  const handleToggleReaction = async (
    reviewId: string,
    reaction: ReviewReactionType,
    userSet: Set<ReviewReactionType>,
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
      toast({ title: t("gameModal.reactionError"), variant: "destructive" });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm(t("gameModal.deleteReviewConfirm"));
    if (!confirmed) return;
    try {
      await deleteReview.mutateAsync(reviewId);
      toast({ title: t("gameModal.reviewDeleted") });
    } catch (error) {
      toast({ title: t("gameModal.reviewDeleteError"), variant: "destructive" });
    }
  };

  return (
    <div className="pt-4 border-t border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{t("gameModal.communityReviews")}</h3>
        <span className="text-xs text-muted-foreground">
          {reviews.length === 1
            ? t("gameModal.reviewsCountOne", { count: reviews.length })
            : t("gameModal.reviewsCountMany", { count: reviews.length })}
        </span>
      </div>

      {isLoading ? (
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
        <div className="text-sm text-muted-foreground">{t("gameModal.reviewsEmpty")}</div>
      ) : (
        <div className="space-y-3">
          {visibleReviews.map((review) => {
            const author =
              review.profiles?.display_name || review.profiles?.username || t("profile.reviews");
            const isMine = !!user && review.user_id === user.id;

            return (
              <div
                key={review.id}
                className={cn(
                  "rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3",
                  isMine && "border-primary/40 bg-primary/5",
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
                            locale: dateLocale,
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
                            onClick={() => setIsEditOpen(true)}
                            aria-label={t("gameModal.editReview")}
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
                            aria-label={t("gameModal.deleteReview")}
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
                            : "bg-rose-500/10 text-rose-500",
                        )}
                      >
                        {review.is_positive ? (
                          <>
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {t("gameModal.recommended")}
                          </>
                        ) : (
                          <>
                            <ThumbsDown className="w-3.5 h-3.5" />
                            {t("gameModal.notRecommended")}
                          </>
                        )}
                      </span>
                      {typeof review.score === "number" && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary">
                          {review.score}/5
                        </span>
                      )}
                      {review.hours_at_review !== null && review.hours_at_review > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {review.hours_at_review}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.content}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {reactionItems.map((item) => {
                    const counts = reactionData?.counts.get(review.id) ?? {
                      like: 0,
                      dislike: 0,
                      funny: 0,
                      useful: 0,
                    };
                    const userSet = reactionData?.userReactions.get(review.id) ?? new Set();
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
                          isActive && "border-primary/50 bg-primary/10 text-primary",
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
              {t("gameModal.seeAllReviews")}
            </Button>
          )}
        </div>
      )}

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) setIsEditOpen(false);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("gameModal.editReviewTitle")}</DialogTitle>
            <DialogDescription>
              {t("gameModal.editReviewDescription", { title: gameTitle })}
            </DialogDescription>
          </DialogHeader>
          <ReviewForm appId={appId} onClose={() => setIsEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
