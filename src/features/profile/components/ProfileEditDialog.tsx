/**
 * Componente da feature profile.
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { Loader2, Upload } from "lucide-react";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
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
  const [matureEnabled, setMatureEnabled] = useMaturePreference();

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
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
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
