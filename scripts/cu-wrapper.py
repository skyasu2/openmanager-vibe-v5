#!/usr/bin/env python3
"""
cu 명령어 - ccusage 기반 Claude 사용량 모니터링 도구
"""

import os
import sys
import subprocess
import argparse
from datetime import datetime

def show_header():
    """헤더 표시"""
    print("\n" + "="*70)
    print("🎯 Claude Code 사용량 모니터 (ccusage 기반)")
    print("="*70)

def show_commands():
    """명령어 사용법 표시"""
    commands = [
        ("cu", "명령어 목록 및 기본 정보 표시"),
        ("cu daily", "일별 사용량 상세 분석"),
        ("cu monthly", "월별 사용량 요약"),
        ("cu session", "현재 세션 정보"),
        ("cu blocks", "5시간 블록 단위 사용량"),
        ("cu live", "실시간 모니터링 (5초마다 갱신)"),
        ("cu status", "현재 활성 블록 및 예상 사용량"),
        ("cu help", "이 도움말 표시")
    ]
    
    print("\n📚 사용 가능한 명령어:")
    print("-" * 50)
    for cmd, desc in commands:
        print(f"  {cmd:<12} - {desc}")
    
    print("\n💡 팁:")
    print("  • 실시간 모니터링은 Ctrl+C로 종료할 수 있습니다")
    print("  • 모든 시간은 한국시간(KST) 기준입니다")
    print("  • 데이터는 Claude Code의 공식 ccusage를 사용합니다")

def run_ccusage_command(command_args):
    """ccusage 명령어 실행 (원본 출력 그대로)"""
    try:
        cmd = ['npx', 'ccusage@latest'] + command_args
        subprocess.run(cmd, check=True)
            
    except subprocess.CalledProcessError as e:
        print(f"❌ 명령어 실행 오류: {e}")
        print("💡 npm이 설치되어 있고 인터넷에 연결되어 있는지 확인하세요")
    except FileNotFoundError:
        print("❌ npx를 찾을 수 없습니다")
        print("💡 Node.js를 설치해주세요: https://nodejs.org/")
    except KeyboardInterrupt:
        print("\n\n✅ 종료합니다")

def run_daily():
    """일별 사용량 분석"""
    run_ccusage_command(['daily'])

def run_monthly():
    """월별 사용량 요약"""
    run_ccusage_command(['monthly'])

def run_session():
    """현재 세션 정보"""
    run_ccusage_command(['session'])

def run_blocks():
    """5시간 블록 단위 사용량"""
    run_ccusage_command(['blocks'])

def run_live():
    """실시간 모니터링"""
    run_ccusage_command(['blocks', '--live'])

def run_status():
    """현재 활성 상태"""
    run_ccusage_command(['blocks', '--active'])

def show_basic_info():
    """기본 정보 표시"""
    show_header()
    
    # 현재 시간 표시
    kst_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"🕒 현재 시간: {kst_time} KST\n")
    
    # ccusage 원본 출력 표시
    try:
        cmd = ['npx', 'ccusage@latest', 'blocks', '--active']
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print(result.stdout)
        else:
            print("❌ 상태 정보를 가져올 수 없습니다")
            
    except subprocess.TimeoutExpired:
        print("⏱️  응답 시간 초과 (네트워크 확인 필요)")
    except Exception as e:
        print(f"❌ 오류: {e}")
    
    show_commands()

def main():
    parser = argparse.ArgumentParser(
        description='cu - Claude Code 사용량 모니터링 도구',
        add_help=False  # 커스텀 help 사용
    )
    
    # 서브커맨드 설정
    subparsers = parser.add_subparsers(dest='command', help='사용 가능한 명령어')
    
    # 각 명령어 등록
    subparsers.add_parser('daily', help='일별 사용량 분석')
    subparsers.add_parser('monthly', help='월별 사용량 요약')  
    subparsers.add_parser('session', help='현재 세션 정보')
    subparsers.add_parser('blocks', help='5시간 블록 단위 사용량')
    subparsers.add_parser('live', help='실시간 모니터링')
    subparsers.add_parser('status', help='현재 활성 상태')
    subparsers.add_parser('help', help='도움말 표시')
    
    args = parser.parse_args()
    
    # 명령어에 따른 실행
    if args.command == 'daily':
        run_daily()
    elif args.command == 'monthly':
        run_monthly()
    elif args.command == 'session':
        run_session()
    elif args.command == 'blocks':
        run_blocks()
    elif args.command == 'live':
        run_live()
    elif args.command == 'status':
        run_status()
    elif args.command == 'help':
        show_header()
        show_commands()
    else:
        # 기본 동작: 정보 표시 + 명령어 안내
        show_basic_info()

if __name__ == '__main__':
    main()