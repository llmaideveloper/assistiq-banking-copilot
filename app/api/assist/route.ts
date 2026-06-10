export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const customerId = body.customerId || 'C1001';

  return Response.json({
    recommendation: 'POSSIBLY_ELIGIBLE',
    summary:
      'AI decision-support review completed using customer data and bank policy evidence.',
    confidence: 0.78,
    policyEvidence: [
      {
        document: 'hardship-policy',
        section: 'Eligibility',
        quote:
          'Customers may be reviewed for hardship assistance when they have a verified temporary income disruption, medical hardship, natural disaster impact, or documented family emergency.',
      },
      {
        document: 'hardship-policy',
        section: 'Required Documentation',
        quote:
          'The customer must provide income verification, hardship reason, current contact information, and consent for review.',
      },
      {
        document: 'hardship-policy',
        section: 'Restrictions',
        quote:
          'The AI assistant may not approve or deny hardship assistance. Final review must be completed by an authorized bank employee.',
      },
    ],
    customerFactors: [
      'Customer ID: ' + customerId,
      'Customer employment status: reduced_hours',
      'Customer risk band: medium',
      'Maximum delinquency days: 35',
    ],
    missingInformation: [
      'Updated income verification',
      'Hardship reason documentation',
    ],
    riskFlags: [
      'Manager review required because delinquency is greater than 30 days.',
    ],
    allowedActions: [
      'Request documentation',
      'Create case note',
      'Escalate to manager',
    ],
    disclaimer:
      'This is decision support only. Final approval requires authorized human review.',
  });
}
