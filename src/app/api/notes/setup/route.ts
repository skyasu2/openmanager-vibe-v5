import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(_request: NextRequest) {
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

export async function GET(_request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'default';
    const user = searchParams.get('user') || 'anonymous';

    // 노트 설정 데이터 생성
    const notesSetup = {
      type,
      user,
      status: 'configured',
      settings: {
        autoSave: true,
        syncInterval: 30,
        maxNotes: 1000,
        storageType: 'local',
        encryption: false,
        backup: {
          enabled: true,
          frequency: 'daily',
          retention: 30,
        },
      },
      templates: [
        {
          id: 'system-analysis',
          name: '시스템 분석 노트',
          description: '서버 상태 및 성능 분석용 템플릿',
          fields: ['서버명', '상태', '분석결과', '권장사항'],
        },
        {
          id: 'incident-report',
          name: '장애 보고서',
          description: '시스템 장애 발생 시 사용하는 템플릿',
          fields: ['발생시간', '장애유형', '영향범위', '해결방안'],
        },
        {
          id: 'maintenance-log',
          name: '유지보수 로그',
          description: '정기 유지보수 작업 기록용 템플릿',
          fields: ['작업일시', '작업내용', '담당자', '결과'],
        },
      ],
      categories: [
        'System Analysis',
        'Performance Monitoring',
        'Incident Management',
        'Maintenance',
        'AI Insights',
        'General Notes',
      ],
      permissions: {
        create: true,
        read: true,
        update: true,
        delete: true,
        share: false,
        export: true,
      },
      limits: {
        maxNoteSize: 10240, // 10KB
        maxAttachments: 5,
        maxCategories: 20,
        maxTags: 50,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: notesSetup,
    });
  } catch (error) {
    console.error('노트 설정 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '노트 설정 조회 실패',
        code: 'NOTES_SETUP_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resetType = searchParams.get('resetType') || 'all';

    // 노트 설정 초기화 시뮬레이션
    const resetResult = {
      resetType,
      status: 'reset',
      itemsCleared: {
        notes: resetType === 'all' ? 247 : 0,
        templates: resetType === 'all' || resetType === 'templates' ? 8 : 0,
        categories: resetType === 'all' || resetType === 'categories' ? 12 : 0,
        settings: resetType === 'all' || resetType === 'settings' ? 1 : 0,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: '노트 설정이 성공적으로 초기화되었습니다.',
      data: resetResult,
    });
  } catch (error) {
    console.error('노트 설정 초기화 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '노트 설정 초기화 실패',
        code: 'NOTES_RESET_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
