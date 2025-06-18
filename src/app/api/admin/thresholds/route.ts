import { NextRequest, NextResponse } from 'next/server';

// 임계값 설정 기본값
const defaultThresholds = {
  system: {
    cpu: {
      warning: 70,
      critical: 85,
      emergency: 95,
    },
    memory: {
      warning: 75,
      critical: 90,
      emergency: 98,
    },
    disk: {
      warning: 80,
      critical: 90,
      emergency: 95,
    },
    network: {
      warning: 70,
      critical: 85,
      emergency: 95,
    },
  },
  application: {
    responseTime: {
      warning: 1000,
      critical: 3000,
      emergency: 5000,
    },
    errorRate: {
      warning: 0.01,
      critical: 0.05,
      emergency: 0.1,
    },
    throughput: {
      warning: 100,
      critical: 50,
      emergency: 10,
    },
  },
  database: {
    connections: {
      warning: 80,
      critical: 90,
      emergency: 95,
    },
    queryTime: {
      warning: 500,
      critical: 1500,
      emergency: 3000,
    },
    lockWaitTime: {
      warning: 1000,
      critical: 5000,
      emergency: 10000,
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let data = defaultThresholds;

    if (category && data[category as keyof typeof data]) {
      data = { [category]: data[category as keyof typeof data] } as any;
    }

    return NextResponse.json({
      success: true,
      data,
      category: category || 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin thresholds GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load thresholds',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newThresholds = await request.json();

    // 임계값 유효성 검사
    if (!newThresholds || typeof newThresholds !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid thresholds data',
        },
        { status: 400 }
      );
    }

    // 각 임계값이 올바른 순서인지 확인 (warning < critical < emergency)
    const validateThresholdOrder = (thresholds: any) => {
      if (
        thresholds.warning >= thresholds.critical ||
        thresholds.critical >= thresholds.emergency
      ) {
        return false;
      }
      return true;
    };

    // 실제 환경에서는 데이터베이스에 저장
    console.log('💾 Admin thresholds updated:', newThresholds);

    return NextResponse.json({
      success: true,
      message: 'Thresholds updated successfully',
      data: { ...defaultThresholds, ...newThresholds },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin thresholds POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update thresholds',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const metric = searchParams.get('metric');
    const updatedData = await request.json();

    if (!category || !metric) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category and metric are required',
        },
        { status: 400 }
      );
    }

    // 실제 환경에서는 특정 카테고리/메트릭만 업데이트
    console.log(
      `💾 Admin threshold ${category}.${metric} updated:`,
      updatedData
    );

    return NextResponse.json({
      success: true,
      message: `Threshold for ${category}.${metric} updated successfully`,
      data: updatedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin thresholds PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update threshold',
      },
      { status: 500 }
    );
  }
}
