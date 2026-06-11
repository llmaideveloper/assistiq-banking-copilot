import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { createDeterministicEmbedding } from '../../../lib/embedding';

export async function POST(req: Request) {
  try {
    const { adminToken } = await req.json().catch(() => ({}));

    if (!process.env.RAG_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'RAG_ADMIN_TOKEN is not configured.' },
        { status: 500 }
      );
    }

    if (adminToken !== process.env.RAG_ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const vectorDimensions = Number(process.env.VECTOR_DIMENSIONS || 1536);

    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('id, section, content')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load document chunks', details: error.message },
        { status: 500 }
      );
    }

    let updated = 0;
    const failures: Array<{ id: string; error: string }> = [];

    for (const chunk of chunks || []) {
      const text = `${chunk.section || ''}\n${chunk.content || ''}`;
      const embedding = createDeterministicEmbedding(text, vectorDimensions);

      const { error: updateError } = await supabase
        .from('document_chunks')
        .update({ embedding })
        .eq('id', chunk.id);

      if (updateError) {
        failures.push({ id: chunk.id, error: updateError.message });
      } else {
        updated += 1;
      }
    }

    return NextResponse.json({
      status: 'completed',
      embeddingMode: 'deterministic-free-tier',
      vectorDimensions,
      chunksFound: chunks?.length || 0,
      chunksUpdated: updated,
      failures,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Embedding rebuild failed',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
