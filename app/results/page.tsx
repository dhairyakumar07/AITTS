"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResultsContent() {
  const params = useSearchParams();
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          window.location.href = "/login";
          return;
        }

        setResults(d.results || []);
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  const selected = params.get("attempt");

  const result = results.find(
    (x) => String(x.attemptId) === selected
  );

  return (
    <main className="container main">
      <div className="dashboard-head">
        <div>
          <p className="muted">Results</p>
          <h1>Performance history</h1>
        </div>

        <Link className="btn btn-primary" href="/tests">
          Take a test
        </Link>
      </div>

      {result && (
        <div
          className="card"
          style={{ padding: 28, marginTop: 20 }}
        >
          <div className="grid grid-4">
            <div className="stat">
              <div className="muted">Score</div>
              <div className="num">
                {result.score}/{result.totalMarks}
              </div>
            </div>

            <div className="stat">
              <div className="muted">Percentage</div>
              <div className="num">
                {Math.round(result.percentage)}%
              </div>
            </div>

            <div className="stat">
              <div className="muted">Correct</div>
              <div className="num">
                {result.correct}
              </div>
            </div>

            <div className="stat">
              <div className="muted">Time</div>
              <div className="num">
                {Math.floor(
                  result.timeTakenSeconds / 60
                )}m
              </div>
            </div>
          </div>

          <h2 style={{ marginTop: 20 }}>
            {result.title}
          </h2>

          <div className="bar">
            <span
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, result.percentage)
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="section-title">
        <h2>All attempts</h2>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Attempt</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {results.map((x) => (
              <tr key={x.attemptId}>
                <td>{x.title}</td>
                <td>#{x.attemptNumber}</td>
                <td>
                  {x.score}/{x.totalMarks}
                </td>
                <td>
                  {Math.round(x.percentage)}%
                </td>
                <td>
                  {new Date(
                    x.submittedAt
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function Results() {
  return (
    <Suspense
      fallback={
        <main className="container main">
          Loading results...
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}