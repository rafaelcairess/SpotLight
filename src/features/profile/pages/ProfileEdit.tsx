import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Section = "general" | "avatar" | "connections" | "privacy" | "preferences" | "account";
const sections: Array<{ id: Section; label: string }> = [
  { id: "general", label: "Geral" },
  { id: "avatar", label: "Avatar" },
  { id: "connections", label: "Contas conectadas" },
  { id: "privacy", label: "Privacidade" },
  { id: "preferences", label: "Preferências" },
  { id: "account", label: "Conta" },
];

const visibilityOptions = [
  { value: "public", label: "Público" },
  { value: "friends", label: "Somente amigos" },
  { value: "private", label: "Privado" },
];

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<Section>("general");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [steamId, setSteamId] = useState("");
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [libraryVisibility, setLibraryVisibility] = useState("public");
  const [reviewsVisibility, setReviewsVisibility] = useState("public");
  const [commentsPermission, setCommentsPermission] = useState<"public" | "friends" | "disabled">(
    "public",
  );
  const [matureEnabled, setMatureEnabled] = useMaturePreference();
  const [uploading, setUploading] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name || "");
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    setAvatarUrl(profile.avatar_url || "");
    setSteamId(profile.steam_id || "");
    setProfileVisibility(profile.profile_visibility || "public");
    setLibraryVisibility(profile.library_visibility || "public");
    setReviewsVisibility(profile.reviews_visibility || "public");
    setCommentsPermission(profile.comments_permission || "public");
  }, [profile]);

  const save = async (
    updates: Parameters<typeof updateProfile.mutateAsync>[0],
    message = "Alterações salvas.",
  ) => {
    try {
      await updateProfile.mutateAsync(updates);
      toast({ title: message });
    } catch (error) {
      toast({
        title: "Não foi possível salvar.",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const saveGeneral = (event: FormEvent) => {
    event.preventDefault();
    if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
      toast({
        title: "Use ao menos 3 caracteres: letras minúsculas, números ou _.",
        variant: "destructive",
      });
      return;
    }
    void save({ display_name: displayName || null, username, bio: bio || null });
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      toast({ title: "Use uma imagem de até 2 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const extension = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar.${extension}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      setAvatarUrl(url);
      await save({ avatar_url: url }, "Avatar atualizado.");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || isLoading || !profile)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="grid min-h-screen place-items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-border/40 bg-card/70 p-4">
          <UserAvatar
            src={avatarUrl}
            displayName={displayName}
            username={username}
            size="lg"
            shape="square"
          />
          <div>
            <p className="text-xl font-semibold">{displayName || username}</p>
            <p className="text-sm text-muted-foreground">Editar perfil</p>
          </div>
        </div>
        <div className="profile-edit-layout">
          <aside className="profile-edit-sidebar">
            <Button
              variant="ghost"
              className="mb-3 w-full justify-start gap-2"
              onClick={() => navigate("/profile")}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao perfil
            </Button>
            <nav className="space-y-1">
              {sections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${section === item.id ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
          <section className="profile-edit-content px-1 py-2 sm:px-6 sm:py-4">
            {section === "general" && (
              <form onSubmit={saveGeneral} className="max-w-2xl space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold">Geral</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nome, endereço do perfil e apresentação.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Nome de exibição</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    spotlight.app/u/{username || "seu_username"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  Salvar alterações
                </Button>
              </form>
            )}
            {section === "avatar" && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold">Avatar</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A imagem exibida no seu perfil e na comunidade.
                  </p>
                </div>
                <UserAvatar
                  src={avatarUrl}
                  displayName={displayName}
                  username={username}
                  size="xl"
                  shape="square"
                  className="h-40 w-40"
                />
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                />
                <Button
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Alterar avatar"}
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG ou WebP. Máximo de 2 MB.</p>
              </div>
            )}
            {section === "connections" && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold">Contas conectadas</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Identificadores usados para importar sua atividade.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Perfil ou Steam ID</Label>
                  <Input
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value)}
                    placeholder="https://steamcommunity.com/id/..."
                  />
                </div>
                <Button onClick={() => void save({ steam_id: steamId.trim() || null })}>
                  Salvar Steam
                </Button>
                <div className="border-t border-border/40 pt-5 text-sm text-muted-foreground">
                  Xbox e PlayStation serão configurados aqui quando as integrações estiverem
                  disponíveis.
                </div>
              </div>
            )}
            {section === "privacy" && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold">Privacidade</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Escolha quem pode acessar cada parte do perfil.
                  </p>
                </div>
                {[
                  ["Perfil", profileVisibility, setProfileVisibility],
                  ["Biblioteca", libraryVisibility, setLibraryVisibility],
                  ["Avaliações", reviewsVisibility, setReviewsVisibility],
                ].map(([label, value, setter]) => (
                  <div
                    key={label as string}
                    className="grid gap-2 sm:grid-cols-[1fr_14rem] sm:items-center"
                  >
                    <Label>{label as string}</Label>
                    <select
                      value={value as string}
                      onChange={(e) => (setter as (value: string) => void)(e.target.value)}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      {visibilityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="grid gap-2 sm:grid-cols-[1fr_14rem] sm:items-center">
                  <Label>Comentários</Label>
                  <select
                    value={commentsPermission}
                    onChange={(e) =>
                      setCommentsPermission(e.target.value as typeof commentsPermission)
                    }
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="public">Todos conectados</option>
                    <option value="friends">Somente amigos</option>
                    <option value="disabled">Desativados</option>
                  </select>
                </div>
                <Button
                  onClick={() =>
                    void save({
                      profile_visibility: profileVisibility,
                      library_visibility: libraryVisibility,
                      reviews_visibility: reviewsVisibility,
                      comments_permission: commentsPermission,
                    })
                  }
                >
                  Salvar privacidade
                </Button>
              </div>
            )}
            {section === "preferences" && (
              <div className="max-w-2xl space-y-7">
                <div>
                  <h1 className="text-2xl font-semibold">Preferências</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Idioma e conteúdo exibido no SpotLight.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Idioma</Label>
                    <p className="text-xs text-muted-foreground">
                      Idioma da interface e dos jogos.
                    </p>
                  </div>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-5">
                  <div>
                    <Label>Conteúdo adulto</Label>
                    <p className="text-xs text-muted-foreground">
                      Mostrar jogos classificados como conteúdo adulto.
                    </p>
                  </div>
                  <Switch checked={matureEnabled} onCheckedChange={setMatureEnabled} />
                </div>
              </div>
            )}
            {section === "account" && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold">Conta</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ações permanentes relacionadas à sua conta.
                  </p>
                </div>
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5">
                  <h2 className="font-medium text-destructive">Excluir conta</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta ação remove permanentemente seu perfil e seus dados.
                  </p>
                  <Input
                    className="mt-4"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="Digite EXCLUIR"
                  />
                  <Button
                    variant="destructive"
                    className="mt-3"
                    disabled={deleteText !== "EXCLUIR" || deleteAccount.isPending}
                    onClick={async () => {
                      await deleteAccount.mutateAsync(undefined);
                      await signOut();
                      navigate("/", { replace: true });
                    }}
                  >
                    Excluir minha conta
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
