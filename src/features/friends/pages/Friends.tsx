import { Link, Navigate } from "react-router-dom";
import { Check, Clock3, Users, X } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { PresenceBadge } from "@/features/profile/components/PresenceBadge";
import {
  useAcceptFriendRequest,
  useFriendRequests,
  useFriends,
  useRemoveFriendship,
  type Friendship,
} from "@/hooks/useFriendships";

export default function FriendsPage() {
  const { user, loading } = useAuth();
  const { data: requests, isLoading } = useFriendRequests();
  const { data: friends = [] } = useFriends(user?.id);
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriendship();
  if (!loading && !user) return <Navigate to="/auth" replace />;
  const requestCard = (
    request: Friendship & {
      profile: {
        user_id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        presence_status?: string | null;
        last_seen_at?: string | null;
      };
    },
    incoming: boolean,
  ) => (
    <div
      key={request.id}
      className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-card/70 p-4"
    >
      <Link to={`/u/${request.profile.username}`} className="flex min-w-0 items-center gap-3">
        <UserAvatar
          src={request.profile.avatar_url}
          displayName={request.profile.display_name}
          username={request.profile.username}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate font-medium">
            {request.profile.display_name || request.profile.username}
          </p>
          <p className="text-xs text-muted-foreground">@{request.profile.username}</p>
        </div>
      </Link>
      <div className="flex gap-2">
        {incoming && (
          <Button
            size="sm"
            className="gap-1"
            onClick={() =>
              accept.mutate({ otherUserId: request.profile.user_id, friendship: request })
            }
          >
            <Check className="h-4 w-4" />
            Aceitar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            remove.mutate({ otherUserId: request.profile.user_id, friendship: request })
          }
        >
          {incoming ? <X className="h-4 w-4" /> : "Cancelar"}
        </Button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-5xl px-4 pb-12 pt-24">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Amigos</h1>
            <p className="text-sm text-muted-foreground">
              Pedidos, convites enviados e sua lista de amigos.
            </p>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4" />
              Pedidos recebidos ({requests?.incoming.length || 0})
            </h2>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : requests?.incoming.length ? (
                requests.incoming.map((request) => requestCard(request, true))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Nenhum pedido pendente.
                </p>
              )}
            </div>
          </section>
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Clock3 className="h-4 w-4" />
              Enviados ({requests?.outgoing.length || 0})
            </h2>
            <div className="space-y-3">
              {requests?.outgoing.length ? (
                requests.outgoing.map((request) => requestCard(request, false))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Nenhum convite aguardando resposta.
                </p>
              )}
            </div>
          </section>
        </div>
        <section className="mt-10">
          <h2 className="mb-4 font-semibold">Todos os amigos ({friends.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <Link
                key={friend.user_id}
                to={`/u/${friend.username}`}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-border/40 bg-card/70 p-4 transition-colors hover:border-primary/40"
              >
                <div className="relative">
                  <UserAvatar
                    src={friend.avatar_url}
                    displayName={friend.display_name}
                    username={friend.username}
                    size="md"
                  />
                  <span className="absolute -bottom-1 -right-1">
                    <PresenceBadge
                      status={friend.presence_status}
                      lastSeenAt={friend.last_seen_at}
                      compact
                    />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{friend.display_name || friend.username}</p>
                  <PresenceBadge status={friend.presence_status} lastSeenAt={friend.last_seen_at} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
