# Deployment Rules

## Version Management (Lock-Step)
Next.js Root와 Cloud Run AI Engine 버전이 `.versionrc`를 통해 자동 동기화됩니다.

```bash
npm run release:patch       # 버그 수정 (5.83.1 -> 5.83.2)
npm run release:minor       # 기능 추가 (5.83.1 -> 5.84.0)
git push --follow-tags      # 태그 푸시 -> 배포 트리거
```

## Deployment Targets

### Frontend (Vercel)
- **Trigger**: `git push` 시 자동 배포
- **Branch**: `main` → Production, 기타 → Preview
- **URL**: `openmanager-vibe-v5.vercel.app`

### AI Engine (Cloud Run)
- **Trigger**: Tag 생성 (`v5.xx.x`) 시 배포
- **Region**: `asia-northeast1` (Seoul)
- **URL**: Cloud Run Service URL

## Environment Variables
- Vercel: `.env.production` 기준
- Cloud Run: GCP Secret Manager 사용

## Rollback
- Vercel: 대시보드에서 이전 배포로 롤백
- Cloud Run: `gcloud run services update-traffic`
