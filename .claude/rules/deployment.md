# Deployment Rules

## Version Management (Lock-Step)

Next.js Root와 Cloud Run AI Engine 버전이 `.versionrc`를 통해 자동 동기화됩니다.

```bash
npm run release:patch       # 버그 수정 (5.84.1 → 5.84.2)
npm run release:minor       # 기능 추가 (5.84.1 → 5.85.0)
npm run release:major       # 메이저 변경 (5.84.1 → 6.0.0)
npm run release:dry-run     # 릴리스 미리보기
git push --follow-tags      # 태그 푸시 → 배포 트리거
```

## Deployment Targets

### Frontend (Vercel)

| 항목 | 값 |
|------|-----|
| Trigger | `git push` 자동 배포 |
| Branch | `main` → Production |
| URL | `openmanager-vibe-v5.vercel.app` |

### AI Engine (Cloud Run)

| 항목 | 값 |
|------|-----|
| Trigger | Tag 생성 (`v5.xx.x`) 또는 수동 |
| Region | `asia-northeast1` (Seoul) |
| URL | `ai-engine-*.asia-northeast1.run.app` |
| Script | `cloud-run/ai-engine/deploy.sh` |

```bash
# Cloud Run 수동 배포
cd cloud-run/ai-engine
./deploy.sh
```

## Environment Variables

| 플랫폼 | 관리 방식 |
|--------|----------|
| Vercel | Vercel Dashboard / `.env.production` |
| Cloud Run | GCP Secret Manager |

## Health Check

```bash
# Vercel 상태 확인
curl https://openmanager-vibe-v5.vercel.app/api/health

# Cloud Run AI 상태 확인
curl https://ai-engine-*.run.app/health
```

## Rollback

### Vercel
- Dashboard → Deployments → 이전 배포 선택 → Promote to Production

### Cloud Run
```bash
# 이전 리비전으로 트래픽 전환
gcloud run services update-traffic ai-engine \
  --to-revisions=REVISION_NAME=100 \
  --region=asia-northeast1
```

## Checklist

배포 전 확인사항:
- [ ] `npm run validate:all` 통과
- [ ] `npm run test:e2e:critical` 통과
- [ ] CHANGELOG.md 업데이트
- [ ] 환경변수 동기화 확인

---

**See Also**: 상세 문서 → `docs/reference/architecture/infrastructure/deployment.md`
