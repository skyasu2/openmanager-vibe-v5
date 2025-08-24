#!/usr/bin/env node
/**
 * Memory Monitor Script
 * Created based on Codex AI recommendations from 4-AI cross-validation
 * Monitors Node.js memory usage patterns and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MemoryMonitor {
  constructor() {
    this.startTime = Date.now();
    this.logFile = path.join(__dirname, '..', 'logs', 'memory-usage.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  getMemoryStats() {
    const memUsage = process.memoryUsage();
    const heapStats = require('v8').getHeapStatistics();
    
    return {
      timestamp: new Date().toISOString(),
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
      heapSizeLimit: Math.round(heapStats.heap_size_limit / 1024 / 1024 * 100) / 100, // MB
      heapUsagePercent: Math.round((memUsage.heapUsed / heapStats.heap_size_limit) * 100 * 100) / 100
    };
  }

  getSystemInfo() {
    try {
      const isWSL = fs.existsSync('/proc/version') && 
        fs.readFileSync('/proc/version', 'utf8').includes('microsoft');
      
      let totalMemory = 0;
      let freeMemory = 0;
      
      if (isWSL || process.platform === 'linux') {
        const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
        const totalMatch = meminfo.match(/MemTotal:\s+(\d+)\s+kB/);
        const availMatch = meminfo.match(/MemAvailable:\s+(\d+)\s+kB/);
        
        if (totalMatch) totalMemory = Math.round(parseInt(totalMatch[1]) / 1024); // MB
        if (availMatch) freeMemory = Math.round(parseInt(availMatch[1]) / 1024); // MB
      }
      
      return {
        platform: isWSL ? 'WSL' : process.platform,
        totalMemory,
        freeMemory,
        usedMemory: totalMemory - freeMemory,
        nodeVersion: process.version
      };
    } catch (error) {
      return {
        platform: process.platform,
        nodeVersion: process.version,
        error: 'Unable to read system memory info'
      };
    }
  }

  analyzeMemoryPattern() {
    const stats = this.getMemoryStats();
    const system = this.getSystemInfo();
    
    const recommendations = [];
    
    // Memory usage analysis based on 4-AI cross-validation findings
    if (stats.heapUsagePercent > 90) {
      recommendations.push('🚨 CRITICAL: Heap usage > 90%. Consider increasing --max-old-space-size');
    } else if (stats.heapUsagePercent > 70) {
      recommendations.push('⚠️  WARNING: Heap usage > 70%. Monitor for memory leaks');
    } else if (stats.heapUsagePercent < 20 && stats.heapSizeLimit > 4096) {
      recommendations.push('💡 INFO: Low heap usage. Consider reducing --max-old-space-size for efficiency');
    }
    
    // WSL-specific recommendations from Qwen AI analysis
    if (system.platform === 'WSL' && stats.heapSizeLimit > 6144) {
      recommendations.push('🐧 WSL: High heap limit detected. Ensure it aligns with actual usage patterns');
    }
    
    // Environment-specific recommendations from Gemini/Codex analysis
    if (stats.heapSizeLimit > 4096 && process.env.NODE_ENV === 'production') {
      recommendations.push('🚨 PROD WARNING: High heap limit in production environment');
    }
    
    return {
      stats,
      system,
      recommendations,
      analysis: {
        memoryEfficiency: stats.heapUsagePercent > 80 ? 'LOW' : stats.heapUsagePercent > 50 ? 'MEDIUM' : 'HIGH',
        recommendedHeapSize: this.calculateOptimalHeapSize(stats),
        riskLevel: this.assessRiskLevel(stats, system)
      }
    };
  }

  calculateOptimalHeapSize(stats) {
    // Algorithm based on Qwen AI mathematical model
    const currentUsage = stats.heapUsed;
    const safetyMargin = 1.5; // 50% buffer
    const optimalSize = Math.ceil(currentUsage * safetyMargin / 512) * 512; // Round to 512MB
    
    // Clamp between reasonable bounds
    return Math.max(1024, Math.min(8192, optimalSize));
  }

  assessRiskLevel(stats, system) {
    if (stats.heapUsagePercent > 90) return 'HIGH';
    if (stats.heapUsagePercent > 70) return 'MEDIUM';
    if (system.platform === 'WSL' && stats.heapSizeLimit > system.totalMemory * 0.5) return 'MEDIUM';
    return 'LOW';
  }

  logToFile(data) {
    const logEntry = `${data.stats.timestamp} | RSS: ${data.stats.rss}MB | Heap: ${data.stats.heapUsed}MB/${data.stats.heapTotal}MB (${data.stats.heapUsagePercent}%) | Limit: ${data.stats.heapSizeLimit}MB | Risk: ${data.analysis.riskLevel}\n`;
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.warn('Unable to write to log file:', error.message);
    }
  }

  displayReport(data) {
    console.log('\n🧠 Memory Monitor Report - 4-AI Cross-Validation Based');
    console.log('='.repeat(60));
    
    console.log('\n📊 Current Memory Usage:');
    console.log(`  RSS: ${data.stats.rss} MB`);
    console.log(`  Heap Used: ${data.stats.heapUsed} MB (${data.stats.heapUsagePercent}%)`);
    console.log(`  Heap Total: ${data.stats.heapTotal} MB`);
    console.log(`  Heap Limit: ${data.stats.heapSizeLimit} MB`);
    console.log(`  External: ${data.stats.external} MB`);
    
    console.log('\n💻 System Information:');
    console.log(`  Platform: ${data.system.platform}`);
    console.log(`  Node.js: ${data.system.nodeVersion}`);
    if (data.system.totalMemory) {
      console.log(`  System Memory: ${data.system.usedMemory}/${data.system.totalMemory} MB (${Math.round(data.system.usedMemory/data.system.totalMemory*100)}%)`);
    }
    
    console.log('\n🎯 Analysis:');
    console.log(`  Memory Efficiency: ${data.analysis.memoryEfficiency}`);
    console.log(`  Risk Level: ${data.analysis.riskLevel}`);
    console.log(`  Recommended Heap: ${data.analysis.recommendedHeapSize} MB`);
    
    if (data.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      data.recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    console.log('\n🔄 Usage Examples:');
    console.log('  Light usage: NODE_OPTIONS="--max-old-space-size=2048" npm run dev');
    console.log('  Standard:    NODE_OPTIONS="--max-old-space-size=4096" npm run dev');
    console.log('  Heavy tasks: NODE_OPTIONS="--max-old-space-size=8192" npm run dev');
    
    console.log(`\n📝 Log saved to: ${this.logFile}`);
    console.log('='.repeat(60));
  }

  run() {
    console.log('🚀 Starting Memory Monitor...');
    
    const data = this.analyzeMemoryPattern();
    this.logToFile(data);
    this.displayReport(data);
    
    // Optionally monitor continuously if --watch flag is provided
    if (process.argv.includes('--watch')) {
      console.log('\n👁️  Watching memory usage (Ctrl+C to stop)...');
      setInterval(() => {
        const data = this.analyzeMemoryPattern();
        this.logToFile(data);
        console.log(`${data.stats.timestamp} | Heap: ${data.stats.heapUsed}MB (${data.stats.heapUsagePercent}%) | Risk: ${data.analysis.riskLevel}`);
      }, 5000); // Log every 5 seconds
    }
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new MemoryMonitor();
  monitor.run();
}

module.exports = MemoryMonitor;