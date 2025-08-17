# GCP VM Basic Control PowerShell Script
# GCP VM 인스턴스 기본 제어 도구 (gcloud CLI 기반)

param(
    [string]$action = "status",
    [string]$instance = "openmanager-vm",
    [string]$zone = "asia-northeast3-a",
    [string]$project = "openmanager-free-tier"
)

Write-Host "🚀 GCP VM Basic Control" -ForegroundColor Cyan
Write-Host "Instance: $instance" -ForegroundColor Yellow
Write-Host "Zone: $zone" -ForegroundColor Yellow
Write-Host "Project: $project" -ForegroundColor Yellow
Write-Host ""

switch ($action) {
    "start" {
        Write-Host "Starting VM instance..." -ForegroundColor Green
        gcloud compute instances start $instance --zone=$zone --project=$project
    }
    "stop" {
        Write-Host "Stopping VM instance..." -ForegroundColor Red
        gcloud compute instances stop $instance --zone=$zone --project=$project
    }
    "status" {
        Write-Host "Checking VM status..." -ForegroundColor Blue
        gcloud compute instances describe $instance --zone=$zone --project=$project --format="value(status)"
    }
    "ssh" {
        Write-Host "Connecting via SSH..." -ForegroundColor Magenta
        gcloud compute ssh $instance --zone=$zone --project=$project
    }
    default {
        Write-Host "Available actions: start, stop, status, ssh" -ForegroundColor White
    }
}