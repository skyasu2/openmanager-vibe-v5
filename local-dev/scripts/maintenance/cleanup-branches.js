#!/usr/bin/env node

/**
 * 🧹 Git 브랜치 정리 스크립트
 * main 브랜치만 남기고 불필요한 브랜치들을 정리합니다.
 */

const { execSync } = require('child_process');

console.log('🧹 Git 브랜치 정리 시작...\n');

try {
  // 1. 원격 브랜치 정보 최신화
  console.log('📡 원격 브랜치 정보 업데이트 중...');
  execSync('git fetch --all --prune', { stdio: 'inherit' });
  
  // 2. 모든 브랜치 확인
  console.log('\n📋 현재 브랜치 상태 확인:');
  
  const localBranches = execSync('git branch', { encoding: 'utf8' })
    .split('\n')
    .map(b => b.trim().replace('*', '').trim())
    .filter(b => b);
  
  console.log('🏠 로컬 브랜치:', localBranches);
  
  const remoteBranches = execSync('git branch -r', { encoding: 'utf8' })
    .split('\n')
    .map(b => b.trim())
    .filter(b => b && !b.includes('HEAD'));
  
  console.log('🌐 원격 브랜치:', remoteBranches);
  
  // 3. Dependabot 브랜치 확인
  const dependabotBranches = remoteBranches.filter(b => b.includes('dependabot'));
  
  if (dependabotBranches.length > 0) {
    console.log('\n🤖 Dependabot 브랜치 발견:', dependabotBranches);
    
    console.log('\n🧹 Dependabot 브랜치 정리 중...');
    for (const branch of dependabotBranches) {
      const branchName = branch.replace('origin/', '');
      try {
        console.log(`  ❌ 삭제: ${branchName}`);
        
        // 원격 브랜치 삭제
        execSync(`git push origin --delete ${branchName}`, { stdio: 'inherit' });
        
      } catch (error) {
        console.log(`  ⚠️  삭제 실패: ${branchName} - ${error.message}`);
      }
    }
  }
  
  // 4. 로컬 브랜치 정리
  console.log('\n🏠 로컬 브랜치 정리...');
  const localToDelete = localBranches.filter(b => b !== 'main' && b !== 'master');
  
  if (localToDelete.length > 0) {
    for (const branch of localToDelete) {
      try {
        console.log(`  ❌ 로컬 브랜치 삭제: ${branch}`);
        execSync(`git branch -D ${branch}`, { stdio: 'inherit' });
      } catch (error) {
        console.log(`  ⚠️  삭제 실패: ${branch} - ${error.message}`);
      }
    }
  } else {
    console.log('  ✅ 정리할 로컬 브랜치 없음');
  }
  
  // 5. 원격 tracking 정리
  console.log('\n🔗 원격 추적 브랜치 정리...');
  try {
    execSync('git remote prune origin', { stdio: 'inherit' });
    console.log('  ✅ 원격 추적 브랜치 정리 완료');
  } catch (error) {
    console.log('  ⚠️  정리 실패:', error.message);
  }
  
  // 6. 최종 상태 확인
  console.log('\n📊 정리 후 브랜치 상태:');
  
  const finalLocal = execSync('git branch', { encoding: 'utf8' })
    .split('\n')
    .map(b => b.trim().replace('*', '').trim())
    .filter(b => b);
  
  console.log('🏠 로컬 브랜치:', finalLocal);
  
  const finalRemote = execSync('git branch -r', { encoding: 'utf8' })
    .split('\n')
    .map(b => b.trim())
    .filter(b => b && !b.includes('HEAD'));
  
  console.log('🌐 원격 브랜치:', finalRemote);
  
  console.log('\n✅ 브랜치 정리 완료!');
  console.log('🎯 main 브랜치만 유지되었습니다.');
  
} catch (error) {
  console.error('❌ 브랜치 정리 실패:', error.message);
  process.exit(1);
} 