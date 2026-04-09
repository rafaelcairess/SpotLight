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
import steamIcon from "@/assets/steam.png";

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

export function LoginForm({ onSwitchToSignup, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, signInWithSteam, signInWithXbox } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(t("auth.form.loginError"), { description: error.message });
    } else {
      toast.success(t("auth.form.loginSuccess"));
      navigate("/");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(t("auth.form.loginError"), { description: error.message });
  };

  const handleSteamLogin = async () => {
    const { error } = await signInWithSteam();
    if (error) toast.error(t("auth.form.loginError"), { description: error.message });
  };

  const handleXboxLogin = async () => {
    const { error } = await signInWithXbox();
    if (error) toast.error(t("auth.form.loginError"), { description: error.message });
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

      {/* Login com plataformas */}
      <div className="space-y-2">
        {/* Google */}
        <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleLogin}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t("auth.form.googleLogin", "Entrar com Google")}
        </Button>

        {/* Steam */}
        <Button type="button" variant="outline" className="w-full gap-2" onClick={handleSteamLogin}>
          <img src={steamIcon} alt="Steam" className="w-4 h-4" />
          {t("auth.form.steamLogin")}
        </Button>

        {/* Xbox */}
        <Button type="button" variant="outline" className="w-full gap-2" onClick={handleXboxLogin}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4.102 5.426C2.766 7.003 2 9.007 2 11.2c0 2.983 1.342 5.655 3.455 7.466C6.732 13.214 9.832 8.856 4.102 5.426zM12 2c-1.765 0-3.41.497-4.812 1.357 2.79 1.677 5.52 4.806 3.664 8.9C9.906 10.5 8.9 8.79 6.24 7.068 5.22 8.36 4.585 9.97 4.51 11.73c-.008.16-.01.322-.01.483 0 1.626.422 3.152 1.163 4.476.81-.68 1.583-1.67 2.034-2.9C7.92 13.49 7.92 16 11 17.5c.314.155.645.29.988.4-.01-.025-.018-.05-.027-.075C11.258 16.47 9.5 14.5 10 12c.523 2.523 2.58 4.45 4.013 5.825.325-.11.636-.245.934-.4C17.83 16 16.072 13.49 16.3 13.79c.452 1.23 1.225 2.22 2.034 2.9.74-1.324 1.162-2.85 1.162-4.476 0-.16-.002-.322-.01-.483-.076-1.76-.71-3.37-1.73-4.662C15.1 8.79 14.094 10.5 13.148 12.257 11.292 8.163 14.022 5.034 16.812 3.357A9.99 9.99 0 0 0 12 2zm7.898 3.426c-5.73 3.43-2.63 7.788-1.355 13.24C20.658 16.855 22 14.183 22 11.2c0-2.193-.766-4.197-2.102-5.774z"/>
          </svg>
          {t("auth.form.xboxLogin", "Entrar com Xbox")}
        </Button>
      </div>

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
        {t("auth.form.noAccount")}{" "}
        <button type="button" onClick={onSwitchToSignup} className="text-primary hover:underline font-medium">
          {t("auth.form.signupCta")}
        </button>
      </p>
    </form>
  );
}
