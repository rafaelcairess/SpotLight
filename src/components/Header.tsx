import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Flame,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/useProfile";
import { useFriendRequests } from "@/hooks/useFriendships";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { getDateLocale } from "@/i18n/utils";
import { cn } from "@/lib/utils";
import logoSpotlight from "@/assets/logospotlight.png";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: notifications = [], isLoading: notificationsLoading } = useNotifications();
  const { data: friendRequests } = useFriendRequests();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const dateLocale = getDateLocale(locale);

  const primaryLinks = [
    { href: "/", label: t("header.nav.explore") },
    { href: "/collections", label: t("header.nav.collections") },
    { href: "/comunidade", label: t("header.nav.community") },
  ];
  const rankingLinks = [
    { href: "/top", label: t("header.nav.topGames"), icon: Trophy },
    { href: "/mais-jogados", label: t("header.nav.mostPlayed"), icon: Flame },
  ];
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;
  const rankingIsActive = rankingLinks.some((link) => location.pathname === link.href);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery("");
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handleNotificationClick = (id: string, link?: string | null) => {
    markRead.mutate(id);
    if (link) navigate(link);
  };

  const notificationMenu = (
    <DropdownMenuContent
      align="end"
      className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-white/[0.09] bg-popover/95 p-2 shadow-2xl backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between gap-3 px-2 py-2">
        <span className="font-logo text-sm font-bold">{t("header.notifications")}</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || unreadCount === 0}
        >
          {t("header.markAll")}
        </Button>
      </div>
      <DropdownMenuSeparator />
      {notificationsLoading ? (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          {t("header.notificationsLoading")}
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          {t("header.notificationsEmpty")}
        </div>
      ) : (
        notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            onClick={() => handleNotificationClick(notification.id, notification.link)}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-1 rounded-xl px-3 py-3 whitespace-normal focus:bg-primary/10 focus:text-foreground",
              !notification.read_at && "bg-primary/[0.06]",
            )}
          >
            <span className="text-sm font-medium">{notification.message}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </DropdownMenuItem>
        ))
      )}
    </DropdownMenuContent>
  );

  const navLinkClass = (active: boolean) =>
    cn(
      "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]"
        : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
    );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-background/78 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/68">
      <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3 lg:h-[4.5rem]">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="SpotLight">
            <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-primary/25 bg-primary/10 shadow-[0_0_28px_hsl(var(--primary)/0.14)]">
              <img
                src={logoSpotlight}
                alt=""
                className="h-[5.5rem] w-[5.5rem] max-w-none object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <span className="hidden font-logo text-lg font-bold tracking-[-0.04em] sm:block">
              Spot<span className="text-primary">Light</span>
            </span>
          </Link>

          <nav
            className="ml-2 hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 lg:flex"
            aria-label={t("header.mainNavigation")}
          >
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={navLinkClass(location.pathname === link.href)}
              >
                {link.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(navLinkClass(rankingIsActive), "gap-1.5")}>
                  {t("header.nav.rankings")}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-xl border-white/[0.09] bg-popover/95 p-2 backdrop-blur-xl">
                {rankingLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.href}
                    asChild
                    className="cursor-pointer rounded-lg p-0"
                  >
                    <Link to={link.href} className="flex w-full items-center gap-3 px-3 py-2.5">
                      <link.icon className="h-4 w-4 text-primary" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/promocoes"
              className={cn(
                navLinkClass(location.pathname === "/promocoes"),
                "gap-2 text-emerald-300 hover:text-emerald-200",
              )}
            >
              <Sparkles className="h-4 w-4" />
              {t("header.nav.promotions")}
            </Link>
          </nav>

          <form
            onSubmit={handleSearch}
            className="ml-auto hidden min-w-0 flex-1 lg:block lg:max-w-xs 2xl:max-w-sm"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("header.searchPlaceholder")}
                className="bg-white/[0.04] pl-10"
              />
            </div>
          </form>

          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            <LanguageSwitcher />
            {!authLoading && user ? (
              <>
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/friends" aria-label={t("header.friends")}>
                    <Users />
                    {!!friendRequests?.incoming.length && (
                      <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                        {friendRequests.incoming.length > 9 ? "9+" : friendRequests.incoming.length}
                      </span>
                    )}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                      aria-label={t("header.notifications")}
                    >
                      <Bell />
                      {unreadCount > 0 && (
                        <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  {notificationMenu}
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 rounded-full p-0.5 ring-offset-background transition hover:ring-2 hover:ring-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      <UserAvatar
                        src={profile?.avatar_url}
                        displayName={profile?.display_name}
                        username={profile?.username}
                        size="md"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-xl border-white/[0.09] bg-popover/95 p-2 backdrop-blur-xl"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">
                        {profile?.display_name || t("header.myProfile")}
                      </p>
                      {profile?.username && (
                        <p className="truncate text-xs text-muted-foreground">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link to="/profile" className="flex gap-2">
                        <UserRound />
                        {t("header.myProfile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link to="/feedback" className="flex gap-2">
                        <MessageSquare />
                        {t("header.feedback")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer gap-2 rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <LogOut />
                      {t("header.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : !authLoading ? (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/feedback" aria-label={t("header.feedback")}>
                    <MessageSquare />
                  </Link>
                </Button>
                <Button variant="glow" size="sm" asChild>
                  <Link to="/auth">{t("header.signIn")}</Link>
                </Button>
              </>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/[0.07] py-4 lg:hidden">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("header.searchPlaceholder")}
                  className="pl-10"
                />
              </div>
            </form>

            <nav className="grid gap-1" aria-label={t("header.mainNavigation")}>
              {[...primaryLinks, { href: "/promocoes", label: t("header.nav.promotions") }].map(
                (link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(navLinkClass(location.pathname === link.href), "px-4")}
                  >
                    {link.label}
                  </Link>
                ),
              )}
              <p className="eyebrow mb-1 mt-4 px-4">{t("header.nav.rankings")}</p>
              {rankingLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(navLinkClass(location.pathname === link.href), "gap-3 px-4")}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 grid gap-1 border-t border-white/[0.07] pt-4">
              <div className="flex min-h-11 items-center justify-between px-4">
                <span className="text-sm text-muted-foreground">{t("common.language")}</span>
                <LanguageSwitcher />
              </div>
              <Link
                to="/feedback"
                className="flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                {t("header.feedback")}
              </Link>
              {!authLoading && user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-left text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground">
                        <Bell className="h-4 w-4" />
                        {t("header.notifications")}
                        {unreadCount > 0 && (
                          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    {notificationMenu}
                  </DropdownMenu>
                  <Link
                    to="/friends"
                    className="flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  >
                    <Users className="h-4 w-4" />
                    {t("header.friends")}
                    {!!friendRequests?.incoming.length && (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {friendRequests.incoming.length}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/profile"
                    className="flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium hover:bg-white/[0.05]"
                  >
                    <UserAvatar
                      src={profile?.avatar_url}
                      displayName={profile?.display_name}
                      username={profile?.username}
                      size="sm"
                    />
                    <span>{profile?.display_name || t("header.myProfile")}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-4 text-left text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("header.signOut")}
                  </button>
                </>
              ) : !authLoading ? (
                <Button variant="glow" className="mt-2" asChild>
                  <Link to="/auth">{t("header.signIn")}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
