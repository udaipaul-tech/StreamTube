import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useApp } from "@/providers/AppProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Menu, Mic, Bell, Video as VideoIcon, Crown, LogIn, LogOut,
  Home, Flame, Music2, Gamepad2, Newspaper, Trophy, GraduationCap, Shirt,
  Download, History, ListVideo, ThumbsUp, PhoneCall, MapPin, Sun, Moon,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useState, type ReactNode } from "react";

const SIDEBAR_PRIMARY = [
  { label: "Home",          icon: Home,     to: "/" as const },
  { label: "Shorts",        icon: Flame,    to: "/category/shorts" as const },
  { label: "Subscriptions", icon: ListVideo, to: "/" as const },
];

const SIDEBAR_LIBRARY = [
  { label: "History",      icon: History,   to: "/profile" as const },
  { label: "Your videos",  icon: VideoIcon, to: "/profile" as const },
  { label: "Downloads",    icon: Download,  to: "/profile" as const },
  { label: "Liked videos", icon: ThumbsUp,  to: "/profile" as const },
];

const SIDEBAR_EXPLORE = [
  { label: "Music",    icon: Music2,        to: "/category/music" as const },
  { label: "Gaming",   icon: Gamepad2,      to: "/category/gaming" as const },
  { label: "News",     icon: Newspaper,     to: "/category/news" as const },
  { label: "Sports",   icon: Trophy,        to: "/category/sports" as const },
  { label: "Learning", icon: GraduationCap, to: "/category/learning" as const },
  { label: "Fashion",  icon: Shirt,         to: "/category/fashion" as const },
];

type ValidRoute = "/" | "/profile" | "/premium" | "/call" | "/auth"
  | "/category/shorts" | "/category/music" | "/category/gaming"
  | "/category/news" | "/category/sports" | "/category/learning" | "/category/fashion";

interface Props {
  children: ReactNode;
  miniSidebar?: boolean;
}

export default function YTLayout({ children, miniSidebar = false }: Props) {
  const { user, profile, signOut, geo, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [query, setQuery] = useState("");
  const [openMobile, setOpenMobile] = useState(false);

  const planLabel = profile ? PLANS[profile.plan].label : "Guest";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", search: { q: query } as never });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setOpenMobile((v) => !v)}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center gap-1.5 pr-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-destructive">
            <VideoIcon className="h-4 w-4 text-destructive-foreground" />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            Stream<span className="text-destructive">Tube</span>
          </span>
        </Link>

        <form onSubmit={onSearch} className="ml-2 flex flex-1 items-center justify-center gap-2">
          <div className="flex w-full max-w-xl items-center">
            <div className="flex flex-1 items-center rounded-l-full border border-border bg-input/40 pl-4 focus-within:border-primary">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="border-0 bg-transparent px-1 focus-visible:ring-0"
              />
            </div>
            <button
              type="submit"
              className="grid h-10 w-14 place-items-center rounded-r-full border border-l-0 border-border bg-muted hover:bg-muted/70"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <Button type="button" variant="ghost" size="icon" className="hidden shrink-0 rounded-full sm:inline-flex" aria-label="Voice search">
            <Mic className="h-5 w-5" />
          </Button>
        </form>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Link to="/call" className="hidden sm:block">
            <Button variant="ghost" size="icon" aria-label="Start call">
              <PhoneCall className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="hidden sm:inline-flex">
            <Bell className="h-5 w-5" />
          </Button>
          <Link to="/premium">
            <Button size="sm" className="gradient-premium text-premium-foreground hover:opacity-90">
              <Crown className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">{planLabel}</span>
            </Button>
          </Link>
          {user ? (
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              aria-label="Sign out"
              title={profile?.display_name || user.email || "Account"}
            >
              {(profile?.display_name || user.email || "U").charAt(0).toUpperCase()}
            </button>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="outline">
                <LogIn className="mr-1 h-4 w-4" />Sign in
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        {!miniSidebar && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border py-3 lg:block">
            <SidebarContent currentPath={path} />
            <RegionFooter geo={geo} theme={theme} toggleTheme={toggleTheme} city={profile?.city} region={profile?.region_state} />
          </aside>
        )}
        {miniSidebar && (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-20 shrink-0 flex-col items-center gap-3 border-r border-border py-3 md:flex">
            {SIDEBAR_PRIMARY.map((it) => (
              <Link key={it.label} to={it.to} className="flex w-full flex-col items-center gap-1 py-2 text-[10px] hover:bg-muted">
                <it.icon className="h-5 w-5" />
                {it.label}
              </Link>
            ))}
          </aside>
        )}

        {/* Mobile sidebar drawer */}
        {openMobile && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpenMobile(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto bg-background py-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <SidebarContent currentPath={path} onNavigate={() => setOpenMobile(false)} />
              <RegionFooter geo={geo} theme={theme} toggleTheme={toggleTheme} city={profile?.city} region={profile?.region_state} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ currentPath, onNavigate }: { currentPath: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 px-2 text-sm">
      {SIDEBAR_PRIMARY.map((it) => (
        <SidebarLink key={it.label} icon={<it.icon className="h-5 w-5" />} label={it.label} to={it.to} active={currentPath === it.to} onClick={onNavigate} />
      ))}
      <Divider />
      <SectionTitle>You</SectionTitle>
      {SIDEBAR_LIBRARY.map((it) => (
        <SidebarLink key={it.label} icon={<it.icon className="h-5 w-5" />} label={it.label} to={it.to} active={currentPath === it.to} onClick={onNavigate} />
      ))}
      <Divider />
      <SectionTitle>Explore</SectionTitle>
      {SIDEBAR_EXPLORE.map((it) => (
        <SidebarLink key={it.label} icon={<it.icon className="h-5 w-5" />} label={it.label} to={it.to} active={currentPath === it.to} onClick={onNavigate} />
      ))}
    </nav>
  );
}

function SidebarLink({
  icon, label, to, active, onClick,
}: { icon: ReactNode; label: string; to: ValidRoute; active?: boolean; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-4 rounded-lg px-3 py-2 transition ${active ? "bg-muted font-medium" : "hover:bg-muted"}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function Divider() {
  return <hr className="my-2 border-border" />;
}

function RegionFooter({
  geo, theme, toggleTheme, city, region,
}: {
  geo: { city: string; region: string } | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  city?: string;
  region?: string;
}) {
  return (
    <div className="mt-4 border-t border-border px-4 pt-3 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3 w-3" />
        {city || geo?.city || "—"}
        {(region || geo?.region) && `, ${region || geo?.region}`}
      </div>
      <button
        onClick={toggleTheme}
        className="mt-2 flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-muted transition w-full text-left"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
        <span>Theme: <strong>{theme}</strong> (click to toggle)</span>
      </button>
      <p className="mt-3 text-[10px]">© StreamTube · Built on Lovable</p>
    </div>
  );
}
