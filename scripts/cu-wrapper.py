#!/usr/bin/env python3
"""
cu 명령어 - 한글화된 Claude 모니터 + ccusage 정보
"""

import os
import sys
import subprocess
import json
import argparse
from datetime import datetime

def show_commands():
    """명령어 사용법 표시"""
    print("\n" + "="*60)
    print("📚 명령어 사용법:")
    print("  cu          - 현재 사용량 확인 (한글 모니터)")
    print("  cu --live   - 실시간 모니터링")
    print("  cu --usage  - ccusage 블록 정보만 표시")
    print("  cu --json   - JSON 형태로 데이터 표시")
    print("="*60)

def run_ccusage_info():
    """ccusage 정보 표시"""
    try:
        print("\n🔍 ccusage 정보:")
        print("-" * 40)
        
        # ccusage blocks --active 실행
        cmd = ['npx', 'ccusage@latest', 'blocks', '--active']
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(result.stdout)
        else:
            print("❌ ccusage 정보를 가져올 수 없습니다.")
            print(result.stderr)
    except Exception as e:
        print(f"❌ 오류: {e}")

def run_korean_monitor():
    """한글화된 Claude 모니터 실행"""
    try:
        # 한글 모니터를 한 번만 실행하도록 timeout 설정
        cmd = ['timeout', '3', 'python3', 'claude_monitor_korean.py', '--plan', 'max20', '--timezone', 'Asia/Seoul']
        subprocess.run(cmd, cwd=os.path.expanduser('~/Claude-Code-Usage-Monitor'))
    except Exception as e:
        print(f"❌ 한글 모니터 오류: {e}")

def main():
    parser = argparse.ArgumentParser(description='cu - Claude Usage 한글 모니터')
    parser.add_argument('--live', action='store_true', help='실시간 모니터링')
    parser.add_argument('--usage', action='store_true', help='ccusage 정보만 표시')
    parser.add_argument('--json', action='store_true', help='JSON 형태로 표시')
    
    args = parser.parse_args()
    
    if args.live:
        # 실시간 모니터링
        print("🎯 실시간 모니터링을 시작합니다. (Ctrl+C로 종료)")
        try:
            cmd = ['python3', 'claude_monitor_korean.py', '--plan', 'max20', '--timezone', 'Asia/Seoul']
            subprocess.run(cmd, cwd=os.path.expanduser('~/Claude-Code-Usage-Monitor'))
        except KeyboardInterrupt:
            print("\n✅ 모니터링을 종료합니다.")
    elif args.usage:
        # ccusage 정보만 표시
        run_ccusage_info()
        show_commands()
    elif args.json:
        # JSON 정보 표시
        try:
            cmd = ['npx', 'ccusage@latest', 'blocks', '--json', '--active']
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(result.stdout)
            else:
                print("❌ JSON 데이터를 가져올 수 없습니다.")
        except Exception as e:
            print(f"❌ 오류: {e}")
    else:
        # 기본 모드: 한글 모니터 + ccusage 정보 + 명령어 목록
        print("🎯 Claude 사용량 통합 모니터")
        print("="*60)
        
        # 한글 모니터 실행
        run_korean_monitor()
        
        # ccusage 정보 표시
        run_ccusage_info()
        
        # 명령어 목록 표시
        show_commands()

if __name__ == '__main__':
    main()