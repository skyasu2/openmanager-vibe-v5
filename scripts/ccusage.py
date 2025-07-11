#!/usr/bin/env python3
"""
ccusage wrapper - Claude Code 토큰 사용량 확인 도구
"""
import subprocess
import sys

def main():
    print("🎯 Claude Code 토큰 사용량 확인 중...")
    print()
    
    # ccusage 실행
    try:
        subprocess.run(["npx", "ccusage@latest"], check=True)
    except subprocess.CalledProcessError:
        print("❌ ccusage 실행 중 오류가 발생했습니다.")
        return
    
    # 명령어 안내
    print()
    print("━" * 50)
    print("📚 추가 명령어 사용법")
    print("━" * 50)
    print()
    print("🔥 npx ccusage@latest blocks --live")
    print("   → 🆕 실시간 대시보드로 라이브 모니터링")
    print()
    print("📈 npx ccusage@latest blocks --active")
    print("   → 현재 과금 블록과 예상 사용량 확인")
    print()
    print("📊 npx ccusage@latest daily")
    print("   → 일별 사용량 세부 분석")
    print()
    print("💬 npx ccusage@latest session")
    print("   → 현재 세션 분석")
    print()
    print("━" * 50)
    print()
    print("💡 팁: 특정 날짜 범위 조회")
    print("   npx ccusage@latest blocks --since 20250701 --until 20250731")
    print()

if __name__ == "__main__":
    main()