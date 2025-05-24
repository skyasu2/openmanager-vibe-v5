'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/styles/landing.module.css";

// 기능 아이템 타입 정의
interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

// 통계 아이템 타입 정의
interface StatItem {
  number: string;
  label: string;
}

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  // 페이지 로딩 애니메이션
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 주요 기능 데이터
  const features: FeatureItem[] = [
    {
      icon: "fas fa-chart-line",
      title: "실시간 모니터링",
      description: "서버 상태와 성능을 실시간으로 모니터링하고 분석합니다"
    },
    {
      icon: "fas fa-brain",
      title: "AI 기반 분석",
      description: "머신러닝을 활용한 지능형 이상 탐지 및 예측 분석"
    },
    {
      icon: "fas fa-bell",
      title: "스마트 알림",
      description: "중요한 이벤트를 즉시 감지하고 다중 채널로 알림 전송"
    },
    {
      icon: "fas fa-shield-alt",
      title: "보안 강화",
      description: "고급 보안 모니터링과 취약점 스캔으로 시스템 보호"
    },
    {
      icon: "fas fa-cog",
      title: "자동화",
      description: "반복적인 관리 작업을 자동화하여 운영 효율성 극대화"
    },
    {
      icon: "fas fa-cloud",
      title: "클라우드 통합",
      description: "AWS, Azure, GCP 등 주요 클라우드 플랫폼과 완벽 통합"
    }
  ];

  // 통계 데이터
  const stats: StatItem[] = [
    { number: "99.9%", label: "업타임 보장" },
    { number: "24/7", label: "모니터링" },
    { number: "1000+", label: "활성 서버" },
    { number: "5초", label: "응답 시간" }
  ];

  return (
    <div className={`${styles.splashContainer} ${isLoaded ? styles.fadeInUp : ''}`}>
      
      {/* 로고 섹션 */}
      <div className={`${styles.logoContainer} ${styles.fadeInUp}`}>
        <i className="fas fa-robot"></i>
      </div>

      {/* 메인 타이틀 */}
      <h1 className={`${styles.mainTitle} ${styles.fadeInUp}`}>
        OpenManager <span className={styles.highlight}>AI</span>
      </h1>

      {/* 부제목 */}
      <p className={`${styles.subtitle} ${styles.fadeInUp}`}>
        AI 기반 서버 모니터링과 관리를 통합한 차세대 서버 관리 솔루션
        <br />
        실시간 모니터링, 지능형 분석, 자동화된 관리로 서버 운영을 혁신합니다
      </p>

      {/* 통계 섹션 */}
      <div className={`${styles.statsGrid} ${styles.fadeInUp}`}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statNumber}>{stat.number}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 주요 기능 섹션 */}
      <div className={`${styles.featuresGrid} ${styles.fadeInUp}`}>
        {features.map((feature, index) => (
          <div key={index} className={`${styles.featureCard} ${styles.fadeInUp}`}>
            <div className={styles.featureIcon}>
              <i className={feature.icon}></i>
            </div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </div>

      {/* CTA 버튼 섹션 */}
      <div className={`${styles.ctaSection} ${styles.fadeInUp}`}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/demo" className={styles.btnPrimary}>
            <i className="fas fa-play"></i>
            실시간 AI 데모 체험
          </Link>
          <Link href="/dashboard" className={styles.btnPrimary} style={{ 
            background: 'linear-gradient(45deg, var(--secondary), var(--primary))',
            opacity: '0.9'
          }}>
            <i className="fas fa-arrow-right"></i>
            AI 대시보드 바로가기
          </Link>
        </div>
      </div>

      {/* 추가 정보 섹션 */}
      <div className={`${styles.featuresGrid} ${styles.fadeInUp}`} style={{marginTop: '4rem'}}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <i className="fas fa-rocket"></i>
          </div>
          <h3 className={styles.featureTitle}>빠른 배포</h3>
          <p className={styles.featureDescription}>
            5분 이내에 설치하고 즉시 모니터링을 시작할 수 있습니다
          </p>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <i className="fas fa-users"></i>
          </div>
          <h3 className={styles.featureTitle}>팀 협업</h3>
          <p className={styles.featureDescription}>
            역할 기반 접근 제어와 실시간 협업 도구를 제공합니다
          </p>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <i className="fas fa-mobile-alt"></i>
          </div>
          <h3 className={styles.featureTitle}>모바일 지원</h3>
          <p className={styles.featureDescription}>
            언제 어디서나 모바일 기기로 서버 상태를 확인하고 관리할 수 있습니다
          </p>
        </div>
      </div>

      {/* 푸터 정보 */}
      <div style={{
        marginTop: '3rem',
        padding: '2rem',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.9rem'
      }}>
        <p>
          © 2024 OpenManager AI. 모든 권리 보유. | 
          <Link href="/docs" style={{marginLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.9)'}}>
            문서
          </Link> | 
          <Link href="/support" style={{marginLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.9)'}}>
            지원
          </Link>
        </p>
      </div>
    </div>
  );
}
