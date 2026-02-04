import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Sparkles, Menu, X, User, LogOut } from "lucide-react";
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

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-primary transition-transform group-hover:scale-110" />
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
                {link.label}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <UserAvatar 
                        src={profile?.avatar_url} 
                        displayName={profile?.display_name}
                        username={profile?.username}
                        size="md"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center gap-2 p-2">
                      <UserAvatar 
                        src={profile?.avatar_url} 
                        displayName={profile?.display_name}
                        username={profile?.username}
                        size="sm"
                      />
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.display_name || 'Gamer'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          @{profile?.username}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {link.label}
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
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary"
                    >
                      <UserAvatar 
                        src={profile?.avatar_url} 
                        displayName={profile?.display_name}
                        username={profile?.username}
                        size="sm"
                      />
                      <span>{profile?.display_name || 'Meu Perfil'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
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
