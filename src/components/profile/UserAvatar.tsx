import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  displayName?: string | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function UserAvatar({ 
  src, 
  displayName, 
  username, 
  size = 'md', 
  className 
}: UserAvatarProps) {
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : username
    ? username.slice(0, 2).toUpperCase()
    : null;

  return (
    <Avatar className={cn(
      sizeClasses[size],
      'ring-2 ring-primary/20',
      className
    )}>
      <AvatarImage src={src || undefined} alt={displayName || username || 'Avatar'} />
      <AvatarFallback className="bg-secondary text-muted-foreground">
        {initials || <User className={iconSizes[size]} />}
      </AvatarFallback>
    </Avatar>
  );
}
