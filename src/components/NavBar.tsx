import { Link, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/providers/AppProvider";
import { Button } from "@/components/ui/button";
import { Crown, Download, LogIn, LogOut, MapPin, PhoneCall, Sun, Moon, Video } from "lucide-react";
import { PLANS } from "@/lib/plans";

export default function NavBar() {
  const { user, profile, signOut, geo, theme, toggleTheme } = useApp();
  const navigate = useNavigate();

  const planLabel = profile ? PLANS[profile.plan].label : "Guest";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-hero text-primary-foreground">
            <Video className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">StreamHub</span>
        </Link>

        <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {profile?.city || geo?.city || "—"}
            {(profile?.region_state || geo?.region) && `, ${profile?.region_state || geo?.region}`}
          </span>
        </div>

        <nav className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium transition hover:bg-accent"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          <Link to="/call"><Button variant="ghost" size="sm"><PhoneCall className="mr-1 h-4 w-4" />Call</Button></Link>
          <Link to="/profile"><Button variant="ghost" size="sm"><Download className="mr-1 h-4 w-4" />Downloads</Button></Link>
          <Link to="/premium">
            <Button size="sm" className="gradient-premium text-premium-foreground hover:opacity-90">
              <Crown className="mr-1 h-4 w-4" />
              {planLabel}
            </Button>
          </Link>
          {user ? (
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="mr-1 h-4 w-4" />Sign out
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm"><LogIn className="mr-1 h-4 w-4" />Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
