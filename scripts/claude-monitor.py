#!/usr/bin/env python3
"""
Claude Usage Monitor for Windows/macOS/Linux
Cross-platform token usage tracking for Claude Code
"""

import subprocess
import sys
import json
import argparse
from datetime import datetime
import os


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[96m'  # Cyan
    SUCCESS = '\033[92m'  # Green
    WARNING = '\033[93m'  # Yellow
    ERROR = '\033[91m'    # Red
    INFO = '\033[94m'     # Blue
    END = '\033[0m'       # Reset
    BOLD = '\033[1m'


def color_text(text, color):
    """Apply color to text if terminal supports it"""
    if sys.stdout.isatty():
        return f"{color}{text}{Colors.END}"
    return text


def clear_screen():
    """Clear terminal screen (cross-platform)"""
    os.system('cls' if os.name == 'nt' else 'clear')


def check_prerequisites():
    """Check if Node.js and npm are installed"""
    try:
        subprocess.run(['node', '--version'], capture_output=True, check=True)
        subprocess.run(['npm', '--version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(color_text("❌ Node.js is not installed!", Colors.ERROR))
        print("   Please install Node.js from https://nodejs.org/")
        return False


def run_ccusage(args):
    """Run ccusage with given arguments"""
    cmd = ['npx', 'ccusage@latest'] + args
    
    try:
        # For live mode, use direct subprocess call
        if '--live' in args:
            subprocess.run(cmd)
        else:
            # For other modes, capture and process output
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return result.stdout
    except subprocess.CalledProcessError as e:
        print(color_text(f"❌ Error running ccusage: {e}", Colors.ERROR))
        if e.stderr:
            print(e.stderr)
        return None


def show_quick_stats():
    """Show quick usage statistics"""
    print(color_text("\n📊 Claude Token Usage Summary", Colors.HEADER))
    print(color_text("=" * 50, Colors.HEADER))
    
    # Get active block data
    output = run_ccusage(['blocks', '--active', '--json'])
    if not output:
        return
    
    try:
        data = json.loads(output)
        blocks = data.get('blocks', [])
        
        if blocks:
            active_block = blocks[0]
            tokens = active_block.get('totalTokens', 0)
            max_tokens = 880000
            percentage = (tokens / max_tokens) * 100
            
            # Determine color based on usage
            if percentage > 80:
                usage_color = Colors.ERROR
            elif percentage > 60:
                usage_color = Colors.WARNING
            else:
                usage_color = Colors.SUCCESS
            
            print(f"\nActive Block:")
            print(f"  Tokens Used: {color_text(f'{tokens:,} / {max_tokens:,} ({percentage:.1f}%)', usage_color)}")
            
            # Calculate time remaining
            end_time_str = active_block.get('endTime', '')
            if end_time_str:
                end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                now = datetime.utcnow()
                remaining = end_time - now
                hours = int(remaining.total_seconds() // 3600)
                minutes = int((remaining.total_seconds() % 3600) // 60)
                
                print(f"  Time Remaining: {color_text(f'{hours}h {minutes}m', Colors.INFO)}")
            
            # Show burn rate
            burn_rate = active_block.get('burnRate', {})
            tokens_per_min = burn_rate.get('tokensPerMinute', 0)
            if tokens_per_min:
                print(f"  Burn Rate: {tokens_per_min:.0f} tokens/min")
        else:
            print(color_text("No active session found.", Colors.WARNING))
            
    except json.JSONDecodeError:
        print(color_text("Error parsing usage data", Colors.ERROR))
    
    print()


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Claude Usage Monitor - Track token usage for Claude Code',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                    # Show quick stats
  %(prog)s blocks --active    # Show active block
  %(prog)s blocks --live      # Live dashboard
  %(prog)s daily              # Daily breakdown
  %(prog)s session            # Current session stats
  
  %(prog)s blocks --since 20250701 --until 20250731
                              # Date range query
        """
    )
    
    parser.add_argument('command', nargs='?', default='blocks',
                        choices=['blocks', 'daily', 'session'],
                        help='Command to run (default: blocks)')
    
    parser.add_argument('--live', action='store_true',
                        help='Enable live dashboard mode')
    parser.add_argument('--active', action='store_true',
                        help='Show only active block')
    parser.add_argument('--breakdown', action='store_true',
                        help='Show detailed breakdown')
    parser.add_argument('--json', action='store_true',
                        help='Output in JSON format')
    parser.add_argument('--since', type=str,
                        help='Start date (YYYYMMDD)')
    parser.add_argument('--until', type=str,
                        help='End date (YYYYMMDD)')
    parser.add_argument('--no-stats', action='store_true',
                        help='Skip quick stats display')
    
    args = parser.parse_args()
    
    # Clear screen for better readability
    if not args.json and not args.no_stats:
        clear_screen()
    
    # Check prerequisites
    if not check_prerequisites():
        sys.exit(1)
    
    # Show header
    if not args.json:
        print(color_text("🤖 Claude Usage Monitor", Colors.HEADER + Colors.BOLD))
        print(color_text("=" * 50, Colors.HEADER))
    
    # Build ccusage arguments
    ccusage_args = [args.command]
    
    if args.live:
        ccusage_args.append('--live')
    if args.active:
        ccusage_args.append('--active')
    if args.breakdown:
        ccusage_args.append('--breakdown')
    if args.json:
        ccusage_args.append('--json')
    if args.since:
        ccusage_args.extend(['--since', args.since])
    if args.until:
        ccusage_args.extend(['--until', args.until])
    
    # Show quick stats first (unless disabled)
    if not args.json and not args.live and not args.no_stats:
        show_quick_stats()
    
    # Run ccusage
    if not args.no_stats or args.json or args.live:
        print(color_text("\n🚀 Running ccusage...", Colors.INFO))
        output = run_ccusage(ccusage_args)
        
        # Print output if not in live mode
        if output and not args.live:
            print(output)
    
    # Show tips
    if not args.json and not args.live:
        print(color_text("\n💡 Quick Commands:", Colors.INFO))
        print("  python claude-monitor.py --live        # Live dashboard")
        print("  python claude-monitor.py daily         # Daily breakdown")  
        print("  python claude-monitor.py session       # Current session")
        print("  python claude-monitor.py --help        # Show all options")
        print()


if __name__ == "__main__":
    main()