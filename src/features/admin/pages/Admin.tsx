import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Shield, Search, Trash2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useSearchProfiles } from "@/hooks/useProfile";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { data: results = [], isLoading: searching } = useSearchProfiles(searchTerm.trim());
  const deleteAccount = useDeleteAccount();
  const { toast } = useToast();

  if (!user || profileLoading) return null;

  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const handleDelete = async (targetUserId: string, username: string) => {
    if (confirmingId !== targetUserId) {
      setConfirmingId(targetUserId);
      return;
    }
    try {
      await deleteAccount.mutateAsync(targetUserId);
      toast({ title: `Conta @${username} excluída.` });
      setConfirmingId(null);
    } catch {
      toast({ title: "Erro ao excluir conta.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 container mx-auto px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Gerenciamento de contas de usuários</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar usuário por nome ou @username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Digite ao menos 2 caracteres para buscar.</p>
        </div>

        {searchTerm.trim().length >= 2 && (
          searching ? (
            <div className="text-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhum usuário encontrado.</div>
          ) : (
            <div className="space-y-3">
              {results.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/40 bg-card/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      src={u.avatar_url}
                      displayName={u.display_name}
                      username={u.username}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.display_name || u.username}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                      {u.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{u.bio}</p>}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {u.user_id === user.id ? (
                      <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-secondary">Você</span>
                    ) : confirmingId === u.user_id ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmingId(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteAccount.isPending}
                          onClick={() => handleDelete(u.user_id, u.username)}
                        >
                          {deleteAccount.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Confirmar exclusão"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(u.user_id, u.username)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
