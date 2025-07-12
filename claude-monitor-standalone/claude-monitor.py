#!/usr/bin/env python3
"""
Claude Usage Monitor - WSL Optimized
한국어 지원이 포함된 Claude 사용량 모니터링 도구
"""

import os
import sys
import json
import time
import shutil
import subprocess
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

try:
    import pytz
except ImportError:
    print("⚠️  pytz 패키지가 필요합니다. 설치 중...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pytz"])
    import pytz

# 색상 코드 정의
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    GRAY = '\033[90m'
    
    # 배경색
    BG_RED = '\033[101m'
    BG_GREEN = '\033[102m'
    BG_YELLOW = '\033[103m'
    BG_BLUE = '\033[104m'

class ClaudeMonitor:
    def __init__(self, plan: str = "max20", timezone: str = "Asia/Seoul", no_clear: bool = False, compact: bool = False):
        self.plan = plan
        self.timezone = pytz.timezone(timezone)
        self.tz = pytz.timezone(timezone)
        self.no_clear = no_clear
        self.compact = compact
        
        # 플랜별 토큰 한도
        self.plan_limits = {
            "pro": 7_000,
            "max5": 35_000,
            "max20": 140_000,
            "custom_max": 200_000,
            "auto": None  # 자동 감지
        }
        
        # 리셋 시간 (5시간 윈도우)
        self.reset_hours = [4, 9, 14, 19, 0]  # KST 기준
        
        # WSL 경로 확인
        self.is_wsl = self._detect_wsl()
        if self.is_wsl:
            self._setup_wsl_environment()
    
    def _detect_wsl(self) -> bool:
        """WSL 환경 감지"""
        try:
            with open('/proc/version', 'r') as f:
                return 'microsoft' in f.read().lower()
        except:
            return False
    
    def _setup_wsl_environment(self):
        """WSL 환경 설정"""
        # 터미널 환경 최적화
        os.environ['TERM'] = 'xterm-256color'
        # Windows 경로 변환 지원
        self.windows_home = subprocess.getoutput("wslpath -w ~").strip()
    
    def get_usage_data(self) -> Dict:
        """ccusage blocks --json 명령어로 데이터 가져오기"""
        try:
            result = subprocess.run(
                ["ccusage", "blocks", "--json"],
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"{Colors.RED}❌ ccusage 데이터를 가져올 수 없습니다: {e}{Colors.RESET}")
            return {"blocks": []}
        except FileNotFoundError:
            print(f"{Colors.RED}❌ ccusage가 설치되어 있지 않습니다.{Colors.RESET}")
            print(f"{Colors.YELLOW}설치 명령어: npm install -g ccusage{Colors.RESET}")
            sys.exit(1)
    
    def get_active_session(self, data: Dict) -> Optional[Dict]:
        """현재 활성 세션 찾기"""
        for block in data.get("blocks", []):
            if block.get("isActive", False):
                return block
        return None
    
    def calculate_next_reset(self, session: Optional[Dict] = None) -> Tuple[datetime, timedelta]:
        """다음 리셋 시간 계산"""
        now = datetime.now(self.tz)
        
        # 세션 데이터에서 endTime 사용 (있으면)
        if session and session.get("endTime"):
            # UTC 시간을 KST로 변환
            end_time_str = session["endTime"].replace("Z", "+00:00")
            next_reset = datetime.fromisoformat(end_time_str).astimezone(self.tz)
        else:
            # 기존 로직 사용 (폴백)
            current_hour = now.hour
            
            # 다음 리셋 시간 찾기
            next_reset_hour = None
            for hour in sorted(self.reset_hours):
                if hour > current_hour:
                    next_reset_hour = hour
                    break
            
            if next_reset_hour is None:
                # 다음 날 첫 리셋 시간
                next_reset_hour = self.reset_hours[0]
                next_reset_date = now.date() + timedelta(days=1)
            else:
                next_reset_date = now.date()
            
            next_reset = self.tz.localize(
                datetime.combine(next_reset_date, datetime.min.time())
            ).replace(hour=next_reset_hour)
        
        time_to_reset = next_reset - now
        return next_reset, time_to_reset
    
    def format_time_remaining(self, td: timedelta) -> str:
        """남은 시간 포맷팅"""
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        else:
            return f"{minutes:02d}:{seconds:02d}"
    
    def get_progress_bar(self, current: int, total: int, width: int = 50) -> str:
        """진행률 바 생성"""
        if total == 0:
            return f"[{Colors.GRAY}{'░' * width}{Colors.RESET}]"
        
        percentage = min(current / total, 1.0)
        filled = int(width * percentage)
        
        # 색상 결정
        if percentage < 0.7:
            color = Colors.GREEN
        elif percentage < 0.9:
            color = Colors.YELLOW
        else:
            color = Colors.RED
        
        bar = f"{color}{'█' * filled}{Colors.GRAY}{'░' * (width - filled)}{Colors.RESET}"
        return f"[{bar}]"
    
    def format_number(self, num: float) -> str:
        """숫자 포맷팅 (천 단위 구분)"""
        return f"{num:,.0f}"
    
    def clear_screen(self):
        """화면 지우기"""
        if os.name == 'nt' or self.is_wsl:
            os.system('clear')
        else:
            print('\033[2J\033[H', end='')
    
    def display_monitor(self, session: Optional[Dict] = None):
        """모니터링 화면 표시"""
        self.clear_screen()  # 화면 지우기 (원래대로 복구)
        
        now = datetime.now(self.tz)
        
        if not session:
            print(f"{Colors.YELLOW}⚠️  활성 세션이 없습니다. Claude Code에서 대화를 시작하세요.{Colors.RESET}")
            return
        
        # Compact 모드: 최소한의 정보만 표시
        if self.compact:
            total_tokens = session.get("totalTokens", 0)
            token_limit = self.plan_limits.get(self.plan, 140_000)
            if self.plan == "auto" and session.get("projection"):
                token_limit = session["projection"].get("totalTokens", 140_000)
            
            remaining_tokens = token_limit - total_tokens
            usage_percentage = (total_tokens / token_limit) * 100 if token_limit > 0 else 0
            next_reset, time_to_reset = self.calculate_next_reset(session)
            
            # Burn Rate
            burn_rate = 0
            if session.get("burnRate"):
                burn_rate = session["burnRate"].get("tokensPerMinuteForIndicator", 
                                                   session["burnRate"].get("tokensPerMinute", 0))
            
            # 비용 정보
            cost_str = ""
            if session.get("costUSD"):
                cost_usd = session["costUSD"]
                cost_str = f" | 💰 ${cost_usd:.2f}"
            
            # 한 줄로 핵심 정보만 표시
            print(f"🎯 Claude 모니터 | {now.strftime('%H:%M:%S')} KST")
            print(f"📊 {self.format_number(total_tokens)}/{self.format_number(token_limit)} ({usage_percentage:.1f}%) | 🔥 {burn_rate:.1f} 토큰/분 | ⏱️  {self.format_time_remaining(time_to_reset)}{cost_str}")
            
            # 경고 메시지
            if session.get("projection") and session.get("burnRate"):
                remaining_minutes = session["projection"].get("remainingMinutes", 0)
                if remaining_minutes > 0:
                    predicted_end = now + timedelta(minutes=remaining_minutes)
                    if predicted_end < next_reset:
                        print(f"{Colors.RED}⚠️  토큰이 리셋 전에 소진될 예정입니다!{Colors.RESET}")
            return
        
        # 기존의 상세 모드
        # 현재 시간
        time_str = now.strftime("%Y-%m-%d %H:%M:%S KST")
        print(f"{Colors.GRAY}현재 시간: {time_str}{Colors.RESET}")
        print()
        
        # 토큰 사용량
        total_tokens = session.get("totalTokens", 0)
        token_limit = self.plan_limits.get(self.plan, 140_000)
        
        if self.plan == "auto" and session.get("projection"):
            # 자동 감지
            token_limit = session["projection"].get("totalTokens", 140_000)
        
        remaining_tokens = token_limit - total_tokens
        usage_percentage = (total_tokens / token_limit) * 100 if token_limit > 0 else 0
        
        # Input/Output 토큰 상세 정보
        input_tokens = 0
        output_tokens = 0
        if session.get("tokenCounts"):
            input_tokens = session["tokenCounts"].get("inputTokens", 0)
            output_tokens = session["tokenCounts"].get("outputTokens", 0)
        
        print(f"{Colors.BOLD}📊 토큰 사용량:{Colors.RESET}")
        print(f"   🟢 {self.get_progress_bar(total_tokens, token_limit, 40)} {usage_percentage:.1f}%")
        print(f"   현재: {self.format_number(total_tokens)} | "
              f"전체: {self.format_number(token_limit)} | "
              f"남은 토큰: {Colors.CYAN}{self.format_number(remaining_tokens)}{Colors.RESET}")
        
        # Input/Output 비율 표시
        if input_tokens > 0 or output_tokens > 0:
            print(f"   📥 Input: {self.format_number(input_tokens)} | "
                  f"📤 Output: {self.format_number(output_tokens)}")
        print()
        
        # 타이밍 정보
        next_reset, time_to_reset = self.calculate_next_reset(session)
        
        # Time to Reset 진행률 바 계산 (현재 세션 기준)
        start_time = datetime.fromisoformat(session["startTime"].replace("Z", "+00:00"))
        start_time = start_time.astimezone(self.tz)
        session_duration = now - start_time
        session_seconds = session_duration.total_seconds()
        
        # 5시간을 최대치로 하여 진행률 계산
        max_session_seconds = 5 * 60 * 60  # 5시간
        
        print(f"{Colors.BOLD}⏳ 리셋까지 남은 시간:{Colors.RESET}")
        print(f"   ⏰ {self.get_progress_bar(int(session_seconds), max_session_seconds, 40)} {self.format_time_remaining(time_to_reset)}")
        print()
        
        print(f"{Colors.BOLD}⏰ 시간 정보:{Colors.RESET}")
        
        # Burn Rate
        if session.get("burnRate"):
            # tokensPerMinuteForIndicator를 사용 (실제 소비되는 토큰만)
            burn_rate_actual = session["burnRate"].get("tokensPerMinuteForIndicator", 
                                               session["burnRate"].get("tokensPerMinute", 0))
            burn_rate_total = session["burnRate"].get("tokensPerMinute", 0)
            print(f"   🔥 소진율: {Colors.YELLOW}{burn_rate_actual:.1f}{Colors.RESET} 토큰/분 (실제)")
            print(f"   💾 캐시 포함: {Colors.GRAY}{self.format_number(burn_rate_total)}{Colors.RESET} 토큰/분")
        
        # 리셋 정보
        print(f"   🔄 다음 리셋: {next_reset.strftime('%H:%M:%S KST')}")
        print(f"   ⏱️  리셋까지: {self.format_time_remaining(time_to_reset)}")
        
        # 예상 종료 시간
        if session.get("projection") and session.get("burnRate"):
            remaining_minutes = session["projection"].get("remainingMinutes", 0)
            if remaining_minutes > 0:
                predicted_end = now + timedelta(minutes=remaining_minutes)
                print(f"   🔮 예상 종료: {predicted_end.strftime('%H:%M:%S KST')}", end="")
                
                # 리셋 전에 소진될지 확인
                if predicted_end < next_reset:
                    print(f" {Colors.RED}⚠️  경고: 리셋 전에 토큰이 소진될 예정!{Colors.RESET}")
                else:
                    print(f" {Colors.GREEN}✅ 다음 리셋까지 안전{Colors.RESET}")
        print()
        
        # 세션 정보
        print(f"{Colors.BOLD}📊 세션 정보:{Colors.RESET}")
        start_time = datetime.fromisoformat(session["startTime"].replace("Z", "+00:00"))
        start_time = start_time.astimezone(self.tz)
        duration = now - start_time
        duration_minutes = int(duration.total_seconds() / 60)
        
        print(f"   📅 시작: {start_time.strftime('%Y-%m-%d %H:%M:%S KST')}")
        print(f"   ⏳ 진행 시간: {duration_minutes}분")
        print(f"   🎯 요금제: {self.plan.upper()}")
        
        # 비용 정보
        if session.get("costUSD"):
            cost_usd = session["costUSD"]
            cost_krw = cost_usd * 1300  # 대략적인 환율
            print(f"   💰 비용: ${cost_usd:.2f} (₩{cost_krw:,.0f})")
        
        # WSL 정보
        if self.is_wsl:
            print(f"\n{Colors.GRAY}🐧 WSL에서 실행 중{Colors.RESET}")
    
    def run(self, continuous: bool = True):
        """모니터 실행"""
        try:
            while True:
                data = self.get_usage_data()
                session = self.get_active_session(data)
                self.display_monitor(session)
                
                if not continuous:
                    break
                
                print(f"\n{Colors.GRAY}종료하려면 Ctrl+C를 누르세요. 5초 후 새로고침...{Colors.RESET}", end='', flush=True)
                time.sleep(5)
        
        except KeyboardInterrupt:
            print(f"\n\n{Colors.GREEN}✅ Claude Monitor를 종료합니다.{Colors.RESET}")
            # 커서 표시 복구
            print('\033[?25h', end='')

def main():
    parser = argparse.ArgumentParser(
        description="Claude Code 사용량 모니터 - WSL 최적화 버전"
    )
    parser.add_argument(
        "--plan",
        choices=["pro", "max5", "max20", "custom_max", "auto"],
        default="max20",
        help="Claude 요금제 선택 (기본값: max20)"
    )
    parser.add_argument(
        "--timezone",
        default="Asia/Seoul",
        help="시간대 설정 (기본값: Asia/Seoul)"
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="한 번만 실행하고 종료"
    )
    parser.add_argument(
        "--no-clear",
        action="store_true",
        help="화면 지우기 비활성화 (이전 터미널 내용 유지)"
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        help="간결한 출력 모드 (Claude Code 접힘 방지)"
    )
    
    args = parser.parse_args()
    
    # Compact 모드가 아닐 때만 로고 표시
    if not args.compact:
        # 박스 없이 간단한 제목 표시
        print()
        print(f"{Colors.CYAN}{Colors.BOLD}🎯 Claude Code 사용량 모니터 v2.0{Colors.RESET}")
        print(f"{Colors.GRAY}WSL 최적화 버전{Colors.RESET}")
        print()
    
    monitor = ClaudeMonitor(plan=args.plan, timezone=args.timezone, no_clear=args.no_clear, compact=args.compact)
    monitor.run(continuous=not args.once)

if __name__ == "__main__":
    main()