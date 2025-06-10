import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 1. Notes 테이블 생성
    const createTableQuery = `
      -- Create the table
      CREATE TABLE IF NOT EXISTS notes (
        id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        title text NOT NULL,
        content text,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      
      -- Enable RLS
      ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
      
      -- Create public read policy
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'notes' 
          AND policyname = 'public can read notes'
        ) THEN
          CREATE POLICY "public can read notes"
          ON public.notes
          FOR SELECT TO anon
          USING (true);
        END IF;
      END $$;
      
      -- Create public insert policy for demo
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'notes' 
          AND policyname = 'public can insert notes'
        ) THEN
          CREATE POLICY "public can insert notes"
          ON public.notes
          FOR INSERT TO anon
          WITH CHECK (true);
        END IF;
      END $$;
    `;

    // SQL 실행
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      query: createTableQuery,
    });

    if (createError) {
      console.warn(
        'RPC exec_sql not available, trying direct table creation...'
      );

      // RPC 함수가 없다면 직접 테이블 생성 시도
      const { error: directError } = await supabaseAdmin
        .from('notes')
        .select('*')
        .limit(1);

      if (directError && directError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error:
              'Table creation requires direct SQL access. Please run the SQL in Supabase dashboard.',
            sql: createTableQuery,
          },
          { status: 400 }
        );
      }
    }

    // 2. 샘플 데이터 삽입
    const sampleNotes = [
      {
        title: 'Today I created a Supabase project.',
        content: 'This is my first note in the OpenManager Vibe v5 project.',
      },
      {
        title: 'I added some data and queried it from Next.js.',
        content:
          'The integration between Next.js and Supabase works perfectly!',
      },
      {
        title: 'It was awesome!',
        content:
          'OpenManager Vibe v5 now has full Supabase integration with notes functionality.',
      },
    ];

    // 기존 데이터 확인
    const { data: existingNotes, error: selectError } = await supabaseAdmin
      .from('notes')
      .select('id')
      .limit(1);

    if (selectError) {
      return NextResponse.json(
        {
          error: 'Failed to access notes table',
          details: selectError.message,
        },
        { status: 500 }
      );
    }

    // 데이터가 없다면 샘플 데이터 삽입
    if (!existingNotes || existingNotes.length === 0) {
      const { data: insertedNotes, error: insertError } = await supabaseAdmin
        .from('notes')
        .insert(sampleNotes)
        .select();

      if (insertError) {
        return NextResponse.json(
          {
            error: 'Failed to insert sample data',
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notes table setup completed with sample data',
        data: insertedNotes,
        tableCreated: true,
        sampleDataInserted: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notes table already exists with data',
      tableCreated: false,
      sampleDataInserted: false,
    });
  } catch (error) {
    console.error('Notes setup error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 테이블 상태 확인
    const { data: notes, error } = await supabaseAdmin
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        tableExists: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      tableExists: true,
      notesCount: notes.length,
      notes: notes,
    });
  } catch (error) {
    return NextResponse.json({
      tableExists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
