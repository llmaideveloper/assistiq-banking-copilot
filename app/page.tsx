'use client';

import { useMemo, useState } from 'react';

type PolicyEvidence = {
  document: string;
  section: string;
  quote: string;
};

type AiResponse = {
  recommendation: string;
  summary: string;
  confidence: number;
  policyEvidence: PolicyEvidence[];
  customerFactors: string[];
  missingInformation: string[];
  riskFlags: string[];
  allowedActions: string[];
  disclaimer: string;
};

const ASSIST_ENDPOINT = '/api/assist';

const demoCases = [
  ['C1001', 'Ava Johnson', 'Medium Risk', 'Manager Review'],
  ['C1002', 'Marcus Reed', 'Low Risk', 'Missing Docs'],
  ['C1003', 'Linda Patel', 'High Risk', 'Escalated'],
];

export default function Home() {
  const [customerId, setCustomerId] = useState('C1001');
  const [question, setQuestion] = useState(
    'Is this customer eligible for hardship payment plan?'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [error, setError] = useState('');

  const confidencePercent = useMemo(
    () => (result ? Math.round(result.confidence * 100) : 0),
    [result]
  );

  async function askAI() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(ASSIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, question }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend error ${res.status}: ${text || res.statusText}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="container">
        <header className="topbar">
          <div>
            <p className="kicker">AssistIQ Banking Copilot</p>
            <h1>Customer Assistance Review Workspace</h1>
            <p className="subhead">
              AI-powered hardship review support for loan servicing teams with
              policy evidence, missing documentation, risk flags, escalation
              guidance, and human-in-the-loop controls.
            </p>
            <p className="footer-note">Backend mode: Next.js API Route</p>
          </div>
          <div className="status-card">
            <small>System Status</small>
            <strong>Decision Support Only</strong>
          </div>
        </header>

        <section className="metrics">
          {[
            ['Open Cases', '24'],
            ['Manager Reviews', '6'],
            ['Missing Docs', '9'],
            ['Avg Confidence', '82%'],
          ].map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <div className="workspace">
          <aside className="panel">
            <div className="panel-title">
              <h2>Case Queue</h2>
              <span className="badge badge-cyan">Live Demo</span>
            </div>
            <div className="case-list">
              {demoCases.map(([id, name, risk, status]) => (
                <button
                  key={id}
                  className={`case-card ${id === customerId ? 'active' : ''}`}
                  onClick={() => setCustomerId(id)}
                >
                  <div className="case-header">
                    <strong>{name}</strong>
                    <span>{id}</span>
                  </div>
                  <p>{risk}</p>
                  <p className="case-status">{status}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="stack">
            <div className="panel">
              <div className="profile-head">
                <div>
                  <p className="kicker">Case Review</p>
                  <h2>Ava Johnson</h2>
                  <p>
                    Customer ID {customerId} · Reduced hours · Medium risk · 35 days
                    delinquent
                  </p>
                </div>
                <div className="score">
                  <span>Credit Score</span>
                  <strong>690</strong>
                </div>
              </div>
              <div className="facts">
                {[
                  ['Income', '$62,000'],
                  ['Employment', 'Reduced Hours'],
                  ['Risk Band', 'Medium'],
                  ['Max Delinquency', '35 days'],
                ].map(([label, value]) => (
                  <div className="fact" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>AI Review Request</h2>
              <p className="subhead">
                Ask a controlled decision-support question. The assistant returns
                policy evidence, risk flags, missing documentation, and allowed next
                actions.
              </p>
              <div className="form-grid">
                <input
                  className="input"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Customer ID"
                />
                <input
                  className="input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a review question"
                />
              </div>
              <button className="primary" onClick={askAI} disabled={loading}>
                {loading ? 'Reviewing Case...' : 'Run AI Case Review'}
              </button>
              {error && <div className="error">{error}</div>}
            </div>

            {result && (
              <>
                <div className="panel recommendation">
                  <div className="rec-row">
                    <div>
                      <p className="kicker">AI Recommendation</p>
                      <h2>{result.recommendation.replaceAll('_', ' ')}</h2>
                      <p>{result.summary}</p>
                    </div>
                    <div className="confidence">
                      <span>Confidence</span>
                      <strong>{confidencePercent}%</strong>
                    </div>
                  </div>
                </div>

                <div className="two-col">
                  <div className="panel">
                    <h3>Customer Factors</h3>
                    <div className="list">
                      {result.customerFactors.map((item) => (
                        <div className="list-item" key={item}>✓ {item}</div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <h3>Missing Documentation</h3>
                    <div className="list">
                      {result.missingInformation.map((item) => (
                        <div className="list-item amber" key={item}>□ {item}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <h3>Risk Flags</h3>
                  <div className="list">
                    {result.riskFlags.map((flag) => (
                      <div className="list-item red" key={flag}>⚠ {flag}</div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <h3>Policy Evidence</h3>
                  <div className="policy-grid">
                    {result.policyEvidence.map((evidence, index) => (
                      <div className="policy-card" key={`${evidence.section}-${index}`}>
                        <strong>{evidence.document} · {evidence.section}</strong>
                        <p>“{evidence.quote}”</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="two-col">
                  <div className="panel">
                    <h3>Allowed Actions</h3>
                    <div className="action-row">
                      {result.allowedActions.map((action) => (
                        <button className="action" key={action}>{action}</button>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <h3>Audit Trail</h3>
                    <div className="list">
                      <div className="list-item">Case opened by servicing agent.</div>
                      <div className="list-item">
                        AI review completed with {confidencePercent}% confidence.
                      </div>
                      <div className="list-item">
                        Human review required before final decision.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="notice">
                  <strong>Compliance Notice:</strong> {result.disclaimer}
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="site-footer">
          <p>
            Built by <strong>Jamshir Qureshi</strong> · AI Architect & Software Engineering Portfolio Demo
          </p>
          <p>
            Demonstrates AI decision support, human-in-the-loop review, policy evidence, workflow design, and responsible AI controls.
          </p>
        </footer>
      </div>
    </main>
  );
}
