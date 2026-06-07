"use client";

import "./app-shell.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["Dashboard", "/dashboard", "▦"],
  ["Projects", "/projects", "🗂"],
];

export default function AppLayout({ children }) {
  const pathname = usePathname();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" />
          EstimAI
        </div>
        {NAV.map(([label, href, ic]) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={"nav-item" + (active ? " active" : "")}>
              <span aria-hidden>{ic}</span> {label}
            </Link>
          );
        })}
        <Link href="/" className="nav-item subtle">
          ← Back to site
        </Link>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
