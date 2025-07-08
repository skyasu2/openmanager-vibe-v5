# ��� 배포 스크립트 가이드

## ��� 구조

```
scripts/
├── core/                       # 핵심 배포 스크립트
│   ├── deploy.sh              # 기본 배포 스크립트
│   └── verify-deployment.js   # 배포 검증 스크립트
├── utils/                     # 유틸리티 스크립트
│   ├── deploy-check.js        # 배포 상태 체크
│   ├── github-actions-debug.js # GitHub Actions 디버그
│   └── ci-recovery.sh         # CI/CD 복구
└── README.md                  # 이 파일
```

## ��� 권장 사용법

### **메인 배포 스크립트 (권장)**

```bash
# 크로스 플랫폼 배포 (Windows/Linux/Mac)
node ../../development/scripts/deploy-v5.21.0.mjs
```

### **개별 스크립트 사용**

```bash
# 기본 배포
./core/deploy.sh

# 배포 검증
node core/verify-deployment.js

# 배포 상태 체크
node utils/deploy-check.js

# CI/CD 복구
./utils/ci-recovery.sh
```

## ⚠️ 중요 사항

1. **메인 배포**: development/scripts/deploy-v5.21.0.mjs 사용 권장
2. **검증 전용**: 이 폴더의 스크립트들은 검증/디버그용
3. **환경 설정**: ../config/ 폴더의 설정 파일들 확인 필요

## ��� 관련 문서

- [배포 통합 가이드](../docs/deployment/배포_통합_가이드.md)
- [Vercel 설정](../config/vercel.json)
- [Render 설정](../config/render.yaml)
