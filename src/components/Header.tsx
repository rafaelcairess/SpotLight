import { Search, Orbit, Menu, X, LogOut, DollarSign, Users, Bell } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { UserAvatar } from "@/components/profile/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: notifications = [], isLoading: notificationsLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { href: "/", label: "Explorar" },
    { href: "/collections", label: "Coleções" },
    { href: "/promocoes", label: "Promoções", icon: DollarSign },
    { href: "/comunidade", label: "Comunidade", icon: Users },
  ];

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  const handleNotificationClick = (id: string, link?: string | null) => {
    markRead.mutate(id);
    if (link) {
      navigate(link);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Orbit className="w-7 h-7 md:w-8 md:h-8 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 blur-lg bg-primary/30 group-hover:bg-primary/50 transition-colors" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gradient-primary">
              SpotLight
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar jogos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/60"
              />
            </div>
          </form>

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground px-1">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm font-semibold">Notificações</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => markAllRead.mutate()}
                          disabled={markAllRead.isPending || unreadCount === 0}
                        >
                          Marcar tudo
                        </Button>
                      </div>
                      <DropdownMenuSeparator />
                      {notificationsLoading ? (
                        <div className="px-3 py-6 text-sm text-muted-foreground">
                          Carregando...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-3 py-6 text-sm text-muted-foreground">
                          Sem notificações por enquanto.
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id, notification.link)}
                            className={cn(
                              "flex flex-col items-start gap-1 whitespace-normal",
                              !notification.read_at && "bg-primary/5"
                            )}
                          >
                            <span className="text-sm font-medium">
                              {notification.message}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Link
                    to="/profile"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <UserAvatar
                      src={profile?.avatar_url}
                      displayName={profile?.display_name}
                      username={profile?.username}
                      size="md"
                    />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/90 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              ) : (
                <Button variant="glow" size="sm" asChild>
                  <Link to="/auth">Entrar</Link>
                </Button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/30 animate-fade-in">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar jogos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
            </form>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-3 rounded-lg text-base font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Mobile Auth */}
            <div className="mt-4 pt-4 border-t border-border/30">
              {!authLoading && (
                user ? (
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:bg-secondary"
                    >
                      <UserAvatar
                        src={profile?.avatar_url}
                        displayName={profile?.display_name}
                        username={profile?.username}
                        size="sm"
                      />
                      <span>{profile?.display_name || "Meu Perfil"}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-3 w-full rounded-lg text-base font-medium text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button variant="glow" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;