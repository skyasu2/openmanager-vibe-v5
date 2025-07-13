# -*- coding: utf-8 -*-
# Gemini CLI Helper Functions for PowerShell
# Add to $PROFILE: . "D:\cursor\openmanager-vibe-v5\scripts\gemini-helpers.ps1"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Quick chat
function gc {
    param([string]$prompt)
    gemini -p $prompt
}

# Git diff review
function gd {
    param([string]$prompt = "Summarize code changes in 3 lines and point out potential issues")
    git diff | gemini -p $prompt
}

# File analysis
function gf {
    param(
        [string]$file,
        [string]$prompt = "Explain the core functionality and improvements of this code in Korean"
    )
    Get-Content $file | gemini -p $prompt
}

# Error message analysis
function ge {
    param([string]$error)
    echo $error | gemini -p "Explain the cause and solution of this error specifically"
}

# Usage check
function gs {
    gemini /stats
}

# Efficient compression
function gcomp {
    gemini /compress
    Write-Host "Conversation compressed - tokens saved" -ForegroundColor Green
}

# Daily report
function gemini-daily {
    Write-Host "Gemini CLI Daily Report" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    
    $stats = gemini /stats
    Write-Host $stats
    
    # Usage-based recommendations
    if ($stats -match "(\d+)/1000") {
        $used = [int]$matches[1]
        $remaining = 1000 - $used
        
        if ($used -gt 800) {
            Write-Host "`nWarning: Daily limit approaching ($remaining remaining)" -ForegroundColor Red
            Write-Host "Recommendation: Switch to Claude" -ForegroundColor Yellow
        } elseif ($used -gt 500) {
            Write-Host "`nNote: Over 50% used ($remaining remaining)" -ForegroundColor Yellow
            Write-Host "Recommendation: Focus on important tasks" -ForegroundColor Cyan
        } else {
            Write-Host "`nGood: Plenty remaining ($remaining remaining)" -ForegroundColor Green
        }
    }
}

Write-Host "Gemini helper functions loaded!" -ForegroundColor Green
Write-Host "Available commands: gc, gd, gf, ge, gs, gcomp, gemini-daily" -ForegroundColor Cyan