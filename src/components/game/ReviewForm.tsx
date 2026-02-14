import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateReview,
  useDeleteReview,
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
  const deleteReview = useDeleteReview();

  const [isPositive, setIsPositive] = useState(true);
  const [content, setContent] = useState("");
  const [score, setScore] = useState<number | "">(4);
  const [hoursAtReview, setHoursAtReview] = useState<number | "">("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const COOLDOWN_MS = 60_000;
  const cooldownKey = user?.id ? `spotlight.review.cooldown.${user.id}` : "";

  useEffect(() => {
    if (existingReview) {
      const initialScore =
        typeof existingReview.score === "number"
          ? Math.max(0, Math.min(5, Math.round(existingReview.score)))
          : existingReview.is_positive
          ? 4
          : 2;
      setScore(initialScore);
      setIsPositive(initialScore >= 3);
      setContent(existingReview.content || "");
      setHoursAtReview(
        existingReview.hours_at_review !== null
          ? Math.trunc(existingReview.hours_at_review)
          : ""
      );
    } else {
      setIsPositive(true);
      setScore(4);
      setContent("");
      setHoursAtReview("");
    }
  }, [existingReview, appId]);

  useEffect(() => {
    if (!cooldownKey) {
      setCooldownRemaining(0);
      return;
    }

    const updateCooldown = () => {
      const last = Number(localStorage.getItem(cooldownKey) || 0);
      const remaining = Math.max(0, COOLDOWN_MS - (Date.now() - last));
      setCooldownRemaining(remaining);
    };

    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    return () => clearInterval(timer);
  }, [cooldownKey]);

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

    const hoursValue = hoursAtReview === "" ? undefined : Number(hoursAtReview);
    if (hoursValue !== undefined && (!Number.isFinite(hoursValue) || !Number.isInteger(hoursValue))) {
      toast({ title: "Horas jogadas inválidas", variant: "destructive" });
      return;
    }

    const scoreValue = score === "" ? NaN : Number(score);
    if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 5) {
      toast({ title: "A nota precisa estar entre 0 e 5", variant: "destructive" });
      return;
    }
    const normalizedScore = Math.round(scoreValue);
    setIsPositive(normalizedScore >= 3);

    if (cooldownRemaining > 0) {
      const seconds = Math.ceil(cooldownRemaining / 1000);
      toast({ title: `Aguarde ${seconds}s para enviar outra review`, variant: "destructive" });
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
            is_positive: normalizedScore >= 3,
            score: normalizedScore,
            hours_at_review: hoursValue ?? 0,
          },
        });
        toast({ title: "Review atualizada!" });
      } else {
        await createReview.mutateAsync({
          appId,
          content: content.trim(),
          score: normalizedScore,
          hoursAtReview: hoursValue ?? 0,
        });
        toast({ title: "Review publicada!" });
      }

      onClose?.();
      if (cooldownKey) {
        localStorage.setItem(cooldownKey, Date.now().toString());
        setCooldownRemaining(COOLDOWN_MS);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("RATE_LIMIT:60")) {
        toast({ title: "Aguarde 60s para enviar outra review", variant: "destructive" });
        return;
      }
      if (message.includes("DAILY_LIMIT:20")) {
        toast({ title: "Você atingiu o limite diário de 20 reviews", variant: "destructive" });
        return;
      }
      toast({ title: "Erro ao salvar review", variant: "destructive" });
    }
  };

  const isSaving =
    createReview.isPending ||
    updateReview.isPending ||
    addGame.isPending ||
    deleteReview.isPending;
  const isCooldownActive = cooldownRemaining > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isPositive ? "default" : "outline"}
          onClick={() => {
            setIsPositive(true);
            if (score === "" || score < 3) setScore(4);
          }}
        >
          Recomendado
        </Button>
        <Button
          type="button"
          variant={!isPositive ? "default" : "outline"}
          onClick={() => {
            setIsPositive(false);
            if (score === "" || score >= 3) setScore(2);
          }}
        >
          Não recomendado
        </Button>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Nota (0 a 5)</label>
        <Input
          type="number"
          min="0"
          max="5"
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={score}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setScore("");
              return;
            }
            const parsed = Number.parseInt(raw, 10);
            if (Number.isNaN(parsed)) {
              setScore("");
              return;
            }
            const bounded = Math.max(0, Math.min(5, parsed));
            setScore(bounded);
            setIsPositive(bounded >= 3);
          }}
          placeholder="Ex: 4"
          required
        />
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
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={hoursAtReview}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setHoursAtReview("");
              return;
            }
            const parsed = Number.parseInt(raw, 10);
            if (Number.isNaN(parsed)) {
              setHoursAtReview("");
              return;
            }
            setHoursAtReview(parsed);
          }}
          placeholder="Ex: 12"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Limite: 1 review por minuto e 20 por dia.
      </p>

      <div className="flex justify-end gap-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        )}
        {existingReview && (
          <Button
            type="button"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={isSaving}
            onClick={async () => {
              const confirmed = window.confirm("Tem certeza que deseja apagar sua review?");
              if (!confirmed) return;
              try {
                await deleteReview.mutateAsync(existingReview.id);
                toast({ title: "Review apagada!" });
                onClose?.();
              } catch (error) {
                toast({ title: "Erro ao apagar review", variant: "destructive" });
              }
            }}
          >
            Apagar Review
          </Button>
        )}
        <Button type="submit" disabled={isSaving || isCooldownActive}>
          {isSaving
            ? "Salvando..."
            : isCooldownActive
            ? `Aguarde ${Math.ceil(cooldownRemaining / 1000)}s`
            : "Salvar Review"}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
