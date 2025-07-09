#!/usr/bin/env python3
"""
🎯 Claude Code Usage Monitor - Enhanced Version
Seoul timezone, Professional UI, Real-time monitoring

Features:
- 🔋 Token Usage progress bar with percentage
- ⏰ Time to Reset countdown 
- 🎯 Current/Total tokens with remaining count
- 🔥 Burn rate calculation (tokens/min)
- 🔮 Predicted end time
- 🔄 Next token reset time
- Real-time status with smooth updates (every 3 seconds)
"""

import os
import sys
import time
import json
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

# Seoul timezone offset (UTC+9)
SEOUL_OFFSET = 9

class ClaudeCodeMonitor:
    def __init__(self, plan="auto", reset_hour=9):
        self.plan = plan
        self.reset_hour = reset_hour
        self.start_time = self.get_seoul_time()
        
        # Token limits by plan
        self.token_limits = {
            "pro": 7000,
            "max5": 35000,
            "max20": 140000,
            "custom_max": 200000  # Auto-detected high limit
        }
        
        # Reset times (Seoul timezone, 5-hour rolling window)
        self.reset_times = [4, 9, 14, 18, 23]  # 04:00, 09:00, 14:00, 18:00, 23:00
        
        # Session tracking
        self.session_data = {
            "tokens_used": 0,
            "start_time": self.start_time,
            "last_update": self.start_time,
            "burn_rate": 0.0,
            "predicted_end": None
        }
        
        # Visual elements
        self.progress_chars = ["█", "▉", "▊", "▋", "▌", "▍", "▎", "▏"]
        self.colors = {
            "green": "\033[92m",
            "yellow": "\033[93m", 
            "red": "\033[91m",
            "blue": "\033[94m",
            "purple": "\033[95m",
            "cyan": "\033[96m",
            "white": "\033[97m",
            "reset": "\033[0m",
            "bold": "\033[1m",
            "dim": "\033[2m"
        }

    def get_seoul_time(self):
        """Get current time in Seoul timezone"""
        from datetime import timezone
        utc_time = datetime.now(timezone.utc)
        seoul_time = utc_time + timedelta(hours=SEOUL_OFFSET)
        return seoul_time

    def detect_claude_plan(self) -> str:
        """Auto-detect Claude plan based on usage patterns"""
        current_tokens = self.estimate_session_tokens()
        
        if current_tokens > 35000:
            return "max20"
        elif current_tokens > 7000:
            return "max5"
        else:
            return "pro"

    def estimate_session_tokens(self) -> int:
        """Estimate tokens used in current session"""
        try:
            # Check Claude Code process memory usage as rough estimate
            ps_output = subprocess.check_output(['ps', 'aux'], text=True)
            claude_processes = [line for line in ps_output.split('\n') if 'claude' in line.lower()]
            
            # Rough calculation based on process count and time
            session_duration = (self.get_seoul_time() - self.start_time).total_seconds() / 60
            base_tokens = len(claude_processes) * 1000 + int(session_duration * 50)
            
            # Add estimated tokens from previous session data
            previous_data = self.load_session_data()
            if previous_data:
                base_tokens += previous_data.get('tokens_used', 0)
            
            return min(base_tokens, 200000)  # Cap at reasonable maximum
        except:
            # Fallback estimation
            session_duration = (self.get_seoul_time() - self.start_time).total_seconds() / 60
            return int(session_duration * 100)  # 100 tokens per minute base rate

    def get_next_reset_time(self) -> datetime:
        """Calculate next token reset time"""
        current_time = self.get_seoul_time()
        current_hour = current_time.hour
        
        # Find next reset hour
        next_reset_hour = None
        for reset_hour in self.reset_times:
            if reset_hour > current_hour:
                next_reset_hour = reset_hour
                break
        
        if next_reset_hour is None:
            # Next reset is tomorrow
            next_reset_hour = self.reset_times[0]
            next_reset = current_time.replace(hour=next_reset_hour, minute=0, second=0, microsecond=0) + timedelta(days=1)
        else:
            next_reset = current_time.replace(hour=next_reset_hour, minute=0, second=0, microsecond=0)
        
        return next_reset

    def calculate_burn_rate(self) -> float:
        """Calculate tokens per minute burn rate"""
        current_tokens = self.estimate_session_tokens()
        session_duration = (self.get_seoul_time() - self.start_time).total_seconds() / 60
        
        if session_duration > 0:
            return current_tokens / session_duration
        return 0.0

    def create_progress_bar(self, current: int, total: int, width: int = 30) -> str:
        """Create a visual progress bar"""
        if total == 0:
            percentage = 0
        else:
            percentage = min(current / total, 1.0)
        
        filled_width = int(percentage * width)
        
        # Color coding based on percentage
        if percentage < 0.7:
            color = self.colors["green"]
        elif percentage < 0.9:
            color = self.colors["yellow"]
        else:
            color = self.colors["red"]
        
        # Create the bar
        bar = color + "█" * filled_width + self.colors["dim"] + "░" * (width - filled_width) + self.colors["reset"]
        percentage_str = f"{percentage * 100:.1f}%"
        
        return f"{bar} {percentage_str}"

    def format_time_remaining(self, seconds: int) -> str:
        """Format time remaining in readable format"""
        if seconds <= 0:
            return "00:00:00"
        
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"

    def clear_screen(self):
        """Clear terminal screen"""
        os.system('clear' if os.name == 'posix' else 'cls')

    def display_header(self):
        """Display the monitor header"""
        seoul_time = self.get_seoul_time()
        
        print(f"{self.colors['bold']}{self.colors['cyan']}╔══════════════════════════════════════════════════════════════════════════════╗{self.colors['reset']}")
        print(f"{self.colors['bold']}{self.colors['cyan']}║                    🎯 Claude Code Usage Monitor v2.0                        ║{self.colors['reset']}")
        print(f"{self.colors['bold']}{self.colors['cyan']}║                          Seoul Time: {seoul_time.strftime('%Y-%m-%d %H:%M:%S KST'):>25}           ║{self.colors['reset']}")
        print(f"{self.colors['bold']}{self.colors['cyan']}╚══════════════════════════════════════════════════════════════════════════════╝{self.colors['reset']}")
        print()

    def display_token_usage(self, current_tokens: int, token_limit: int):
        """Display token usage with progress bar"""
        remaining_tokens = max(0, token_limit - current_tokens)
        progress_bar = self.create_progress_bar(current_tokens, token_limit, 40)
        
        print(f"{self.colors['bold']}🔋 Token Usage:{self.colors['reset']}")
        print(f"   {progress_bar}")
        print(f"   {self.colors['white']}Current: {current_tokens:,} | Total: {token_limit:,} | Remaining: {remaining_tokens:,}{self.colors['reset']}")
        print()

    def display_timing_info(self, burn_rate: float, next_reset: datetime):
        """Display timing and prediction information"""
        current_time = self.get_seoul_time()
        time_to_reset = int((next_reset - current_time).total_seconds())
        
        print(f"{self.colors['bold']}⏰ Timing Information:{self.colors['reset']}")
        print(f"   🔥 Burn Rate: {self.colors['yellow']}{burn_rate:.1f} tokens/min{self.colors['reset']}")
        print(f"   🔄 Next Reset: {self.colors['blue']}{next_reset.strftime('%H:%M:%S KST')}{self.colors['reset']}")
        print(f"   ⏱️  Time to Reset: {self.colors['green']}{self.format_time_remaining(time_to_reset)}{self.colors['reset']}")
        
        # Prediction
        if burn_rate > 0:
            current_tokens = self.estimate_session_tokens()
            token_limit = self.token_limits.get(self.detect_claude_plan(), 7000)
            remaining_tokens = max(0, token_limit - current_tokens)
            
            if remaining_tokens > 0:
                minutes_until_exhaustion = remaining_tokens / burn_rate
                predicted_end = current_time + timedelta(minutes=minutes_until_exhaustion)
                
                if minutes_until_exhaustion < (time_to_reset / 60):
                    color = self.colors['red']
                    warning = " ⚠️  WARNING: Will run out before reset!"
                else:
                    color = self.colors['green']
                    warning = " ✅ Safe until next reset"
                
                print(f"   🔮 Predicted End: {color}{predicted_end.strftime('%H:%M:%S KST')}{self.colors['reset']}{warning}")
        
        print()

    def display_session_info(self):
        """Display current session information"""
        session_duration = (self.get_seoul_time() - self.start_time).total_seconds() / 60
        
        print(f"{self.colors['bold']}📊 Session Information:{self.colors['reset']}")
        print(f"   📅 Started: {self.colors['cyan']}{self.start_time.strftime('%Y-%m-%d %H:%M:%S KST')}{self.colors['reset']}")
        print(f"   ⏳ Duration: {self.colors['purple']}{int(session_duration)} minutes{self.colors['reset']}")
        print(f"   🎯 Plan: {self.colors['yellow']}{self.detect_claude_plan().upper()}{self.colors['reset']}")
        print()

    def display_controls(self):
        """Display control information"""
        print(f"{self.colors['dim']}{'─' * 80}{self.colors['reset']}")
        print(f"{self.colors['dim']}Updates every 3 seconds | Press Ctrl+C to exit | Data refreshes automatically{self.colors['reset']}")

    def save_session_data(self):
        """Save current session data"""
        data = {
            "tokens_used": self.estimate_session_tokens(),
            "start_time": self.start_time.isoformat(),
            "last_update": self.get_seoul_time().isoformat(),
            "burn_rate": self.calculate_burn_rate(),
            "plan": self.detect_claude_plan()
        }
        
        try:
            with open('.claude_session.json', 'w') as f:
                json.dump(data, f, indent=2)
        except:
            pass  # Silently fail if can't save

    def load_session_data(self) -> Optional[Dict]:
        """Load previous session data"""
        try:
            with open('.claude_session.json', 'r') as f:
                return json.load(f)
        except:
            return None

    def run_monitor(self):
        """Main monitoring loop"""
        print(f"{self.colors['green']}🚀 Starting Claude Code Usage Monitor...{self.colors['reset']}")
        print(f"{self.colors['cyan']}📍 Timezone: Seoul (UTC+9){self.colors['reset']}")
        print(f"{self.colors['yellow']}🔄 Auto-detecting Claude plan...{self.colors['reset']}")
        time.sleep(2)
        
        try:
            while True:
                self.clear_screen()
                
                # Header
                self.display_header()
                
                # Detect current plan and get limits
                current_plan = self.detect_claude_plan()
                token_limit = self.token_limits[current_plan]
                current_tokens = self.estimate_session_tokens()
                
                # Token usage
                self.display_token_usage(current_tokens, token_limit)
                
                # Timing information
                burn_rate = self.calculate_burn_rate()
                next_reset = self.get_next_reset_time()
                self.display_timing_info(burn_rate, next_reset)
                
                # Session info
                self.display_session_info()
                
                # Controls
                self.display_controls()
                
                # Save data
                self.save_session_data()
                
                # Wait before next update
                time.sleep(3)
                
        except KeyboardInterrupt:
            print(f"\n\n{self.colors['yellow']}👋 Monitor stopped. Session data saved.{self.colors['reset']}")
            self.save_session_data()
            sys.exit(0)

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Claude Code Usage Monitor")
    parser.add_argument("--plan", choices=["pro", "max5", "max20", "custom_max", "auto"], 
                       default="auto", help="Claude plan type")
    parser.add_argument("--reset-hour", type=int, default=9, 
                       help="Preferred reset hour (Seoul time)")
    parser.add_argument("--timezone", default="Asia/Seoul", 
                       help="Timezone (currently only Seoul supported)")
    
    args = parser.parse_args()
    
    monitor = ClaudeCodeMonitor(plan=args.plan, reset_hour=args.reset_hour)
    monitor.run_monitor()

if __name__ == "__main__":
    main()