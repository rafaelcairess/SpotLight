/**
 * Componente da feature games — adicionar jogo a uma lista personalizada.
 */

import { useState } from "react";
import { List, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUserLists, useUserListGames, useAddGameToList, useRemoveGameFromList } from "@/hooks/useUserLists";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AddToListButtonProps {
  appId: number;
}

function ListItem({ listId, listName, appId }: { listId: string; listName: string; appId: number }) {
  const { data: listGames = [] } = useUserListGames(listId);
  const addGame = useAddGameToList();
  const removeGame = useRemoveGameFromList();
  const { toast } = useToast();

  const isInList = listGames.some((g) => g.app_id === appId);
  const isBusy = addGame.isPending || removeGame.isPending;

  const handleToggle = async () => {
    try {
      if (isInList) {
        await removeGame.mutateAsync({ listId, appId });
      } else {
        await addGame.mutateAsync({ listId, appId });
        toast({ title: `Adicionado a "${listName}"` });
      }
    } catch {
      toast({ title: "Erro ao atualizar lista", variant: "destructive" });
    }
  };

  return (
    <button
      type="button"
      disabled={isBusy}
      onClick={handleToggle}
      className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-secondary/50 transition-colors"
    >
      <span className="truncate">{listName}</span>
      {isInList && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
    </button>
  );
}

export function AddToListButton({ appId }: AddToListButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: lists = [] } = useUserLists();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <List className="w-4 h-4" />
          Adicionar a lista
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        {lists.length === 0 ? (
          <div className="text-center py-3 space-y-2">
            <p className="text-xs text-muted-foreground">Você não tem listas ainda.</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Criar lista
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Suas listas
            </p>
            {lists.map((list) => (
              <ListItem key={list.id} listId={list.id} listName={list.name} appId={appId} />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
