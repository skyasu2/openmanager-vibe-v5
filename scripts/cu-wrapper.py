#!/usr/bin/env python3
"""
cu 명령어 - ccusage 명령어 안내
"""

from datetime import datetime

def show_header():
    """헤더 표시"""
    print("\n" + "="*70)
    print("🎯 Claude Code 사용량 모니터 (ccusage 명령어 안내)")
    print("="*70)

def show_ccusage_commands():
    """ccusage 명령어 목록 표시"""
    kst_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"🕒 현재 시간: {kst_time} KST\n")
    
    commands = [
        ("npx ccusage", "일별 사용량 (기본 실행)"),
        ("npx ccusage monthly", "월별 사용량 분석"),
        ("npx ccusage session", "세션별 사용량 분석"),
        ("npx ccusage blocks", "5시간 단위 블록 분석"),
        ("npx ccusage blocks --live", "실시간 모니터링 (v15+)")
    ]
    
    print("📚 사용 가능한 ccusage 명령어:")
    print("-" * 50)
    for cmd, desc in commands:
        print(f"  {cmd:<28} - {desc}")
    
    print("\n💡 추가 옵션:")
    print("  --active      현재 활성 블록만 표시")
    print("  --json        JSON 형태로 출력")
    print("  --since DATE  특정 날짜부터 (예: --since 20250701)")
    print("  --until DATE  특정 날짜까지 (예: --until 20250731)")
    
    print("\n🚀 사용 예시:")
    print("  npx ccusage blocks --active    # 현재 상태만 빠르게 확인")
    print("  npx ccusage blocks --live      # 실시간 모니터링 시작")
    print("  npx ccusage daily --json       # JSON 형태로 일별 데이터")

def main():
    show_header()
    show_ccusage_commands()

if __name__ == '__main__':
    main()