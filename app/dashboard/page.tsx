"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Flame,
  Medal,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<any>();
  const [tests, setTests] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/tests").then((r) => r.json()),
      fetch("/api/results").then((r) => r.json()),
    ])
      .then(([u, t, r]) => {
        if (!u.user) {
          location.href = "/login";
          return;
        }
        setUser(u.user);
        setTests(t.tests || []);
        setResults(r.results || []);
        setLoading(false);
      })
      .catch(() => (location.href = "/login"));
  }, []);

  const avg = results.length
    ? results.reduce((a, b) => a + Number(b.percentage || 0), 0) / results.length
    : 0;
  const best = results.length
    ? Math.max(...results.map((x) => Number(x.percentage || 0)))
    : 0;
  const attempts = results.length;
  const reattempts = tests.filter(
    (t) => t.allowReattempt && Number(t.attemptCount) < Number(t.maxAttempts)
  ).length;

  const latest = results[0];
  const latestScore = latest ? Math.round(Number(latest.percentage || 0)) : 0;
  const firstName = user?.name?.split(" ")[0] || "Student";

  const momentum = useMemo(() => {
    if (results.length < 2) return 0;
    const recent = Number(results[0]?.percentage || 0);
    const previous = Number(results[1]?.percentage || 0);
    return Math.round(recent - previous);
  }, [results]);

  if (loading) {
    return (
      <main className="container main">
        <div className="card empty">Loading your dashboard…</div>
      </main>
    );
  }

  return (
    <main className="container main dashboard-v3">
      <section className="dash-hero">
        <div className="dash-hero-glow" />
        <div className="dash-hero-content">
          <div className="dash-kicker">
            <span className="live-dot" /> ORGANIC COMMAND CENTER
          </div>
          <h1>
            Ready, {firstName}? <span>Let&apos;s climb.</span>
          </h1>
          <p>
            Your preparation dashboard — tests, performance and your next move,
            all in one place.
          </p>
          <div className="dash-actions">
            <Link className="btn btn-primary dash-main-action" href="/tests">
              Find your next test <ArrowRight size={17} />
            </Link>
            <Link className="dash-text-action" href="/results">
              View performance <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="dash-hero-orbit" aria-hidden="true">
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="orbit-core">
            <Sparkles size={18} />
            <strong>{Math.round(avg)}%</strong>
            <span>avg. score</span>
          </div>
        </div>
      </section>

      <section className="dash-command-grid">
        <div className="dash-stat-card featured-stat">
          <div className="stat-topline">
            <span className="stat-icon purple"><BarChart3 size={17} /></span>
            <span className="stat-trend">
              {momentum > 0 ? `+${momentum}%` : momentum < 0 ? `${momentum}%` : "—"}
            </span>
          </div>
          <strong>{Math.round(avg)}%</strong>
          <span>Average score</span>
          <div className="progress-track"><i style={{ width: `${Math.min(avg, 100)}%` }} /></div>
        </div>

        <div className="dash-stat-card">
          <div className="stat-topline">
            <span className="stat-icon gold"><Trophy size={17} /></span>
            <Medal size={16} className="muted" />
          </div>
          <strong>{Math.round(best)}%</strong>
          <span>Personal best</span>
          <small>{best ? "Keep pushing the ceiling." : "Your first benchmark is waiting."}</small>
        </div>

        <div className="dash-stat-card">
          <div className="stat-topline">
            <span className="stat-icon teal"><FileText size={17} /></span>
            <Zap size={16} className="muted" />
          </div>
          <strong>{tests.length}</strong>
          <span>Live tests</span>
          <small>{tests.length ? "Fresh challenges available." : "No live papers right now."}</small>
        </div>

        <div className="dash-stat-card">
          <div className="stat-topline">
            <span className="stat-icon orange"><RefreshCw size={17} /></span>
            <Target size={16} className="muted" />
          </div>
          <strong>{reattempts}</strong>
          <span>Reattempts ready</span>
          <small>{reattempts ? "One more shot to improve." : "No extra attempts available."}</small>
        </div>
      </section>

      <section className="dash-focus-grid">
        <div>
          <div className="section-heading-v3">
            <div>
              <span className="eyebrow">UP NEXT</span>
              <h2>Pick your Organic challenge</h2>
            </div>
            <Link href="/tests" className="view-all-link">View all <ArrowRight size={14} /></Link>
          </div>

          <div className="dash-test-grid">
            {tests.slice(0, 3).map((t, index) => (
              <article className="dash-test-card" key={t.id}>
                <div className="dash-test-number">0{index + 1}</div>
                <div className="dash-test-icon"><FileText size={19} /></div>
                <span className="pill">{t.subject}</span>
                <h3>{t.title}</h3>
                <p>{t.description || "A focused Organic Chemistry paper designed to test concepts, mechanisms and decision-making."}</p>
                <div className="dash-test-meta">
                  <span><FileText size={13} /> {t.questionCount} Qs</span>
                  <span><Clock3 size={13} /> {t.durationMinutes} min</span>
                  <span><Target size={13} /> {t.totalMarks} marks</span>
                </div>
                <Link href={`/tests/${t.id}`} className="dash-test-button">
                  Start test <ArrowRight size={15} />
                </Link>
              </article>
            ))}

            {!tests.length && (
              <div className="card empty">No live Organic Chemistry tests are available right now.</div>
            )}
          </div>
        </div>

        <aside className="dash-side-stack">
          <div className="dash-focus-card">
            <div className="focus-card-top">
              <div>
                <span className="eyebrow">LATEST RUN</span>
                <h3>{latest ? latest.title : "No attempts yet"}</h3>
              </div>
              <div className="focus-score">{latestScore}%</div>
            </div>
            {latest ? (
              <>
                <div className="focus-bar"><i style={{ width: `${latestScore}%` }} /></div>
                <div className="focus-row">
                  <span><CheckCircle2 size={14} /> {latest.correctCount ?? "—"} correct</span>
                  <span>Attempt #{latest.attemptNumber}</span>
                </div>
                <Link href="/results" className="focus-link">Open full analysis <ArrowRight size={14} /></Link>
              </>
            ) : (
              <Link href="/tests" className="focus-link">Take your first test <ArrowRight size={14} /></Link>
            )}
          </div>

          <div className="dash-streak-card">
            <div className="streak-flame"><Flame size={23} /></div>
            <div>
              <strong>{attempts}</strong>
              <span>completed attempts</span>
            </div>
            <div className="streak-badge">KEEP GOING</div>
          </div>
        </aside>
      </section>

      <section className="organic-intelligence-banner">
        <div>
          <span className="eyebrow">AITTS INTELLIGENCE</span>
          <h2>Your score is only the beginning.</h2>
          <p>Turn every Organic Chemistry attempt into a diagnosis: concept strength, decision quality, confidence and the next recovery target.</p>
        </div>
        <div className="organic-signal-grid">
          <div><span>CONCEPTS</span><strong>{Math.round(avg || 0)}%</strong><small>overall signal</small></div>
          <div><span>CONSISTENCY</span><strong>{results.length ? Math.min(100, Math.round(avg + 6)) : 0}%</strong><small>recent pattern</small></div>
          <div><span>NEXT MOVE</span><strong>01</strong><small>recovery target</small></div>
        </div>
      </section>

      <section className="dash-history">
        <div className="section-heading-v3">
          <div>
            <span className="eyebrow">YOUR HISTORY</span>
            <h2>Recent attempts</h2>
          </div>
          <Link href="/results" className="view-all-link">All results <ArrowRight size={14} /></Link>
        </div>

        <div className="dash-history-card">
          {results.slice(0, 5).map((x, i) => (
            <div className="history-row" key={x.attemptId}>
              <div className="history-rank">{String(i + 1).padStart(2, "0")}</div>
              <div className="history-title">
                <strong>{x.title}</strong>
                <span>Attempt #{x.attemptNumber} · {new Date(x.submittedAt).toLocaleDateString()}</span>
              </div>
              <div className="history-score">
                <strong>{Math.round(Number(x.percentage || 0))}%</strong>
                <span>{x.score}/{x.totalMarks}</span>
              </div>
              <Link href="/results" className="history-arrow" aria-label="View result"><ArrowRight size={16} /></Link>
            </div>
          ))}
          {!results.length && <div className="empty">Your completed Organic Chemistry attempts will appear here.</div>}
        </div>
      </section>
    </main>
  );
}
