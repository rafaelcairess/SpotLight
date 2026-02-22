import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, displayName);

    if (error) {
      toast.error(t("auth.form.signupError"), {
        description: error.message,
      });
    } else {
      toast.success(t("auth.form.signupSuccess"), {
        description: t("auth.form.signupConfirm"),
      });
      onSwitchToLogin();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("auth.form.displayName")}</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="displayName"
            type="text"
            placeholder={t("auth.form.displayNamePlaceholder")}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
      </div>

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
            placeholder={t("auth.form.passwordHint")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {t("auth.form.signupLoading")}
          </>
        ) : (
          t("auth.form.signupButton")
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.form.haveAccount")} {" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary hover:underline font-medium"
        >
          {t("auth.form.loginCta")}
        </button>
      </p>
    </form>
  );
}
