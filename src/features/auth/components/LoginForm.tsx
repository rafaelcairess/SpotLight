/**
 * Componente da feature auth.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

export function LoginForm({ onSwitchToSignup, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(t("auth.form.loginError"), {
        description: error.message,
      });
    } else {
      toast.success(t("auth.form.loginSuccess"));
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.form.email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder={t("auth.form.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.form.password")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder={t("auth.form.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
            required
            minLength={6}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-primary hover:underline"
          >
            {t("auth.form.forgotPassword")}
          </button>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full" disabled>
        {t("auth.form.googleDisabled")}
      </Button>
      <p className="text-xs text-muted-foreground text-center">{t("auth.form.googleSoon")}</p>

      <Button type="submit" className="w-full" variant="glow" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("auth.form.loginLoading")}
          </>
        ) : (
          t("auth.form.loginButton")
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.form.noAccount")} {" "}
        <button type="button" onClick={onSwitchToSignup} className="text-primary hover:underline font-medium">
          {t("auth.form.signupCta")}
        </button>
      </p>
    </form>
  );
}
