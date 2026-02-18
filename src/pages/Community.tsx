import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import SectionHeader from "@/components/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunityProfiles, useSearchProfiles } from "@/hooks/useProfile";
import { useFollowUser, useFollowingIds, useUnfollowUser } from "@/hooks/useFollows";

const Community = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const hasSearch = searchTerm.trim().length >= 2;
  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchProfiles(searchTerm.trim());
  const { data: communityProfiles = [], isLoading: communityLoading } =
    useCommunityProfiles(24);

  const profiles = hasSearch ? searchResults : communityProfiles;
  const filteredProfiles = profiles.filter((profile) => profile.user_id !== user?.id);

  const profileIds = useMemo(
    () => filteredProfiles.map((profile) => profile.user_id),
    [filteredProfiles]
  );

  const { data: followingIds = [] } = useFollowingIds(profileIds);
  const followingSet = useMemo(
    () => new Set(followingIds),
    [followingIds]
  );

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const isLoading = hasSearch ? searchLoading : communityLoading;

  const handleToggleFollow = (targetUserId: string, isFollowing: boolean) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (isFollowing) {
      unfollowUser.mutate(targetUserId);
    } else {
      followUser.mutate(targetUserId);
    }
  };

  const handleOpenProfile = (username: string) => {
    navigate(`/u/${username}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Comunidade"
            subtitle="Encontre jogadores e siga perfis interessantes"
            icon={Users}
          />

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Digite um username"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/60"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              A busca procura por username e nome de exibição.
            </p>
          </div>

          {searchTerm.trim().length > 0 && !hasSearch && (
            <div className="text-sm text-muted-foreground py-6">
              Digite pelo menos 2 caracteres para buscar.
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-20 rounded-xl border border-border/40 bg-card/60 animate-pulse"
                />
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {hasSearch ? "Nenhum usuário encontrado :(" : "Nenhum perfil encontrado ainda."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((profile) => {
                const isFollowing = followingSet.has(profile.user_id);
                const isSelf = profile.user_id === user?.id;

                return (
                  <div
                    key={profile.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenProfile(profile.username)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleOpenProfile(profile.username);
                      }
                    }}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur hover:border-primary/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        src={profile.avatar_url}
                        displayName={profile.display_name}
                        username={profile.username}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {profile.display_name || profile.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{profile.username}
                        </p>
                        {profile.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {profile.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isSelf ? (
                        <Button variant="secondary" size="sm" disabled>
                          Você
                        </Button>
                      ) : (
                        <Button
                          variant={isFollowing ? "secondary" : "glow"}
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleFollow(profile.user_id, isFollowing);
                          }}
                          disabled={followUser.isPending || unfollowUser.isPending}
                        >
                          {isFollowing ? "Seguindo" : "Seguir"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;
