import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  ProfileEditContent,
  type ProfileEditSection,
} from "@/features/profile/components/ProfileEditContent";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const sections: Array<{ id: ProfileEditSection; label: string }> = [
  { id: "general", label: "Geral" },
  { id: "avatar", label: "Avatar" },
  { id: "connections", label: "Contas conectadas" },
  { id: "privacy", label: "Privacidade" },
  { id: "preferences", label: "Preferências" },
  { id: "account", label: "Conta" },
];

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<ProfileEditSection>("general");
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

  if (authLoading || isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="grid min-h-screen place-items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

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
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    section === item.id
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="profile-edit-content px-1 py-2 sm:px-6 sm:py-4">
            <ProfileEditContent
              section={section}
              displayName={displayName}
              username={username}
              bio={bio}
              avatarUrl={avatarUrl}
              steamId={steamId}
              profileVisibility={profileVisibility}
              libraryVisibility={libraryVisibility}
              reviewsVisibility={reviewsVisibility}
              commentsPermission={commentsPermission}
              matureEnabled={matureEnabled}
              uploading={uploading}
              saving={updateProfile.isPending}
              deleting={deleteAccount.isPending}
              deleteText={deleteText}
              fileInput={fileInput}
              onDisplayNameChange={setDisplayName}
              onUsernameChange={setUsername}
              onBioChange={setBio}
              onSteamIdChange={setSteamId}
              onProfileVisibilityChange={setProfileVisibility}
              onLibraryVisibilityChange={setLibraryVisibility}
              onReviewsVisibilityChange={setReviewsVisibility}
              onCommentsPermissionChange={setCommentsPermission}
              onMatureEnabledChange={setMatureEnabled}
              onDeleteTextChange={setDeleteText}
              onSaveGeneral={saveGeneral}
              onUploadAvatar={uploadAvatar}
              onSaveSteam={() => void save({ steam_id: steamId.trim() || null })}
              onSavePrivacy={() =>
                void save({
                  profile_visibility: profileVisibility,
                  library_visibility: libraryVisibility,
                  reviews_visibility: reviewsVisibility,
                  comments_permission: commentsPermission,
                })
              }
              onDeleteAccount={async () => {
                await deleteAccount.mutateAsync(undefined);
                await signOut();
                navigate("/", { replace: true });
              }}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
