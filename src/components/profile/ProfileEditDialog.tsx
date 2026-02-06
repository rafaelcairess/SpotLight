import { useEffect, useRef, useState } from "react";
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

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null | undefined;
}

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Público",
    description: "Qualquer pessoa pode ver.",
  },
  {
    value: "friends",
    label: "Só amigos",
    description: "Somente amigos podem ver.",
  },
  {
    value: "private",
    label: "Privado",
    description: "Apenas você pode ver.",
  },
];

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

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const containsBannedWords = (value: string) => {
  const normalized = normalize(value);
  return BANNED_WORDS.some((word) => normalized.includes(word));
};

export function ProfileEditDialog({ open, onOpenChange, profile }: ProfileEditDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [profileVisibility, setProfileVisibility] = useState(profile?.profile_visibility || "public");
  const [reviewsVisibility, setReviewsVisibility] = useState(profile?.reviews_visibility || "public");
  const [libraryVisibility, setLibraryVisibility] = useState(profile?.library_visibility || "public");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setProfileVisibility(profile.profile_visibility || "public");
      setReviewsVisibility(profile.reviews_visibility || "public");
      setLibraryVisibility(profile.library_visibility || "public");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Por favor, selecione uma imagem", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "A imagem deve ter no máximo 2MB", variant: "destructive" });
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
      toast({ title: "Foto atualizada!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Erro ao fazer upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length < 3) {
      toast({ title: "O username deve ter pelo menos 3 caracteres", variant: "destructive" });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({ title: "O username deve conter apenas letras, números e _", variant: "destructive" });
      return;
    }

    const valuesToCheck = [displayName, username, bio].filter(Boolean);
    if (valuesToCheck.some((value) => containsBannedWords(value))) {
      toast({ title: "Remova palavras inapropriadas do perfil", variant: "destructive" });
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username,
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
        profile_visibility: profileVisibility,
        reviews_visibility: reviewsVisibility,
        library_visibility: libraryVisibility,
      });
      toast({ title: "Perfil atualizado com sucesso!" });
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast({ title: "Este username já está em uso", variant: "destructive" });
      } else {
        toast({ title: "Erro ao salvar perfil", variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurações do Perfil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
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
              Alterar Foto
            </Button>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como você quer ser chamado"
              maxLength={50}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
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
            <p className="text-xs text-muted-foreground">
              Apenas letras minúsculas, números e _
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/200
            </p>
          </div>

          {/* Privacy */}
          <div className="space-y-4 rounded-lg border border-border/50 p-4">
            <div>
              <h3 className="text-sm font-semibold">Privacidade</h3>
              <p className="text-xs text-muted-foreground">
                Controle quem pode ver seu perfil, biblioteca e reviews.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {VISIBILITY_OPTIONS.find((o) => o.value === profileVisibility)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Biblioteca</Label>
              <select
                value={libraryVisibility}
                onChange={(e) => setLibraryVisibility(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {VISIBILITY_OPTIONS.find((o) => o.value === libraryVisibility)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reviews</Label>
              <select
                value={reviewsVisibility}
                onChange={(e) => setReviewsVisibility(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {VISIBILITY_OPTIONS.find((o) => o.value === reviewsVisibility)?.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}