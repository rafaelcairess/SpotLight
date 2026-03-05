import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  displayName?: string | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  imageFit?: 'cover' | 'contain';
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
  shape = 'circle',
  imageFit = 'cover',
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
      shape === 'square' ? 'rounded-lg' : 'rounded-full',
      className
    )}>
      <AvatarImage
        src={src || undefined}
        alt={displayName || username || 'Avatar'}
        className={cn(
          imageFit === 'contain' ? 'object-contain bg-secondary/40' : 'object-cover'
        )}
      />
      <AvatarFallback
        className={cn(
          "bg-secondary text-muted-foreground",
          shape === "square" ? "rounded-lg" : "rounded-full"
        )}
      >
        {initials || <User className={iconSizes[size]} />}
      </AvatarFallback>
    </Avatar>
  );
}
