import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../lib/supabaseServer';

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
  dataSource: string;
  modelUsed: string;
};

function safeJsonParse(text: string): AiResponse | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function fallbackResponse(params: {
  customer: any;
  loans: any[];
  payments: any[];
  policyEvidence: PolicyEvidence[];
  question: string;
}): AiResponse {
  const maxDelinquency = Math.max(
    0,
    ...params.loans.map((loan) => Number(loan.delinquency_days || 0))
  );

  const riskBand = String(params.customer?.risk_band || 'unknown').toLowerCase();
  const employmentStatus = String(params.customer?.employment_status || 'unknown').toLowerCase();

  let recommendation = 'POSSIBLY_ELIGIBLE';
  const riskFlags: string[] = [];

  if (riskBand === 'high' || maxDelinquency >= 45) {
    recommendation = 'ESCALATE_FOR_REVIEW';
    riskFlags.push('High-risk profile or significant delinquency requires manager review.');
  } else if (riskBand === 'low' && maxDelinquency < 30) {
    recommendation = 'LIKELY_ELIGIBLE_FOR_REVIEW';
  } else {
    riskFlags.push('Manager review recommended because delinquency or risk level requires additional validation.');
  }

  if (maxDelinquency > 30) {
    riskFlags.push('Delinquency is greater than 30 days.');
  }

  if (employmentStatus.includes('reduced') || employmentStatus.includes('leave')) {
    riskFlags.push('Employment status indicates potential income disruption that requires documentation.');
  }

  return {
    recommendation,
    summary:
      'Supabase-backed decision-support review completed. Groq response was unavailable, so deterministic fallback logic was used.',
    confidence: recommendation === 'LIKELY_ELIGIBLE_FOR_REVIEW' ? 0.82 : 0.72,
    policyEvidence: params.policyEvidence,
    customerFactors: [
      `Customer: ${params.customer?.full_name || params.customer?.id}`,
      `Employment status: ${params.customer?.employment_status || 'unknown'}`,
      `Risk band: ${riskBand}`,
      `Credit score: ${params.customer?.credit_score || 'unknown'}`,
      `Income: ${params.customer?.income || 'unknown'}`,
      `Maximum delinquency days: ${maxDelinquency}`,
      `Loans reviewed: ${params.loans.length}`,
      `Payments reviewed: ${params.payments.length}`,
    ],
    missingInformation: [
      'Updated income verification',
      'Hardship reason documentation',
      'Customer consent for hardship review',
    ],
    riskFlags,
    allowedActions: [
      'Request documentation',
      'Create case note',
      'Escalate to manager',
    ],
    disclaimer:
      'This is AI decision support only. It must not approve or deny hardship assistance. Final review must be completed by an authorized bank employee.',
    dataSource: 'Supabase PostgreSQL + deterministic fallback',
    modelUsed: 'fallback-rules',
  };
}

function normalizeAiResponse(value: any, fallback: AiResponse): AiResponse {
  return {
    recommendation: String(value?.recommendation || fallback.recommendation),
    summary: String(value?.summary || fallback.summary),
    confidence:
      typeof value?.confidence === 'number'
        ? value.confidence
        : Number(value?.confidence || fallback.confidence),
    policyEvidence: Array.isArray(value?.policyEvidence)
      ? value.policyEvidence
      : fallback.policyEvidence,
    customerFactors: Array.isArray(value?.customerFactors)
      ? value.customerFactors
      : fallback.customerFactors,
    missingInformation: Array.isArray(value?.missingInformation)
      ? value.missingInformation
      : fallback.missingInformation,
    riskFlags: Array.isArray(value?.riskFlags) ? value.riskFlags : fallback.riskFlags,
    allowedActions: Array.isArray(value?.allowedActions)
      ? value.allowedActions
      : fallback.allowedActions,
    disclaimer: String(value?.disclaimer || fallback.disclaimer),
    dataSource: String(value?.dataSource || fallback.dataSource),
    modelUsed: String(value?.modelUsed || fallback.modelUsed),
  };
}

export async function POST(req: Request) {
  try {
    const { customerId = 'C1001', question = '' } = await req.json();

    const supabase = getSupabaseServerClient();

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: `Customer ${customerId} not found`, details: customerError?.message },
        { status: 404 }
      );
    }

    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (loansError) {
      return NextResponse.json(
        { error: 'Failed to load loans', details: loansError.message },
        { status: 500 }
      );
    }

    const loanIds = (loans || []).map((loan) => loan.id);

    let payments: any[] = [];

    if (loanIds.length > 0) {
      const { data: paymentRows, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('loan_id', loanIds)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        return NextResponse.json(
          { error: 'Failed to load payments', details: paymentsError.message },
          { status: 500 }
        );
      }

      payments = paymentRows || [];
    }

    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id, document_id, section, content')
      .limit(5);

    if (chunksError) {
      return NextResponse.json(
        { error: 'Failed to load policy evidence', details: chunksError.message },
        { status: 500 }
      );
    }

    const documentIds = Array.from(
      new Set((chunks || []).map((chunk) => chunk.document_id).filter(Boolean))
    );

    let policyDocs: any[] = [];

    if (documentIds.length > 0) {
      const { data: docs } = await supabase
        .from('policy_documents')
        .select('id, title, source_path')
        .in('id', documentIds);

      policyDocs = docs || [];
    }

    const policyEvidence: PolicyEvidence[] = (chunks || []).map((chunk) => {
      const doc = policyDocs.find((d) => d.id === chunk.document_id);

      return {
        document: doc?.title || chunk.document_id || 'policy-document',
        section: chunk.section || 'Policy Evidence',
        quote: chunk.content || '',
      };
    });

    const fallback = fallbackResponse({
      customer,
      loans: loans || [],
      payments,
      policyEvidence,
      question,
    });

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      fallback.summary =
        'Groq API key is not configured, so deterministic fallback logic was used with Supabase data.';
      return NextResponse.json(fallback);
    }

    const prompt = `
You are an AI decision-support assistant for a regulated banking hardship review workflow.

You must follow these rules:
- Do not approve or deny hardship assistance.
- Provide decision support only.
- Use the supplied customer, loan, payment, and policy evidence.
- Cite policy evidence in the policyEvidence array.
- Identify missing documentation.
- Identify risk flags.
- Recommend allowed next actions only.
- Final decision must require authorized human review.
- Keep the response concise and professional.
- Make the answer specific to the customer, loan/payment history, and the user's question.

Return ONLY valid JSON with this exact schema:
{
  "recommendation": "string",
  "summary": "string",
  "confidence": number,
  "policyEvidence": [
    {
      "document": "string",
      "section": "string",
      "quote": "string"
    }
  ],
  "customerFactors": ["string"],
  "missingInformation": ["string"],
  "riskFlags": ["string"],
  "allowedActions": ["string"],
  "disclaimer": "string",
  "dataSource": "string",
  "modelUsed": "string"
}

Customer:
${JSON.stringify(customer, null, 2)}

Loans:
${JSON.stringify(loans || [], null, 2)}

Payments:
${JSON.stringify(payments || [], null, 2)}

Policy evidence:
${JSON.stringify(policyEvidence, null, 2)}

User question:
${question}
`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a cautious banking AI assistant that returns only valid JSON for decision-support workflows.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();

      fallback.summary =
        `Groq call failed, so deterministic fallback was used. Groq error: ${errorText.slice(0, 180)}`;

      await supabase.from('ai_audit_log').insert({
        customer_id: customerId,
        question,
        answer: fallback,
        model_used: fallback.modelUsed,
        confidence: fallback.confidence,
        retrieved_document_ids: documentIds,
      });

      return NextResponse.json(fallback);
    }

    const groqJson = await groqResponse.json();
    const content = groqJson?.choices?.[0]?.message?.content || '';

    const parsed = safeJsonParse(content);
    const finalAnswer: AiResponse = normalizeAiResponse(parsed, fallback);

    finalAnswer.dataSource = 'Supabase PostgreSQL + Groq LLM';
    finalAnswer.modelUsed = 'llama-3.1-8b-instant';

    await supabase.from('ai_audit_log').insert({
      customer_id: customerId,
      question,
      answer: finalAnswer,
      model_used: finalAnswer.modelUsed,
      confidence: finalAnswer.confidence,
      retrieved_document_ids: documentIds,
    });

    return NextResponse.json(finalAnswer);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'AI review failed',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
