"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useProjects,
  updateProject,
  generateTakeoff,
  computeTotals,
  confidenceBand,
  money,
  round,
} from "@/lib/store";

const TABS = ["Drawings", "Takeoff", "Estimate", "Export"];

export default function ProjectPage() {
  const { id } = useParams();
  const { projects, loaded } = useProjects();
  const [tab, setTab] = useState("Drawings");

  const project = projects.find((p) => p.id === id);

  if (!loaded) return null;
  if (!project)
    return (
      <div className="empty">
        Project not found. <Link href="/projects" style={{ color: "#93b4fd" }}>Back to projects →</Link>
      </div>
    );

  const totals = computeTotals(project);

  return (
    <>
      <div className="crumb">
        <Link href="/projects" style={{ color: "inherit" }}>Projects</Link> ▸ {project.name}
      </div>
      <div className="page-head">
        <div>
          <h1>{project.name}</h1>
          <div className="muted" style={{ fontSize: 14 }}>
            {project.client || "No client"} · {project.region} · {project.disciplines.join(", ")}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {money(totals.total)}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>estimate total</div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={"tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
            {t}
            {t === "Drawings" && project.drawings.length ? ` (${project.drawings.length})` : ""}
            {t === "Takeoff" && project.takeoff.length ? ` (${project.takeoff.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "Drawings" && <DrawingsTab project={project} onGoTakeoff={() => setTab("Takeoff")} />}
      {tab === "Takeoff" && <TakeoffTab project={project} />}
      {tab === "Estimate" && <EstimateTab project={project} totals={totals} />}
      {tab === "Export" && <ExportTab project={project} totals={totals} />}
    </>
  );
}

/* ------------------------------ Drawings ------------------------------ */
function DrawingsTab({ project, onGoTakeoff }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const ingest = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    // simulate the convert → parse → interpret → takeoff pipeline
    setTimeout(() => {
      updateProject(project.id, (p) => {
        const newDrawings = files.map((f, i) => ({
          id: Math.random().toString(36).slice(2, 8),
          name: f.name,
          size: f.size,
          type: f.name.split(".").pop()?.toUpperCase() || "FILE",
          sheet: `S-${(p.drawings.length + i + 1).toString().padStart(3, "0")}`,
        }));
        const newItems = newDrawings.flatMap((d) =>
          generateTakeoff(d.sheet, p.disciplines)
        );
        return {
          ...p,
          drawings: [...p.drawings, ...newDrawings],
          takeoff: [...p.takeoff, ...newItems],
          status: "in_takeoff",
        };
      });
      setBusy(false);
    }, 900);
  };

  return (
    <>
      <div
        className={"drop" + (over ? " over" : "")}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          ingest(e.dataTransfer.files);
        }}
      >
        <div className="big">{busy ? "Interpreting drawings…" : "Drop drawings here, or click to browse"}</div>
        <div>DWG · DXF · PDF · PNG/JPG · XLSX — we’ll run scale detection, room & element detection, then takeoff.</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => ingest(e.target.files)}
        />
      </div>

      {project.drawings.length > 0 && (
        <div className="filelist">
          {project.drawings.map((d) => (
            <div key={d.id} className="filerow">
              <div>
                <strong>{d.sheet}</strong> &nbsp; {d.name}
              </div>
              <div className="meta">
                {d.type} · {fmtSize(d.size)} · ✓ parsed
              </div>
            </div>
          ))}
          <div className="row" style={{ marginTop: 8 }}>
            <div className="muted" style={{ fontSize: 13 }}>
              {project.takeoff.length} takeoff items generated.
            </div>
            <div className="spacer" />
            <button className="b primary sm" onClick={onGoTakeoff}>
              Review takeoff →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Takeoff ------------------------------- */
function TakeoffTab({ project }) {
  const items = project.takeoff;

  const setItem = (itemId, patch) =>
    updateProject(project.id, (p) => ({
      ...p,
      takeoff: p.takeoff.map((t) => (t.id === itemId ? { ...t, ...patch } : t)),
    }));

  const bulkAccept = () =>
    updateProject(project.id, (p) => ({
      ...p,
      takeoff: p.takeoff.map((t) =>
        t.confidence >= 0.85 && t.status === "pending" ? { ...t, status: "accepted" } : t
      ),
    }));

  if (!items.length)
    return (
      <div className="empty">
        No takeoff yet — upload a drawing on the <strong>Drawings</strong> tab to generate one.
      </div>
    );

  const pending = items.filter((t) => t.status === "pending").length;

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <span className="muted" style={{ fontSize: 13 }}>
          {items.length} items · {pending} pending review
        </span>
        <div className="spacer" />
        <button className="b sm" onClick={bulkAccept}>
          ✓ Bulk-accept high confidence (≥ 0.85)
        </button>
      </div>

      <div className="table-wrap">
        <table className="tk">
          <thead>
            <tr>
              <th>Sheet</th>
              <th>Description</th>
              <th>Discipline</th>
              <th className="num">Qty</th>
              <th>Unit</th>
              <th>Confidence</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => {
              const band = confidenceBand(t.confidence);
              return (
                <tr key={t.id} className={t.status === "rejected" ? "rejected" : ""}>
                  <td className="muted">{t.sheet}</td>
                  <td>{t.description}</td>
                  <td style={{ textTransform: "capitalize" }} className="muted">{t.discipline}</td>
                  <td className="num">
                    <input
                      className="qty-input"
                      type="number"
                      step="0.01"
                      value={t.quantity}
                      onChange={(e) => setItem(t.id, { quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="muted">{t.uom}</td>
                  <td>
                    <span className={"conf " + band}>
                      <span className="d" /> {Math.round(t.confidence * 100)}%
                    </span>
                  </td>
                  <td>
                    <span className={"status-pill " + (t.status === "accepted" ? "accepted" : "")}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap", justifyContent: "flex-end" }}>
                      <button className="b sm" onClick={() => setItem(t.id, { status: "accepted" })}>
                        ✓
                      </button>
                      <button className="b sm danger" onClick={() => setItem(t.id, { status: "rejected" })}>
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ------------------------------ Estimate ----------------------------- */
function EstimateTab({ project, totals }) {
  const items = project.takeoff.filter((t) => t.status !== "rejected");

  const setItem = (itemId, patch) =>
    updateProject(project.id, (p) => ({
      ...p,
      takeoff: p.takeoff.map((t) => (t.id === itemId ? { ...t, ...patch } : t)),
    }));

  const setPct = (key, v) =>
    updateProject(project.id, (p) => ({ ...p, [key]: parseFloat(v) || 0 }));

  if (!items.length)
    return <div className="empty">No priced items. Accept takeoff items first.</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>
      <div className="table-wrap">
        <table className="tk">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th className="num">Qty</th>
              <th>Unit</th>
              <th className="num">Rate</th>
              <th className="num">Line total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td className="muted">{t.code}</td>
                <td>{t.description}</td>
                <td className="num">{t.quantity}</td>
                <td className="muted">{t.uom}</td>
                <td className="num">
                  <input
                    className="rate-input"
                    type="number"
                    step="1"
                    value={t.rate}
                    onChange={(e) => setItem(t.id, { rate: parseFloat(e.target.value) || 0 })}
                  />
                </td>
                <td className="num">{money(t.quantity * t.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <strong style={{ display: "block", marginBottom: 14 }}>Totals</strong>
        <div className="totals">
          <span className="lbl">Direct cost</span>
          <span className="val">{money(totals.direct)}</span>

          <span className="lbl">
            Overhead{" "}
            <Pct value={project.overheadPct} onChange={(v) => setPct("overheadPct", v)} />
          </span>
          <span className="val">{money(totals.overhead)}</span>

          <span className="lbl">
            Markup{" "}
            <Pct value={project.markupPct} onChange={(v) => setPct("markupPct", v)} />
          </span>
          <span className="val">{money(totals.markup)}</span>

          <span className="lbl">
            Contingency{" "}
            <Pct value={project.contingencyPct} onChange={(v) => setPct("contingencyPct", v)} />
          </span>
          <span className="val">{money(totals.contingency)}</span>

          <span className="lbl grand">Total</span>
          <span className="val grand">{money(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Pct({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 52,
        marginLeft: 4,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        borderRadius: 6,
        padding: "2px 6px",
        fontSize: 12,
      }}
    />
  );
}

/* ------------------------------- Export ------------------------------ */
function ExportTab({ project, totals }) {
  const items = project.takeoff.filter((t) => t.status !== "rejected");

  const downloadCSV = () => {
    const rows = [
      ["Code", "Description", "Discipline", "Sheet", "Qty", "Unit", "Rate", "Line total", "Confidence"],
      ...items.map((t) => [
        t.code,
        t.description,
        t.discipline,
        t.sheet,
        t.quantity,
        t.uom,
        t.rate,
        round(t.quantity * t.rate, 2),
        Math.round(t.confidence * 100) + "%",
      ]),
      [],
      ["", "", "", "", "", "", "", "Direct cost", round(totals.direct, 2)],
      ["", "", "", "", "", "", "", `Overhead ${project.overheadPct}%`, round(totals.overhead, 2)],
      ["", "", "", "", "", "", "", `Markup ${project.markupPct}%`, round(totals.markup, 2)],
      ["", "", "", "", "", "", "", `Contingency ${project.contingencyPct}%`, round(totals.contingency, 2)],
      ["", "", "", "", "", "", "", "TOTAL", round(totals.total, 2)],
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    download(`${slug(project.name)}-BOQ.csv`, csv, "text/csv");
  };

  const downloadJSON = () => {
    download(
      `${slug(project.name)}-estimate.json`,
      JSON.stringify({ project: project.name, client: project.client, totals, items }, null, 2),
      "application/json"
    );
  };

  return (
    <>
      <div className="panel">
        <strong>Export estimate</strong>
        <p className="muted" style={{ fontSize: 14, margin: "8px 0 16px" }}>
          {items.length} line items · total <strong style={{ color: "var(--text)" }}>{money(totals.total)}</strong>.
          Downloads run entirely in your browser.
        </p>
        <div className="row">
          <button className="b primary" onClick={downloadCSV} disabled={!items.length}>
            ⬇ Download BOQ (CSV)
          </button>
          <button className="b" onClick={downloadJSON} disabled={!items.length}>
            ⬇ Download estimate (JSON)
          </button>
          <button className="b" onClick={() => window.print()}>
            🖨 Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="panel">
        <strong style={{ display: "block", marginBottom: 12 }}>Summary preview</strong>
        <div className="totals" style={{ maxWidth: 360 }}>
          <span className="lbl">Direct cost</span>
          <span className="val">{money(totals.direct)}</span>
          <span className="lbl">Overhead</span>
          <span className="val">{money(totals.overhead)}</span>
          <span className="lbl">Markup</span>
          <span className="val">{money(totals.markup)}</span>
          <span className="lbl">Contingency</span>
          <span className="val">{money(totals.contingency)}</span>
          <span className="lbl grand">Total</span>
          <span className="val grand">{money(totals.total)}</span>
        </div>
      </div>
    </>
  );
}

/* ------------------------------- utils ------------------------------- */
function fmtSize(b) {
  if (!b && b !== 0) return "—";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
