import { useState } from "react";
import { 
  Plus, 
  Check, 
  Heart, 
  Trophy, 
  ChevronDown,
  Loader2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useUserGameByAppId, 
  useAddGame, 
  useUpdateGame, 
  useRemoveGame,
  UserGame 
} from "@/hooks/useUserGames";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface GameLibraryActionsProps {
  appId: number;
  onWriteReview?: () => void;
}

const statusOptions = [
  { value: 'wishlist', label: 'Lista de Desejos', icon: '📋' },
  { value: 'playing', label: 'Jogando', icon: '🎮' },
  { value: 'completed', label: 'Completado', icon: '✅' },
  { value: 'dropped', label: 'Abandonado', icon: '❌' },
] as const;

export function GameLibraryActions({ appId, onWriteReview }: GameLibraryActionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: userGame, isLoading } = useUserGameByAppId(appId);
  const addGame = useAddGame();
  const updateGame = useUpdateGame();
  const removeGame = useRemoveGame();

  const handleAddToLibrary = async (status: UserGame['status'] = 'wishlist') => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      await addGame.mutateAsync({ appId, status });
      toast({ title: "Jogo adicionado à biblioteca! 🎮" });
    } catch (error) {
      toast({ title: "Erro ao adicionar jogo", variant: "destructive" });
    }
  };

  const handleChangeStatus = async (status: UserGame['status']) => {
    if (!userGame) return;

    try {
      await updateGame.mutateAsync({
        id: userGame.id,
        updates: { status }
      });
      toast({ title: `Status alterado!` });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleToggleFavorite = async () => {
    if (!userGame) return;

    try {
      await updateGame.mutateAsync({
        id: userGame.id,
        updates: { is_favorite: !userGame.is_favorite }
      });
      toast({ 
        title: userGame.is_favorite ? "Removido dos favoritos" : "Adicionado aos favoritos! ❤️" 
      });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleTogglePlatinum = async () => {
    if (!userGame) return;

    try {
      await updateGame.mutateAsync({
        id: userGame.id,
        updates: { is_platinumed: !userGame.is_platinumed }
      });
      toast({ 
        title: userGame.is_platinumed ? "Platina removida" : "Platina conquistada! 🏆" 
      });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleRemove = async () => {
    if (!userGame) return;

    try {
      await removeGame.mutateAsync(userGame.id);
      toast({ title: "Jogo removido da biblioteca" });
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const isLoaderShown = isLoading || addGame.isPending || updateGame.isPending;

  // Not in library
  if (!userGame) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="glow" 
              className="gap-2"
              disabled={isLoaderShown}
            >
              {isLoaderShown ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Adicionar à Biblioteca
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((option) => (
              <DropdownMenuItem 
                key={option.value}
                onClick={() => handleAddToLibrary(option.value)}
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {onWriteReview && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={onWriteReview}
            disabled={isLoaderShown}
          >
            <BookOpen className="w-4 h-4" />
            Escrever Review
          </Button>
        )}
      </div>
    );
  }

  // In library - show management options
  const currentStatus = statusOptions.find(s => s.value === userGame.status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            {currentStatus?.icon} {currentStatus?.label}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {statusOptions.map((option) => (
            <DropdownMenuItem 
              key={option.value}
              onClick={() => handleChangeStatus(option.value)}
              className={cn(userGame.status === option.value && "bg-secondary")}
            >
              <span className="mr-2">{option.icon}</span>
              {option.label}
              {userGame.status === option.value && (
                <Check className="w-4 h-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleRemove}
            className="text-destructive"
          >
            Remover da Biblioteca
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Favorite Button */}
      <Button
        variant={userGame.is_favorite ? "default" : "outline"}
        size="icon"
        onClick={handleToggleFavorite}
        disabled={updateGame.isPending}
        className={cn(
          userGame.is_favorite && "bg-rose-500 hover:bg-rose-600 border-rose-500"
        )}
      >
        <Heart className={cn("w-4 h-4", userGame.is_favorite && "fill-current")} />
      </Button>

      {/* Platinum Button */}
      <Button
        variant={userGame.is_platinumed ? "default" : "outline"}
        size="icon"
        onClick={handleTogglePlatinum}
        disabled={updateGame.isPending}
        className={cn(
          userGame.is_platinumed && "bg-amber-500 hover:bg-amber-600 border-amber-500"
        )}
      >
        <Trophy className="w-4 h-4" />
      </Button>

      {/* Write Review Button */}
      {onWriteReview && (
        <Button variant="outline" className="gap-2" onClick={onWriteReview}>
          <BookOpen className="w-4 h-4" />
          Escrever Review
        </Button>
      )}
    </div>
  );
}
