# AssistIQ Banking Copilot

**AssistIQ Banking Copilot** is an AI-powered customer assistance review workspace built to demonstrate AI architecture, enterprise software engineering, responsible AI design, and human-in-the-loop decision support for a regulated banking environment.

This project was created as a portfolio and interview demonstration by **Jamshir Qureshi**.

The application simulates how a loan servicing or customer assistance team could use AI to review hardship support requests. The system does not approve or deny customers. Instead, it provides structured decision support with policy evidence, customer factors, missing documentation, risk flags, allowed next actions, and audit-friendly review guidance.

---

## Product Goal

AssistIQ is designed to help banking operations teams answer:

- Is the customer potentially eligible for hardship assistance?
- What policy evidence supports the recommendation?
- What documents are missing?
- What risk flags require manager review?
- What actions are allowed next?
- How can AI assist without replacing human decision-making?

The product demonstrates a practical AI workflow for regulated industries where explainability, auditability, and human review are required.

---

## Live Demo Architecture

The deployed demo uses a lightweight Next.js architecture so it can run online without requiring paid backend infrastructure.

```mermaid
flowchart TD
    A[User / Hiring Manager] --> B[Next.js Frontend UI]
    B --> C[Case Review Workspace]
    C --> D[Next.js API Route: /api/assist]
    D --> E[Demo Decision-Support Engine]
    E --> F[Policy Evidence Response]
    E --> G[Customer Factors]
    E --> H[Missing Documentation]
    E --> I[Risk Flags]
    E --> J[Allowed Actions]
    F --> K[AI Recommendation Card]
    G --> K
    H --> K
    I --> K
    J --> K
    K --> L[Human-in-the-Loop Review UI]
```

### Demo Deployment

```mermaid
flowchart LR
    A[GitHub Repository] --> B[Netlify Build]
    B --> C[Next.js App]
    C --> D[Next.js API Route]
    D --> E[Structured AI Review Response]
    C --> F[Public Portfolio Demo]
```

This demo version is intentionally simple to deploy and share. It showcases the product experience, workflow design, responsible AI patterns, and frontend/backend interaction using a Next.js API route.

---

## Enterprise Reference Architecture

The broader enterprise architecture for this solution would use a full backend, persistent database, policy retrieval layer, AI orchestration, and audit logging.

```mermaid
flowchart TD
    A[Bank Employee / Servicing Agent] --> B[Next.js Case Management UI]
    B --> C[API Gateway / Backend Service]

    C --> D[Authentication & Role-Based Access]
    D --> E[Agent / Manager Permissions]

    C --> F[Customer Profile Service]
    C --> G[Loan & Payment History Service]
    C --> H[Hardship Case Service]

    F --> I[(Operational Database)]
    G --> I
    H --> I

    C --> J[Policy Retrieval Layer]
    J --> K[(Policy Documents / Vector Store)]
    K --> L[RAG Evidence Retrieval]

    C --> M[AI Decision-Support Orchestrator]
    L --> M
    I --> M

    M --> N[Guardrails & Compliance Rules]
    N --> O[Recommendation]
    N --> P[Missing Documentation]
    N --> Q[Risk Flags]
    N --> R[Allowed Actions]
    N --> S[Policy Citations]

    O --> T[Human Review Workflow]
    P --> T
    Q --> T
    R --> T
    S --> T

    T --> U[Manager Escalation]
    T --> V[Case Notes]
    T --> W[Audit Log]

    W --> X[(Audit / Monitoring Store)]
```

---

## AI Architecture Concepts Demonstrated

This project demonstrates several AI architect and senior software engineering concepts:

- AI-assisted decision support for regulated financial workflows
- Human-in-the-loop design where AI cannot approve or deny cases
- Policy evidence and citation-based explainability
- Structured AI response contracts
- Customer, policy, risk, and workflow data modeling
- Missing-document detection
- Manager escalation workflow
- Audit-friendly interaction design
- Separation between demo deployment and enterprise production architecture
- Cloud-ready frontend deployment using Netlify
- Extensible backend architecture for future Spring Boot, Supabase, RAG, and LLM integration

---

## Responsible AI Design

AssistIQ is designed around responsible AI principles:

- The AI assistant provides recommendations only.
- Final approval must be completed by an authorized human reviewer.
- Policy evidence is shown with every recommendation.
- Missing information is clearly identified.
- Risk flags trigger manager review.
- Allowed actions are constrained to safe workflow steps.
- Audit trail messaging supports traceability.

---

## Technology Stack

### Current Demo Stack

- Next.js
- React
- TypeScript
- Next.js API Routes
- Netlify deployment
- GitHub source control

### Enterprise Reference Stack

- Next.js frontend
- Java Spring Boot backend
- Supabase PostgreSQL
- Supabase Auth
- pgvector / vector database
- Retrieval-Augmented Generation
- LLM orchestration layer
- Audit logging
- Role-based access control
- Monitoring and observability

---

## Local Run

```bash
npm install
npm run dev
```

Open the URL printed by Next.js, for example:

```text
http://192.168.252.2:3000
```

Click **Run AI Case Review**.

---

## Test API Directly

```bash
curl -X POST http://localhost:3000/api/assist \
  -H "Content-Type: application/json" \
  -d '{"customerId":"C1001","question":"Is this customer eligible for hardship payment plan?"}'
```

The response should include:

- `POSSIBLY_ELIGIBLE`
- confidence score
- policy evidence
- customer factors
- missing documentation
- risk flags
- allowed actions

---

## Netlify Deploy

Use these settings in Netlify:

- Base directory: leave blank if this repository root contains the Next.js app
- Build command: `npm run build`
- Publish directory: `.next`

The API route `/api/assist` will be handled by Netlify's Next.js support.

---

## Portfolio Positioning

This project is intended to demonstrate how I approach AI product architecture from both a technical and business workflow perspective. It shows how AI can be embedded into enterprise operations while preserving human accountability, policy compliance, auditability, and responsible decision-making.

**Built by Jamshir Qureshi**
