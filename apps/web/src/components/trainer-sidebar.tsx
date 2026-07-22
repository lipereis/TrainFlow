"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const links = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/clients", labelKey: "clients" },
  { href: "/workouts/new", labelKey: "workouts" },
  { href: "/templates", labelKey: "templates" },
  { href: "/exercises", labelKey: "exercises" },
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
  const t = useTranslations("nav");

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          {t("brand")}
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
                  ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {t(link.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
