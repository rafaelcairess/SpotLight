/**
 * Componente da feature profile.
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { Loader2, Upload, RefreshCw, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateProfile, Profile } from "@/hooks/useProfile";
import { UserAvatar } from "./UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { useNavigate } from "react-router-dom";
import steamIcon from "@/assets/steam.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Switch } from "@/components/ui/switch";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { normalizeText } from "@/lib/text";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null | undefined;
}

const normalizeVisibility = (value?: string) => {
  if (!value || value === "friends") return "public";
  return value;
};

const BANNED_WORDS = [
  "caralho",
  "porra",
  "puta",
  "foda",
  "merda",
  "bosta",
  "cu",
  "pinto",
  "buceta",
  "viad",
  "puta",
  "idiota",
  "burro",
  "fuck",
  "shit",
  "bitch",
  "asshole",
];

const containsBannedWords = (value: string) => {
  const normalized = normalizeText(value);
  return BANNED_WORDS.some((word) => normalized.includes(word));
};

export function ProfileEditDialog({ open, onOpenChange, profile }: ProfileEditDialogProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [steamId, setSteamId] = useState(profile?.steam_id || "");
  const [profileVisibility, setProfileVisibility] = useState(normalizeVisibility(profile?.profile_visibility));
  const [reviewsVisibility, setReviewsVisibility] = useState(normalizeVisibility(profile?.reviews_visibility));
  const [libraryVisibility, setLibraryVisibility] = useState(normalizeVisibility(profile?.library_visibility));
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncingSteam, setIsSyncingSteam] = useState(false);
  const [matureEnabled, setMatureEnabled] = useMaturePreference();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const visibilityOptions = useMemo(
    () => [
      {
        value: "public",
        label: t("profileEdit.publicLabel"),
        description: t("profileEdit.publicDesc"),
      },
      {
        value: "private",
        label: t("profileEdit.privateLabel"),
        description: t("profileEdit.privateDesc"),
      },
    ],
    [t]
  );

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setSteamId(profile.steam_id || "");
      setProfileVisibility(normalizeVisibility(profile.profile_visibility));
      setReviewsVisibility(normalizeVisibility(profile.reviews_visibility));
      setLibraryVisibility(normalizeVisibility(profile.library_visibility));
    }
  }, [profile]);

  const handleSteamResync = async () => {
    if (!user?.id) return;
    setIsSyncingSteam(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-steam-playtime`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (res.ok) {
        toast({ title: "Biblioteca Steam atualizada!" });
      } else {
        toast({ title: "Erro ao sincronizar Steam", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao sincronizar Steam", variant: "destructive" });
    } finally {
      setIsSyncingSteam(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: t("profileEdit.imageInvalid"), variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("profileEdit.imageTooLarge"), variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast({ title: t("profileEdit.photoUpdated") });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: t("profileEdit.uploadError"), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length < 3) {
      toast({ title: t("profileEdit.usernameTooShort"), variant: "destructive" });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({ title: t("profileEdit.usernameInvalid"), variant: "destructive" });
      return;
    }

    const valuesToCheck = [displayName, username, bio].filter(Boolean);
    if (valuesToCheck.some((value) => containsBannedWords(value))) {
      toast({ title: t("profileEdit.profileBanned"), variant: "destructive" });
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username,
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
        steam_id: steamId.trim() ? steamId.trim() : null,
        profile_visibility: profileVisibility,
        reviews_visibility: reviewsVisibility,
        library_visibility: libraryVisibility,
      });
      toast({ title: t("profileEdit.saveSuccess") });
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        toast({ title: t("profileEdit.usernameTaken"), variant: "destructive" });
      } else {
        toast({ title: t("profileEdit.saveError"), variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profileEdit.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload de avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <UserAvatar
                src={avatarUrl}
                displayName={displayName}
                username={username}
                size="xl"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {t("profileEdit.changePhoto")}
            </Button>
          </div>

          {/* Nome de exibicao */}
          <div className="space-y-2">
            <Label htmlFor="displayName">{t("profileEdit.displayName")}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("profileEdit.displayNamePlaceholder")}
              maxLength={50}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">{t("profileEdit.username")}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="seu_username"
                className="pl-8"
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("profileEdit.usernameHint")}</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">{t("profileEdit.bio")}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profileEdit.bioPlaceholder")}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
          </div>

          {/* Steam ID */}
          <div className="space-y-2">
            <Label htmlFor="steamId">{t("profileEdit.steamIdLabel")}</Label>
            <Input
              id="steamId"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder={t("profileEdit.steamIdPlaceholder")}
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">{t("profileEdit.steamIdHint")}</p>
          </div>

          {/* Plataformas conectadas */}
          <div className="space-y-3 rounded-lg border border-border/50 p-4">
            <div>
              <h3 className="text-sm font-semibold">Plataformas Conectadas</h3>
              <p className="text-xs text-muted-foreground">
                Gerencie suas contas vinculadas e sincronize sua biblioteca.
              </p>
            </div>

            {/* Steam */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <img src={steamIcon} alt="Steam" className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Steam</p>
                  {profile?.steam_id ? (
                    <p className="text-xs text-muted-foreground">
                      {profile.steam_library_private
                        ? "Biblioteca privada"
                        : profile.steam_last_synced
                        ? `Sync: ${new Date(profile.steam_last_synced).toLocaleDateString("pt-BR")}`
                        : "Nunca sincronizado"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não conectado</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {profile?.steam_id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSteamResync}
                      disabled={isSyncingSteam}
                      title="Atualizar biblioteca Steam"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncingSteam ? "animate-spin" : ""}`} />
                    </Button>
                  </>
                ) : (
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Xbox */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.102 5.426C2.766 7.003 2 9.007 2 11.2c0 2.983 1.342 5.655 3.455 7.466C6.732 13.214 9.832 8.856 4.102 5.426zM12 2c-1.765 0-3.41.497-4.812 1.357 2.79 1.677 5.52 4.806 3.664 8.9C9.906 10.5 8.9 8.79 6.24 7.068 5.22 8.36 4.585 9.97 4.51 11.73c-.008.16-.01.322-.01.483 0 1.626.422 3.152 1.163 4.476.81-.68 1.583-1.67 2.034-2.9C7.92 13.49 7.92 16 11 17.5c.314.155.645.29.988.4-.01-.025-.018-.05-.027-.075C11.258 16.47 9.5 14.5 10 12c.523 2.523 2.58 4.45 4.013 5.825.325-.11.636-.245.934-.4C17.83 16 16.072 13.49 16.3 13.79c.452 1.23 1.225 2.22 2.034 2.9.74-1.324 1.162-2.85 1.162-4.476 0-.16-.002-.322-.01-.483-.076-1.76-.71-3.37-1.73-4.662C15.1 8.79 14.094 10.5 13.148 12.257 11.292 8.163 14.022 5.034 16.812 3.357A9.99 9.99 0 0 0 12 2zm7.898 3.426c-5.73 3.43-2.63 7.788-1.355 13.24C20.658 16.855 22 14.183 22 11.2c0-2.193-.766-4.197-2.102-5.774z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium">Xbox</p>
                  {profile?.xbox_id ? (
                    <p className="text-xs text-muted-foreground">
                      {profile.xbox_gamertag || profile.xbox_id}
                      {profile.xbox_last_synced &&
                        ` · ${new Date(profile.xbox_last_synced).toLocaleDateString("pt-BR")}`}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não conectado</p>
                  )}
                </div>
              </div>
              {profile?.xbox_id ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            {/* PSN */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8.984 2.596v14.47l3.915 1.243V6.688c0-.67.144-1.15.736-1.15.592 0 .736.48.736 1.15v3.017l3.915 1.243V6.12c0-2.27-1.296-3.58-3.915-3.58-2.62 0-5.387 1.96-5.387 5.387zM18.29 14.92c-1.44.403-2.65.1-3.47-.41l.71-1.42c.79.47 1.82.72 2.76.51.5-.11.78-.43.72-.88-.06-.44-.5-.68-1.62-1.06-1.82-.62-3.04-1.46-2.8-3.22.21-1.56 1.67-2.58 3.71-2.58.81 0 1.67.17 2.44.52l-.68 1.47c-.67-.3-1.38-.48-2.07-.48-.56 0-.86.22-.9.6-.04.38.3.6 1.3.92 2 .68 3.08 1.52 2.84 3.35-.24 1.78-1.78 2.7-3.97 2.65zM5.71 20.68v-5.07l-1.23-.41v-1.5l6.27 2.1v1.5l-1.23-.41v5.07L5.71 20.68z"/>
                </svg>
                <div>
                  <p className="text-sm font-medium">PlayStation</p>
                  {profile?.psn_id ? (
                    <p className="text-xs text-muted-foreground">
                      {profile.psn_online_id || profile.psn_id}
                      {profile.psn_last_synced &&
                        ` · ${new Date(profile.psn_last_synced).toLocaleDateString("pt-BR")}`}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não conectado</p>
                  )}
                </div>
              </div>
              {profile?.psn_id ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Idioma */}
          <div className="space-y-2">
            <Label>{t("profileEdit.languageLabel")}</Label>
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">{t("common.language")}</span>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Conteudo adulto */}
          <div className="space-y-2">
            <Label>{t("profileEdit.matureTitle")}</Label>
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {t("profileEdit.matureDescription")}
              </span>
              <Switch checked={matureEnabled} onCheckedChange={setMatureEnabled} />
            </div>
          </div>

          {/* Privacidade */}
          <div className="space-y-4 rounded-lg border border-border/50 p-4">
            <div>
              <h3 className="text-sm font-semibold">{t("profileEdit.privacyTitle")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("profileEdit.privacySubtitle")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("profileEdit.profileLabel")}</Label>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {visibilityOptions.find((o) => o.value === profileVisibility)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("profileEdit.libraryLabel")}</Label>
              <select
                value={libraryVisibility}
                onChange={(e) => setLibraryVisibility(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {visibilityOptions.find((o) => o.value === libraryVisibility)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("profileEdit.reviewsLabel")}</Label>
              <select
                value={reviewsVisibility}
                onChange={(e) => setReviewsVisibility(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {visibilityOptions.find((o) => o.value === reviewsVisibility)?.description}
              </p>
            </div>
          </div>

          {/* Zona de perigo */}
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-destructive">{t("profileEdit.dangerZoneTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("profileEdit.dangerZoneDescription")}</p>
            </div>
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                {t("profileEdit.deleteAccount")}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t("profileEdit.deleteConfirmHint", { word: "EXCLUIR" })}
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full rounded-md border border-destructive/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-destructive"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }}
                  >
                    {t("common.actions.cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={deleteConfirm !== "EXCLUIR" || deleteAccount.isPending}
                    onClick={async () => {
                      try {
                        await deleteAccount.mutateAsync(undefined);
                        await signOut();
                        navigate("/");
                      } catch {
                        toast({ title: t("profileEdit.deleteError"), variant: "destructive" });
                      }
                    }}
                  >
                    {deleteAccount.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t("profileEdit.deleteConfirmButton")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Acoes */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("common.actions.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
