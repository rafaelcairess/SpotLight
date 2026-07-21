/**
 * Componente da feature profile — aba de listas personalizadas.
 */

import { useState } from "react";
import { Plus, Trash2, Globe, Lock, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUserLists,
  useCreateUserList,
  useDeleteUserList,
  useUserListGames,
  UserList,
} from "@/hooks/useUserLists";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useGamesByIds } from "@/hooks/useGames";

function ListGamesPreview({ listId }: { listId: string }) {
  const { data: listGames = [] } = useUserListGames(listId);
  const appIds = listGames.slice(0, 3).map((g) => g.app_id);
  const { data: games = [] } = useGamesByIds(appIds);

  if (listGames.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum jogo ainda</p>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {games.slice(0, 3).map((g) => (
        <img
          key={g.app_id}
          src={g.image}
          alt={g.title}
          className="w-8 h-8 rounded object-cover border border-border/50"
        />
      ))}
      {listGames.length > 3 && (
        <span className="text-xs text-muted-foreground">+{listGames.length - 3}</span>
      )}
    </div>
  );
}

export function UserListsTab() {
  const { data: lists = [], isLoading } = useUserLists();
  const createList = useCreateUserList();
  const deleteList = useDeleteUserList();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createList.mutateAsync({ name: newName.trim(), description: newDesc.trim() || undefined, is_public: isPublic });
      toast({ title: "Lista criada!" });
      setIsCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setIsPublic(false);
    } catch {
      toast({ title: "Erro ao criar lista", variant: "destructive" });
    }
  };

  const handleDelete = async (list: UserList) => {
    if (!window.confirm(`Excluir a lista "${list.name}"?`)) return;
    try {
      await deleteList.mutateAsync(list.id);
      toast({ title: "Lista excluída" });
    } catch {
      toast({ title: "Erro ao excluir lista", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Minhas Listas</h3>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          Nova lista
        </Button>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
          <List className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Crie listas temáticas para organizar seus jogos.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Criar primeira lista
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 hover:bg-secondary/20 transition-colors cursor-pointer"
              onClick={() => navigate(`/lists/${list.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{list.name}</p>
                  {list.is_public ? (
                    <Globe className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
                {list.description && (
                  <p className="text-xs text-muted-foreground truncate">{list.description}</p>
                )}
                <div className="mt-2">
                  <ListGamesPreview listId={list.id} />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(list);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Pra jogar nas férias"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Descreva o tema da lista..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                maxLength={200}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Lista pública</p>
                <p className="text-xs text-muted-foreground">Qualquer pessoa pode ver</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || createList.isPending}>
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
