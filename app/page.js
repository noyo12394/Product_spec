export default function Home() {
  return (
    <>
      <header className="container">
        <nav className="nav">
          <div className="brand">
            <span className="brand-mark" />
            EstimAI
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="https://github.com/noyo12394/Product_spec">Docs</a>
          </div>
          <a className="btn btn-primary" href="/dashboard">
            Launch app →
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <span className="pill">
              <span className="dot" /> AI takeoff with a human in the loop
            </span>
            <h1>
              From drawing set to a{" "}
              <span className="grad">defensible priced estimate</span> — in hours,
              not weeks.
            </h1>
            <p className="sub">
              EstimAI reads your CAD, PDF and BOQ files, detects rooms and
              elements, measures quantities, and builds a final cost estimate.
              Every number carries a confidence score and a full audit trail.
            </p>
            <div className="cta" id="cta">
              <a className="btn btn-primary" href="/dashboard">
                Launch the app →
              </a>
              <a
                className="btn btn-ghost"
                href="https://github.com/noyo12394/Product_spec"
              >
                Read the spec
              </a>
            </div>
          </div>
        </section>

        <section className="container">
          <div className="stats">
            <div className="stat">
              <div className="num">60%+</div>
              <div className="lbl">Less takeoff time</div>
            </div>
            <div className="stat">
              <div className="num">90%+</div>
              <div className="lbl">Detection recall (vector)</div>
            </div>
            <div className="stat">
              <div className="num">5</div>
              <div className="lbl">Disciplines covered</div>
            </div>
            <div className="stat">
              <div className="num">100%</div>
              <div className="lbl">Quantities audit-traced</div>
            </div>
          </div>
        </section>

        <section className="section container" id="features">
          <h2>Everything an estimator needs</h2>
          <p className="lead">
            Built for general contractors, subcontractors, quantity surveyors,
            and A/E firms across Civil, Structural, Mechanical, Electrical and
            Architectural work.
          </p>
          <div className="grid">
            {[
              ["📐", "CAD / PDF ingestion", "DWG, DXF, vector & scanned PDF, images, Excel BOQs and specs — all in one project."],
              ["🏠", "Room detection", "Automatic room boundaries, names and numbers, with room-wise takeoff rollups."],
              ["📏", "Measurement engine", "Lengths, areas, volumes and counts with opening deductions and waste factors."],
              ["🧠", "AI interpretation", "Detects walls, slabs, columns, doors, ducts, fixtures and more — with confidence scores."],
              ["✅", "Review workflow", "Accept, edit, split, merge or reclassify. Nothing is priced without your sign-off."],
              ["💲", "Rate library & pricing", "Apply material, labor and equipment rates, markups and contingency to build the total."],
              ["🔍", "Audit trails", "Every quantity shows exactly how it was computed: source sheet, formula and assumptions."],
              ["🗂️", "Versions & revisions", "Track drawing versions and estimate revisions; compare scenarios side by side."],
              ["📤", "Export center", "Branded PDF reports, templated Excel, and standard BOQ formats with an audit appendix."],
            ].map(([ic, title, body]) => (
              <div className="card" key={title}>
                <div className="ic">{ic}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section container" id="how">
          <h2>How it works</h2>
          <p className="lead">
            A deterministic engine does the math; AI classifies, reconciles and
            explains — and an estimator approves before anything is priced.
          </p>
          <div className="flow">
            {[
              "Upload",
              "Confirm scale",
              "AI interpretation",
              "Takeoff",
              "Estimator review",
              "Apply rates",
              "Approve",
              "Export",
            ].map((s, i, arr) => (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span className="step">{s}</span>
                {i < arr.length - 1 ? <span className="arrow">→</span> : null}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer container">
        <span>© {new Date().getFullYear()} EstimAI — product specification demo.</span>
        <span>Built with Next.js · Deployed on Vercel</span>
      </footer>
    </>
  );
}
