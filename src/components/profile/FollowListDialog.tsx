import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/profile/UserAvatar";

export interface ProfileSummary {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  profiles: ProfileSummary[];
  isLoading?: boolean;
  emptyMessage: string;
}

export function FollowListDialog({
  open,
  onOpenChange,
  title,
  profiles,
  isLoading,
  emptyMessage,
}: FollowListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-sm text-muted-foreground">Carregando...</div>
        ) : profiles.length === 0 ? (
          <div className="py-6 text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-1">
            {profiles.map((profile) => (
              <Link
                key={profile.user_id}
                to={`/u/${profile.username}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50"
              >
                <UserAvatar
                  src={profile.avatar_url}
                  displayName={profile.display_name}
                  username={profile.username}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile.display_name || profile.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{profile.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
