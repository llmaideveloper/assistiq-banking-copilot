import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../lib/supabaseServer';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('ai_audit_log')
      .select(
        'id, customer_id, question, answer, model_used, confidence, retrieved_document_ids, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load audit log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ audits: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Audit API failed',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
