'use client';

import { useEffect, useState } from 'react';

type AuditRecord = {
  id: string;
  customer_id: string;
  question: string;
  answer?: {
    recommendation?: string;
    summary?: string;
    dataSource?: string;
    riskFlags?: string[];
    missingInformation?: string[];
    policyEvidence?: Array<{
      document: string;
      section: string;
      quote: string;
    }>;
  };
  model_used: string;
  confidence: number;
  retrieved_document_ids?: string[];
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAudits() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/audit', { cache: 'no-store' });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Audit API error ${res.status}`);
        }

        const data = await res.json();
        setAudits(data.audits || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load audit log');
      } finally {
        setLoading(false);
      }
    }

    loadAudits();
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="topbar">
          <div>
            <p className="kicker">AssistIQ Audit Dashboard</p>
            <h1>Responsible AI Review Log</h1>
            <p className="subhead">
              Audit-ready trace of customer review prompts, model output, confidence,
              retrieved policy documents, and human-in-the-loop decision-support activity.
            </p>
            <p className="footer-note">
              This page demonstrates traceability and compliance monitoring for AI-assisted banking workflows.
            </p>
          </div>
          <div className="status-card">
            <small>Audit Mode</small>
            <strong>Read Only</strong>
          </div>
        </header>

        <section className="metrics">
          <div className="metric">
            <span>Audit Records</span>
            <strong>{audits.length}</strong>
          </div>
          <div className="metric">
            <span>Latest Model</span>
            <strong>{audits[0]?.model_used || 'Pending'}</strong>
          </div>
          <div className="metric">
            <span>Avg Confidence</span>
            <strong>
              {audits.length
                ? `${Math.round(
                    (audits.reduce((sum, item) => sum + Number(item.confidence || 0), 0) /
                      audits.length) *
                      100
                  )}%`
                : 'N/A'}
            </strong>
          </div>
          <div className="metric">
            <span>Evidence Logged</span>
            <strong>
              {audits.reduce(
                (sum, item) => sum + Number(item.retrieved_document_ids?.length || 0),
                0
              )}
            </strong>
          </div>
        </section>

        {loading && <div className="notice">Loading audit log...</div>}
        {error && <div className="error">{error}</div>}

        <section className="audit-grid">
          {audits.map((audit) => (
            <article className="panel audit-card" key={audit.id}>
              <div className="audit-card-head">
                <div>
                  <p className="kicker">Customer {audit.customer_id}</p>
                  <h2>{audit.answer?.recommendation?.replaceAll('_', ' ') || 'Review Logged'}</h2>
                  <p>{audit.answer?.summary || audit.question}</p>
                </div>
                <div className="confidence">
                  <span>Confidence</span>
                  <strong>{Math.round(Number(audit.confidence || 0) * 100)}%</strong>
                </div>
              </div>

              <div className="transparency-grid">
                <div className="fact">
                  <span>Model</span>
                  <strong>{audit.model_used || 'N/A'}</strong>
                </div>
                <div className="fact">
                  <span>Created</span>
                  <strong>{formatDate(audit.created_at)}</strong>
                </div>
                <div className="fact">
                  <span>Documents</span>
                  <strong>{audit.retrieved_document_ids?.length || 0}</strong>
                </div>
                <div className="fact">
                  <span>Data Source</span>
                  <strong>{audit.answer?.dataSource || 'N/A'}</strong>
                </div>
              </div>

              <div className="list">
                <div className="list-item">
                  <strong>Question:</strong> {audit.question}
                </div>
                {(audit.answer?.riskFlags || []).slice(0, 3).map((flag) => (
                  <div className="list-item red" key={flag}>
                    ⚠ {flag}
                  </div>
                ))}
                {(audit.answer?.missingInformation || []).slice(0, 3).map((item) => (
                  <div className="list-item amber" key={item}>
                    □ {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <footer className="site-footer">
          <p>
            Built by <strong>Jamshir Qureshi</strong> · Responsible AI auditability demo
          </p>
          <p className="footer-links">
            <a href="/">Back to Case Review Workspace</a>
            <span>·</span>
            <a
              href={
                process.env.NEXT_PUBLIC_GITHUB_REPO_URL ||
                'https://github.com/llmaideveloper/assistiq-banking-copilot/blob/main/README.md'
              }
              target="_blank"
              rel="noreferrer"
            >
              View GitHub README and architecture
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
