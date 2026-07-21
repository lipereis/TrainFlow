"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/workouts/new", label: "Workouts" },
  { href: "/templates", label: "Templates" },
  { href: "/exercises", label: "Exercises" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/clients") {
    return pathname === "/clients" || pathname.startsWith("/clients/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TrainerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          TrainFlow
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3 text-sm">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-3 py-2 ${
                active
                  ? "bg-zinc-100 font-medium text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
