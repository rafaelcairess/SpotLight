import { useEffect, useState } from "react";
import { X, Users, Star, Calendar, Building, Tag, ExternalLink } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import { GameLibraryActions } from "@/components/game/GameLibraryActions";
import ReviewDialog from "@/components/game/ReviewDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface GameModalProps {
  game: GameData | null;
  isOpen: boolean;
  onClose: () => void;
}

const GameModal = ({ game, isOpen, onClose }: GameModalProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!game) return null;

  useEffect(() => {
    if (!isOpen) {
      setIsReviewOpen(false);
    }
  }, [isOpen]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border/50 gap-0">
        {/* Hero Image */}
        <div className="relative aspect-video">
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 featured-overlay" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-2xl md:text-3xl font-bold">{game.title}</h2>
            {game.genre && (
              <Badge variant="secondary" className="mt-2">
                {game.genre}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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

          {/* Tags */}
          {game.tags && game.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Library Actions */}
          <div className="pt-4 border-t border-border/50">
            <GameLibraryActions appId={Number(game.app_id)} onWriteReview={handleWriteReview} />
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
      <ReviewDialog
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        appId={Number(game.app_id)}
        gameTitle={game.title}
      />
    </Dialog>
  );
};

export default GameModal;
