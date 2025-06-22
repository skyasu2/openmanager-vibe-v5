import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        success: true,
        message: "AI 에이전트 관리자 로그 API"
    });
}
