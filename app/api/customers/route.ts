import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../lib/supabaseServer';

type Loan = {
  id: string;
  customer_id: string;
  product_type: string | null;
  principal_balance: number | null;
  monthly_payment: number | null;
  delinquency_days: number | null;
  status: string | null;
};

type Customer = {
  id: string;
  full_name: string;
  income: number | null;
  employment_status: string | null;
  credit_score: number | null;
  risk_band: string | null;
};

function formatRisk(riskBand?: string | null) {
  if (!riskBand) return 'Unknown Risk';
  return `${riskBand.charAt(0).toUpperCase()}${riskBand.slice(1)} Risk`;
}

function statusFromLoans(loans: Loan[]) {
  const maxDelinquency = Math.max(0, ...loans.map((loan) => loan.delinquency_days || 0));

  if (maxDelinquency > 30) return 'Manager Review';
  if (maxDelinquency > 0) return 'Missing Docs';
  return 'Standard Review';
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, full_name, income, employment_status, credit_score, risk_band')
      .order('id', { ascending: true });

    if (customerError) {
      throw customerError;
    }

    const customerIds = (customers || []).map((customer: Customer) => customer.id);

    const { data: loans, error: loanError } = customerIds.length
      ? await supabase
          .from('loans')
          .select('id, customer_id, product_type, principal_balance, monthly_payment, delinquency_days, status')
          .in('customer_id', customerIds)
      : { data: [], error: null };

    if (loanError) {
      throw loanError;
    }

    const response = (customers || []).map((customer: Customer) => {
      const customerLoans = (loans || []).filter((loan: Loan) => loan.customer_id === customer.id);
      const maxDelinquency = Math.max(0, ...customerLoans.map((loan: Loan) => loan.delinquency_days || 0));

      return {
        id: customer.id,
        name: customer.full_name,
        income: customer.income,
        employmentStatus: customer.employment_status,
        creditScore: customer.credit_score,
        riskBand: customer.risk_band,
        riskLabel: formatRisk(customer.risk_band),
        status: statusFromLoans(customerLoans),
        maxDelinquencyDays: maxDelinquency,
        loanCount: customerLoans.length,
      };
    });

    return NextResponse.json({ customers: response });
  } catch (error: any) {
    console.error('Customers API error:', error);

    return NextResponse.json(
      {
        error: 'Unable to load customers from Supabase.',
        detail: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
