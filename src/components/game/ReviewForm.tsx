import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateReview,
  useUpdateReview,
  useUserReviewForGame,
} from "@/hooks/useReviews";
import { useAddGame, useUserGameByAppId } from "@/hooks/useUserGames";

interface ReviewFormProps {
  appId: number;
  onClose?: () => void;
}

const ReviewForm = ({ appId, onClose }: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: existingReview } = useUserReviewForGame(appId);
  const { data: userGame } = useUserGameByAppId(appId);
  const addGame = useAddGame();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const [isPositive, setIsPositive] = useState(true);
  const [content, setContent] = useState("");
  const [hoursAtReview, setHoursAtReview] = useState("");

  useEffect(() => {
    if (existingReview) {
      setIsPositive(existingReview.is_positive);
      setContent(existingReview.content || "");
      setHoursAtReview(
        existingReview.hours_at_review !== null
          ? String(existingReview.hours_at_review)
          : ""
      );
    } else {
      setIsPositive(true);
      setContent("");
      setHoursAtReview("");
    }
  }, [existingReview, appId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Você precisa estar logado para escrever uma review", variant: "destructive" });
      return;
    }

    if (!content.trim()) {
      toast({ title: "Escreva sua review antes de salvar", variant: "destructive" });
      return;
    }

    const hoursValue = hoursAtReview.trim() ? Number(hoursAtReview) : undefined;
    if (hoursValue !== undefined && Number.isNaN(hoursValue)) {
      toast({ title: "Horas jogadas inválidas", variant: "destructive" });
      return;
    }

    try {
      if (!userGame) {
        try {
          await addGame.mutateAsync({ appId, status: "playing" });
        } catch (error) {
          // Ignore if already in library
        }
      }

      if (existingReview) {
        await updateReview.mutateAsync({
          id: existingReview.id,
          updates: {
            content: content.trim(),
            is_positive: isPositive,
            hours_at_review: hoursValue ?? 0,
          },
        });
        toast({ title: "Review atualizada!" });
      } else {
        await createReview.mutateAsync({
          appId,
          content: content.trim(),
          isPositive,
          hoursAtReview: hoursValue ?? 0,
        });
        toast({ title: "Review publicada!" });
      }

      onClose?.();
    } catch (error) {
      toast({ title: "Erro ao salvar review", variant: "destructive" });
    }
  };

  const isSaving = createReview.isPending || updateReview.isPending || addGame.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isPositive ? "default" : "outline"}
          onClick={() => setIsPositive(true)}
        >
          Recomendado
        </Button>
        <Button
          type="button"
          variant={!isPositive ? "default" : "outline"}
          onClick={() => setIsPositive(false)}
        >
          Não recomendado
        </Button>
      </div>

      <Textarea
        placeholder="Conte sua experiência com o jogo..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        maxLength={1000}
      />

      <div>
        <label className="text-sm text-muted-foreground">Horas jogadas (opcional)</label>
        <Input
          type="number"
          min="0"
          step="0.5"
          value={hoursAtReview}
          onChange={(e) => setHoursAtReview(e.target.value)}
          placeholder="Ex: 12"
        />
      </div>

      <div className="flex justify-end gap-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Review"}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
