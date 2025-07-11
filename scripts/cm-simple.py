#!/usr/bin/env python3
import subprocess
import json
from datetime import datetime

print("🎯 Claude Monitor - 토큰 사용량 확인")
print("=" * 45)

try:
    # ccusage 실행
    result = subprocess.run(['ccusage'], capture_output=True, text=True)
    data = json.loads(result.stdout)
    
    # 현재 활성 블록 찾기
    active_block = None
    for block in data.get('blocks', []):
        if block.get('isActive', False):
            active_block = block
            break
    
    if active_block:
        tokens = active_block.get('totalTokens', 0)
        burn_rate = active_block.get('burnRate', {}).get('tokensPerMinute', 0)
        
        # 시간 계산
        end_time = active_block.get('endTime', '')
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            now = datetime.now(end_dt.tzinfo)
            remaining = (end_dt - now).total_seconds() / 60
            hours = int(remaining // 60)
            minutes = int(remaining % 60)
            time_str = f"{hours}시간 {minutes}분" if hours > 0 else f"{minutes}분"
        else:
            time_str = "알 수 없음"
        
        print(f"\n📊 토큰 사용량: {tokens:,} / ~880,000")
        print(f"🔥 Burn Rate: {burn_rate:.1f} tokens/min")
        print(f"⏰ 리셋까지: {time_str}")
        print(f"\n💡 팁: Windows Terminal에서 'npm run cm' 실행 시")
        print("   색상과 진행률 바가 제대로 표시됩니다.")
    else:
        print("\n❌ 활성 세션을 찾을 수 없습니다.")
        
except Exception as e:
    print(f"\n❌ 오류 발생: {str(e)}")
    print("ccusage가 설치되어 있는지 확인하세요.")