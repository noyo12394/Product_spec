"use client";

import Link from "next/link";
import { useProjects, computeTotals, money } from "@/lib/store";

export default function DashboardPage() {
  const { projects, loaded } = useProjects();

  const totalValue = projects.reduce((s, p) => s + computeTotals(p).total, 0);
  const drawings = projects.reduce((s, p) => s + (p.drawings?.length || 0), 0);
  const items = projects.reduce((s, p) => s + (p.takeoff?.length || 0), 0);

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <Link href="/projects" className="b primary">
          + New / view projects
        </Link>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="n">{loaded ? projects.length : "—"}</div>
          <div className="l">Active projects</div>
        </div>
        <div className="metric">
          <div className="n">{loaded ? drawings : "—"}</div>
          <div className="l">Drawings uploaded</div>
        </div>
        <div className="metric">
          <div className="n">{loaded ? items : "—"}</div>
          <div className="l">Takeoff items</div>
        </div>
        <div className="metric">
          <div className="n">{loaded ? money(totalValue) : "—"}</div>
          <div className="l">Pipeline value</div>
        </div>
      </div>

      <div className="panel">
        <div className="row" style={{ marginBottom: 14 }}>
          <strong>Recent projects</strong>
          <div className="spacer" />
          <Link href="/projects" className="b sm">
            View all
          </Link>
        </div>

        {!loaded ? null : projects.length === 0 ? (
          <div className="empty">
            No projects yet. <Link href="/projects" style={{ color: "#93b4fd" }}>Create your first project →</Link>
          </div>
        ) : (
          <div className="proj-grid">
            {projects.slice(0, 6).map((p) => {
              const t = computeTotals(p);
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="proj-card">
                  <h3>{p.name}</h3>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {p.client || "No client"} · {p.region}
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {money(t.total)}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {p.drawings?.length || 0} drawings · {p.takeoff?.length || 0} items
                  </div>
                  <div className="tags">
                    {p.disciplines.map((d) => (
                      <span key={d} className="tag">{d}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
