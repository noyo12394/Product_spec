"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "estimai_projects_v2";

/* ----------------------------- persistence ----------------------------- */
export function loadProjects() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function persist(projects) {
  localStorage.setItem(KEY, JSON.stringify(projects));
  // notify other hook instances in the same tab
  window.dispatchEvent(new Event("estimai:projects"));
}

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => setProjects(loadProjects());
    sync();
    setLoaded(true);
    window.addEventListener("estimai:projects", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("estimai:projects", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((next) => {
    persist(next);
    setProjects(next);
  }, []);

  return { projects, save, loaded };
}

/* ------------------------------ mutations ------------------------------ */
export function createProject({ name, client, region, disciplines }) {
  const projects = loadProjects();
  const p = {
    id: uid(),
    name,
    client: client || "",
    region: region || "US-CA",
    currency: "USD",
    disciplines: disciplines && disciplines.length ? disciplines : ["architectural"],
    status: "draft",
    createdAt: Date.now(),
    drawings: [],
    takeoff: [],
    markupPct: 12,
    overheadPct: 8,
    contingencyPct: 5,
  };
  persist([p, ...projects]);
  return p;
}

export function updateProject(id, updater) {
  const projects = loadProjects();
  const next = projects.map((p) => (p.id === id ? updater({ ...p }) : p));
  persist(next);
  return next.find((p) => p.id === id);
}

export function deleteProject(id) {
  persist(loadProjects().filter((p) => p.id !== id));
}

export function getProject(id) {
  return loadProjects().find((p) => p.id === id) || null;
}

/* --------------------- simulated AI takeoff engine --------------------- */
// When a drawing is "uploaded", we synthesize a confidence-scored takeoff,
// mirroring docs/10-estimation-measurement-logic.md & docs/19-examples.md.
const CATALOG = [
  ["Partition wall P1 (area)", "architectural", "m2", "09 21 16", [40, 60], 18],
  ["Gypsum board (2 layers)", "architectural", "m2", "09 29 00", [80, 120], 14],
  ["Paint — 2 coats", "architectural", "m2", "09 91 23", [80, 120], 7],
  ["Floor finish — carpet tile", "architectural", "m2", "09 68 00", [15, 30], 32],
  ["Suspended ceiling", "architectural", "m2", "09 51 00", [15, 30], 28],
  ["Door D1 (single leaf)", "architectural", "ea", "08 11 00", [1, 4], 480],
  ["Window W2", "architectural", "ea", "08 51 00", [1, 3], 620],
  ["Slab on grade — concrete", "structural", "m3", "03 30 00", [3, 12], 165],
  ["Column — concrete", "structural", "m3", "03 30 00", [1, 4], 210],
  ["Light fixture 2x4 troffer", "electrical", "ea", "26 51 00", [4, 12], 95],
  ["Power socket — duplex", "electrical", "ea", "26 27 26", [6, 18], 42],
  ["Supply duct — rectangular", "mechanical", "m", "23 31 13", [10, 30], 58],
  ["VAV terminal unit", "mechanical", "ea", "23 36 00", [1, 4], 880],
];

export function generateTakeoff(sheetLabel, disciplines) {
  const allowed = disciplines && disciplines.length ? disciplines : null;
  const seed = Math.floor(Math.random() * 1000);
  return CATALOG.filter((c) => !allowed || allowed.includes(c[1])).map((c, i) => {
    const [desc, discipline, uom, code, [lo, hi], rate] = c;
    const qty = round(lo + ((seed * (i + 3)) % 100) / 100 * (hi - lo), uom === "ea" ? 0 : 2);
    const confidence = round(0.6 + (((seed + i * 7) % 38) / 100), 2); // 0.60–0.98
    return {
      id: uid(),
      sheet: sheetLabel,
      description: desc,
      discipline,
      uom,
      code,
      quantity: qty,
      confidence,
      rate,
      status: "pending", // pending | accepted | rejected
    };
  });
}

/* -------------------------------- utils -------------------------------- */
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
export function round(n, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}
export const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    isFinite(n) ? n : 0
  );

export const DISCIPLINES = [
  "architectural",
  "structural",
  "mechanical",
  "electrical",
  "civil",
];

export function confidenceBand(c) {
  if (c >= 0.85) return "high";
  if (c >= 0.6) return "med";
  return "low";
}

/* totals for an estimate (accepted items only) */
export function computeTotals(project) {
  const accepted = (project.takeoff || []).filter((t) => t.status !== "rejected");
  const direct = accepted.reduce((s, t) => s + t.quantity * t.rate, 0);
  const overhead = direct * (project.overheadPct || 0) / 100;
  const markup = (direct + overhead) * (project.markupPct || 0) / 100;
  const contingency = (direct + overhead + markup) * (project.contingencyPct || 0) / 100;
  const total = direct + overhead + markup + contingency;
  return { direct, overhead, markup, contingency, total, count: accepted.length };
}
