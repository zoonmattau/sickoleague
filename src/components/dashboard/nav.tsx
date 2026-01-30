"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type NavItem = { href: string; label: string };

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "My Team",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/roster", label: "Roster" },
      { href: "/dashboard/matches", label: "Matches" },
      { href: "/dashboard/board", label: "Board" },
    ],
  },
  {
    label: "League",
    items: [
      { href: "/dashboard/standings", label: "Standings" },
      { href: "/dashboard/stats", label: "Stats" },
      { href: "/dashboard/clubs", label: "Clubs" },
      { href: "/dashboard/players", label: "Players" },
    ],
  },
  {
    label: "Transactions",
    items: [
      { href: "/dashboard/free-agents", label: "Free Agents" },
      { href: "/dashboard/staff", label: "Staff" },
      { href: "/dashboard/trades", label: "Trades" },
      { href: "/dashboard/draft", label: "Draft" },
    ],
  },
  {
    label: "Info",
    items: [
      { href: "/dashboard/rules", label: "Rules" },
      { href: "/dashboard/history", label: "History" },
    ],
  },
];

interface DashboardNavProps {
  user: User;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-xl">
              Sicko League
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navSections.map((section) => {
                const isActive = section.items.some(item => pathname === item.href);
                return (
                  <DropdownMenu key={section.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className="gap-1"
                      >
                        {section.label}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {section.items.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={pathname === item.href ? "bg-accent" : ""}
                          >
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name || "User"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.user_metadata?.full_name && (
                    <p className="font-medium">{user.user_metadata.full_name}</p>
                  )}
                  {user.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
