/**
 * Componente da feature auth.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PasswordResetFormProps {
  onBackToLogin: () => void;
}

export function PasswordResetForm({ onBackToLogin }: PasswordResetFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("auth.form.passwordShort"), {
        description: t("auth.form.passwordShortHint"),
      });
      return;
    }
    if (password !== confirm) {
      toast.error(t("auth.form.passwordMismatch"));
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);

    if (error) {
      toast.error(t("auth.form.passwordUpdateError"), {
        description: error.message,
      });
    } else {
      toast.success(t("auth.form.passwordUpdateSuccess"));
      onBackToLogin();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">{t("auth.form.newPassword")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            placeholder={t("auth.form.passwordHint")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">{t("auth.form.confirmPassword")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            placeholder={t("auth.form.confirmPasswordPlaceholder")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
            required
            minLength={6}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" variant="glow" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("auth.form.passwordSaving")}
          </>
        ) : (
          t("auth.form.passwordUpdate")
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-primary hover:underline font-medium"
        >
          {t("auth.form.backToLogin")}
        </button>
      </p>
    </form>
  );
}
