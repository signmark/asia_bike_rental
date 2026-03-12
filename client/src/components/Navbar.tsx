import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLang, langFlags, langLabels, type Lang } from "@/lib/language";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bike, LayoutDashboard, LogOut, Shield, Star, Menu, X, Globe } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() ?? "?";

  const langs: Lang[] = ["en", "ru", "vi"];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" data-testid="link-home">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Bike className="w-4.5 h-4.5 text-primary-foreground" size={18} />
              </div>
              <span className="font-bold text-lg tracking-tight">
                RentMyBike
                <span className="text-primary">.vn</span>
              </span>
            </a>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <a className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`} data-testid="nav-marketplace">
                {t.nav.marketplace}
              </a>
            </Link>
            {user && (
              <Link href="/dashboard">
                <a className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.startsWith("/dashboard") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`} data-testid="nav-dashboard">
                  {t.nav.dashboard}
                </a>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin">
                <a className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.startsWith("/admin") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`} data-testid="nav-admin">
                  {t.nav.admin}
                </a>
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" data-testid="button-lang">
                  <Globe size={14} />
                  <span>{langLabels[lang]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {langs.map(l => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => setLang(l)}
                    className={`gap-2 ${lang === l ? "bg-accent font-medium" : ""}`}
                    data-testid={`lang-${l}`}
                  >
                    <span>{langFlags[l]}</span>
                    <span>{langLabels[l]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                <Link href="/add-vehicle">
                  <Button size="sm" className="hidden sm:flex" data-testid="button-add-vehicle">
                    {t.nav.listVehicle}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-accent transition-colors" data-testid="button-user-menu">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {user.subscriptionStatus === "business" && (
                        <Badge variant="secondary" className="hidden sm:flex text-xs px-1.5 py-0 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                          <Star size={10} className="mr-0.5" /> Pro
                        </Badge>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2">
                      <p className="font-semibold text-sm">{user.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard">
                      <DropdownMenuItem data-testid="menu-dashboard">
                        <LayoutDashboard size={14} className="mr-2" /> {t.nav.dashboard}
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/add-vehicle">
                      <DropdownMenuItem data-testid="menu-add-vehicle">
                        <Bike size={14} className="mr-2" /> {t.nav.listVehicleMenu}
                      </DropdownMenuItem>
                    </Link>
                    {user.subscriptionStatus !== "business" && (
                      <Link href="/upgrade">
                        <DropdownMenuItem className="text-amber-600 dark:text-amber-400" data-testid="menu-upgrade">
                          <Star size={14} className="mr-2" /> {t.nav.upgrade}
                        </DropdownMenuItem>
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link href="/admin">
                        <DropdownMenuItem data-testid="menu-admin">
                          <Shield size={14} className="mr-2" /> {t.nav.adminPanel}
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="menu-logout">
                      <LogOut size={14} className="mr-2" /> {t.nav.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login">{t.nav.login}</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="button-register">{t.nav.signUp}</Button>
                </Link>
              </div>
            )}
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <a className="block px-4 py-2.5 text-sm rounded-md hover:bg-accent">{t.nav.marketplace}</a>
            </Link>
            {user && (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <a className="block px-4 py-2.5 text-sm rounded-md hover:bg-accent">{t.nav.dashboard}</a>
              </Link>
            )}
            {user && (
              <Link href="/add-vehicle" onClick={() => setMobileOpen(false)}>
                <a className="block px-4 py-2.5 text-sm rounded-md hover:bg-accent">{t.nav.listVehicle}</a>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <a className="block px-4 py-2.5 text-sm rounded-md hover:bg-accent">{t.nav.adminPanel}</a>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
