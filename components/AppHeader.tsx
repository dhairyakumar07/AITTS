"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, LayoutDashboard, LogOut, Menu, Moon, ShieldCheck, Sun, UserRound, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function AppHeader() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(x => setUser(x.user || null)).catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  if (pathname.startsWith("/tests/") && pathname !== "/tests") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/";
  }

  const links = user
    ? user.role === "ADMIN"
      ? [{ href: "/admin", label: "Control center", icon: ShieldCheck }, { href: "/admin/tests/new", label: "Create test", icon: BookOpen }]
      : [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/tests", label: "Tests", icon: BookOpen }, { href: "/results", label: "Results", icon: BarChart3 }, { href: "/profile", label: "Profile", icon: UserRound }]
    : [];

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">A</span>
          <span><b>AITTS</b><small>All India Test Series</small></span>
        </Link>

        <nav className="desktop-nav">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={pathname === href ? "nav-link active" : "nav-link"}>
              <Icon size={16} />{label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          {user && <Link className="user-chip hide-mobile" href="/profile"><span className="avatar">{user.name?.slice(0,1)?.toUpperCase() || "S"}</span><span>{user.name?.split(" ")[0] || "Student"}</span></Link>}
          <button className="theme-btn" onClick={toggle} title="Toggle theme">{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button>
          {user ? <button className="icon-btn hide-mobile" onClick={logout} title="Log out"><LogOut size={17}/></button> : <Link className="btn btn-primary header-cta" href="/login">Sign in</Link>}
          <button className="mobile-menu" onClick={() => setOpen(v => !v)} aria-label="Menu">{open ? <X/> : <Menu/>}</button>
        </div>
      </div>

      {open && <div className="mobile-nav">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href}><Icon size={18}/>{label}</Link>)}
        {user && <button onClick={logout}><LogOut size={18}/>Log out</button>}
      </div>}
    </header>
  );
}
