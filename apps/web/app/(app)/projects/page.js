"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useProjects,
  createProject,
  deleteProject,
  computeTotals,
  money,
  DISCIPLINES,
} from "@/lib/store";

export default function ProjectsPage() {
  const { projects, loaded } = useProjects();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="page-head">
        <h1>Projects</h1>
        <button className="b primary" onClick={() => setOpen(true)}>
          + New project
        </button>
      </div>

      {!loaded ? null : projects.length === 0 ? (
        <div className="panel">
          <div className="empty">
            <div style={{ fontSize: 16, color: "var(--text)", marginBottom: 6 }}>
              No projects yet
            </div>
            Create a project, then upload a drawing set to generate a takeoff.
            <div style={{ marginTop: 16 }}>
              <button className="b primary" onClick={() => setOpen(true)}>
                + Create project
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="proj-grid">
          {projects.map((p) => {
            const t = computeTotals(p);
            return (
              <div key={p.id} className="proj-card">
                <Link href={`/projects/${p.id}`}>
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
                <div className="row" style={{ marginTop: 14 }}>
                  <Link href={`/projects/${p.id}`} className="b sm">
                    Open
                  </Link>
                  <div className="spacer" />
                  <button
                    className="b sm danger"
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"?`)) deleteProject(p.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && <NewProjectModal onClose={() => setOpen(false)} />}
    </>
  );
}

function NewProjectModal({ onClose }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [region, setRegion] = useState("US-CA");
  const [disc, setDisc] = useState(["architectural", "structural"]);

  const toggle = (d) =>
    setDisc((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const p = createProject({ name: name.trim(), client, region, disciplines: disc });
    onClose();
    router.push(`/projects/${p.id}`);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>New project</h2>
        <div className="field">
          <label>Project name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Riverside Office Fit-out"
          />
        </div>
        <div className="field">
          <label>Client</label>
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Riverside Dev Co" />
        </div>
        <div className="field">
          <label>Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option>US-CA</option>
            <option>US-NY</option>
            <option>US-TX</option>
            <option>UK</option>
            <option>UAE</option>
          </select>
        </div>
        <div className="field">
          <label>Disciplines</label>
          <div className="chips">
            {DISCIPLINES.map((d) => (
              <button
                type="button"
                key={d}
                className={"chip-toggle" + (disc.includes(d) ? " on" : "")}
                onClick={() => toggle(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="b" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="b primary">
            Create project
          </button>
        </div>
      </form>
    </div>
  );
}
