'use client';

import { useEffect, useMemo, useState } from 'react';

type PolicyEvidence = {
  document: string;
  section: string;
  quote: string;
};

type CustomerCase = {
  id: string;
  name: string;
  income?: number | null;
  employmentStatus?: string | null;
  creditScore?: number | null;
  riskBand?: string | null;
  riskLabel?: string;
  status?: string;
  maxDelinquencyDays?: number;
  loanCount?: number;
};

type AiResponse = {
  recommendation: string;
  summary: string;
  confidence: number;
  customerName?: string;
  dataSource?: string;
  modelUsed?: string;
  policyEvidence: PolicyEvidence[];
  customerFactors: string[];
  missingInformation: string[];
  riskFlags: string[];
  allowedActions: string[];
  disclaimer: string;
};

type ReviewRole = 'Servicing Agent' | 'Manager' | 'Compliance Reviewer';

const ASSIST_ENDPOINT = '/api/assist';
const CUSTOMERS_ENDPOINT = '/api/customers';

const GITHUB_README_URL =
  process.env.NEXT_PUBLIC_GITHUB_REPO_URL ||
  'https://github.com/llmaideveloper/assistiq-banking-copilot/blob/main/README.md';

const fallbackCases: CustomerCase[] = [
  {
    id: 'C1001',
    name: 'Ava Johnson',
    riskLabel: 'Medium Risk',
    status: 'Manager Review',
    employmentStatus: 'reduced_hours',
    creditScore: 690,
    riskBand: 'medium',
    maxDelinquencyDays: 35,
    loanCount: 1,
  },
  {
    id: 'C1002',
    name: 'Marcus Reed',
    riskLabel: 'Low Risk',
    status: 'Missing Docs',
    employmentStatus: 'employed',
    creditScore: 720,
    riskBand: 'low',
    maxDelinquencyDays: 12,
    loanCount: 1,
  },
  {
    id: 'C1003',
    name: 'Linda Patel',
    riskLabel: 'High Risk',
    status: 'Escalated',
    employmentStatus: 'medical_leave',
    creditScore: 645,
    riskBand: 'high',
    maxDelinquencyDays: 48,
    loanCount: 1,
  },
];

const roleAllowedActions: Record<ReviewRole, string[]> = {
  'Servicing Agent': [
    'Request hardship documentation',
    'Create servicing case note',
    'Route to manager review',
  ],
  Manager: [
    'Review escalation queue',
    'Validate documentation completeness',
    'Assign final human reviewer',
  ],
  'Compliance Reviewer': [
    'Inspect policy evidence',
    'Review audit log',
    'Flag compliance exception',
  ],
};

function titleCase(value?: string | null) {
  if (!value) return 'Unknown';
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value?: number | null) {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function getRetrievalMode(dataSource?: string) {
  if (!dataSource) return 'Pending';
  if (dataSource.includes('pgvector RAG retrieval')) return 'pgvector RAG retrieval';
  if (dataSource.includes('fallback policy retrieval')) return 'fallback policy retrieval';
  return 'Standard retrieval';
}

function getSimilarityScore(text: string) {
  const match = text.match(/Similarity score:\s*([0-9.]+)/i);
  return match?.[1];
}

export default function Home() {
  const [customerId, setCustomerId] = useState('C1001');
  const [question, setQuestion] = useState(
    'Is this customer eligible for hardship payment plan?'
  );
  const [reviewRole, setReviewRole] = useState<ReviewRole>('Servicing Agent');
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [result, setResult] = useState<AiResponse | null>(null);
  const [error, setError] = useState('');
  const [customerError, setCustomerError] = useState('');
  const [customerCases, setCustomerCases] = useState<CustomerCase[]>(fallbackCases);

  const selectedCustomer =
    customerCases.find((customer) => customer.id === customerId) || customerCases[0];

  const confidencePercent = useMemo(
    () => (result ? Math.round(result.confidence * 100) : 0),
    [result]
  );

  const retrievalMode = getRetrievalMode(result?.dataSource);
  const modelUsed = result?.modelUsed || 'llama-3.1-8b-instant';
  const policyChunksRetrieved = result?.policyEvidence?.length || 0;
  const roleActions = roleAllowedActions[reviewRole];

  useEffect(() => {
    async function loadCustomers() {
      setCustomersLoading(true);
      setCustomerError('');

      try {
        const res = await fetch(CUSTOMERS_ENDPOINT, { cache: 'no-store' });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Customer API error ${res.status}`);
        }

        const data = await res.json();
        const customers = data.customers || [];

        if (customers.length > 0) {
          setCustomerCases(customers);
          setCustomerId(customers[0].id);
        }
      } catch (err: any) {
        setCustomerError(
          'Using fallback demo cases because Supabase customers could not be loaded.'
        );
        console.error(err);
      } finally {
        setCustomersLoading(false);
      }
    }

    loadCustomers();
  }, []);

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
              Supabase pgvector RAG retrieval, Groq LLM decision support, policy
              evidence, missing documentation, risk flags, escalation guidance,
              and human-in-the-loop controls.
            </p>
            <p className="footer-note">
              Backend mode: Supabase PostgreSQL + pgvector RAG + Groq LLM + Next.js API Routes
            </p>
          </div>
          <div className="status-card">
            <small>System Status</small>
            <strong>Decision Support Only</strong>
          </div>
        </header>

        <section className="metrics">
          {[
            ['Open Cases', String(customerCases.length)],
            [
              'Manager Reviews',
              String(customerCases.filter((c) => c.status?.toLowerCase().includes('manager')).length),
            ],
            ['Supabase Source', customerError ? 'Fallback' : 'Live'],
            ['Avg Confidence', result ? `${confidencePercent}%` : 'Pending'],
          ].map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        {customerError && (
          <div className="notice warning">
            <strong>Data Notice:</strong> {customerError}
          </div>
        )}

        <div className="workspace">
          <aside className="panel">
            <div className="panel-title">
              <h2>Case Queue</h2>
              <span className="badge badge-cyan">{customersLoading ? 'Loading' : 'Supabase'}</span>
            </div>
            <div className="case-list">
              {customerCases.map((customer) => (
                <button
                  key={customer.id}
                  className={`case-card ${customer.id === customerId ? 'active' : ''}`}
                  onClick={() => {
                    setCustomerId(customer.id);
                    setResult(null);
                  }}
                >
                  <div className="case-header">
                    <strong>{customer.name}</strong>
                    <span>{customer.id}</span>
                  </div>
                  <p>{customer.riskLabel || titleCase(customer.riskBand)}</p>
                  <p className="case-status">{customer.status || 'Review'}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="stack">
            <div className="panel">
              <div className="profile-head">
                <div>
                  <p className="kicker">Case Review</p>
                  <h2>{selectedCustomer?.name || 'Customer'}</h2>
                  <p>
                    Customer ID {customerId} · {titleCase(selectedCustomer?.employmentStatus)} ·{' '}
                    {titleCase(selectedCustomer?.riskBand)} risk ·{' '}
                    {selectedCustomer?.maxDelinquencyDays ?? 0} days delinquent
                  </p>
                </div>
                <div className="score">
                  <span>Credit Score</span>
                  <strong>{selectedCustomer?.creditScore ?? 'N/A'}</strong>
                </div>
              </div>
              <div className="facts">
                {[
                  ['Income', money(selectedCustomer?.income)],
                  ['Employment', titleCase(selectedCustomer?.employmentStatus)],
                  ['Risk Band', titleCase(selectedCustomer?.riskBand)],
                  ['Max Delinquency', `${selectedCustomer?.maxDelinquencyDays ?? 0} days`],
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
                Supabase-backed customer context, pgvector-retrieved policy evidence,
                risk flags, missing documentation, allowed next actions, and audit-ready output.
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

              <div className="role-panel">
                <div>
                  <span className="mini-label">Workflow Role</span>
                  <strong>{reviewRole}</strong>
                </div>
                <select
                  className="input role-select"
                  value={reviewRole}
                  onChange={(e) => setReviewRole(e.target.value as ReviewRole)}
                >
                  <option>Servicing Agent</option>
                  <option>Manager</option>
                  <option>Compliance Reviewer</option>
                </select>
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
                      {result.dataSource && (
                        <p className="footer-note">Data source: {result.dataSource}</p>
                      )}
                    </div>
                    <div className="confidence">
                      <span>Confidence</span>
                      <strong>{confidencePercent}%</strong>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <h3>RAG Transparency</h3>
                  <div className="transparency-grid">
                    <div className="fact">
                      <span>Retrieval Mode</span>
                      <strong>{retrievalMode}</strong>
                    </div>
                    <div className="fact">
                      <span>Model</span>
                      <strong>{modelUsed}</strong>
                    </div>
                    <div className="fact">
                      <span>Policy Chunks Retrieved</span>
                      <strong>{policyChunksRetrieved}</strong>
                    </div>
                    <div className="fact">
                      <span>Review Role</span>
                      <strong>{reviewRole}</strong>
                    </div>
                  </div>
                </div>

                <div className="two-col">
                  <div className="panel">
                    <h3>Customer Factors</h3>
                    <div className="list">
                      {result.customerFactors.map((item) => (
                        <div className="list-item" key={item}>
                          ✓ {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <h3>Missing Documentation</h3>
                    <div className="list">
                      {result.missingInformation.map((item) => (
                        <div className="list-item amber" key={item}>
                          □ {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <h3>Risk Flags</h3>
                  <div className="list">
                    {result.riskFlags.map((flag) => (
                      <div className="list-item red" key={flag}>
                        ⚠ {flag}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <h3>Policy Evidence</h3>
                  <div className="policy-grid">
                    {result.policyEvidence.map((evidence, index) => {
                      const similarity = getSimilarityScore(evidence.quote);
                      return (
                        <div className="policy-card" key={`${evidence.section}-${index}`}>
                          <div className="policy-card-head">
                            <strong>
                              {evidence.document} · {evidence.section}
                            </strong>
                            {similarity && <span className="badge badge-cyan">Similarity {similarity}</span>}
                          </div>
                          <p>“{evidence.quote}”</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="two-col">
                  <div className="panel">
                    <h3>Allowed Actions for {reviewRole}</h3>
                    <div className="action-row">
                      {roleActions.map((action) => (
                        <button className="action" key={action}>
                          {action}
                        </button>
                      ))}
                    </div>
                    <p className="footer-note">
                      AI-suggested actions are filtered by simulated workflow role.
                    </p>
                  </div>
                  <div className="panel">
                    <h3>Audit Trail</h3>
                    <div className="list">
                      <div className="list-item">Case opened by {reviewRole}.</div>
                      <div className="list-item">
                        AI review completed with {confidencePercent}% confidence.
                      </div>
                      <div className="list-item">
                        Retrieved {policyChunksRetrieved} policy evidence chunk(s).
                      </div>
                      <div className="list-item">
                        Review stored in Supabase ai_audit_log when database permissions allow.
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
            Demonstrates Supabase-backed pgvector RAG, Groq LLM decision support,
            human-in-the-loop review, policy evidence, auditability, and responsible AI controls.
          </p>
          <p className="footer-links">
            <a href={GITHUB_README_URL} target="_blank" rel="noreferrer">
              View GitHub README and architecture
            </a>
            <span>·</span>
            <a href="/audit">View AI Audit Dashboard</a>
          </p>
        </footer>
      </div>
    </main>
  );
}
