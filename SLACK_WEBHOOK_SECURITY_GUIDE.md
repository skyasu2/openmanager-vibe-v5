# 🔐 Slack Webhook 보안 설정 가이드

## ⚠️ **긴급 보안 조치 완료**

하드코딩된 Slack Webhook URL이 GitHub에 노출되어 Slack에서 자동으로 리보크(제거)되었습니다.  
다음 단계를 통해 보안을 강화했습니다.

---

## 🛡️ **적용된 보안 조치**

### 1. **하드코딩된 URL 완전 제거**

- ✅ `src/stores/useNotificationStore.ts` - 기본 Webhook 제거
- ✅ `development/tests/integration/manual-integration-test.test.ts` - 환경변수 사용으로 변경
- ✅ `development/tests/integration/slack-integration.test.ts` - 환경변수 사용으로 변경
- ✅ `development/scripts/testing/env-setup.js` - URL 제거
- ✅ `development/scripts/testing/env-template.env` - URL 제거

### 2. **`.gitignore` 강화**

```gitignore
# Slack webhooks and sensitive URLs
slack-webhook-url.txt
webhook-urls.txt
*.webhook
*.slack
```

### 3. **환경변수 기반 로드**

모든 Slack 통신이 `process.env.SLACK_WEBHOOK_URL`을 사용하도록 수정완료

---

## 🔧 **새 Webhook URL 설정 방법**

### 1. **Slack에서 새 Webhook 생성**

1. Slack API 페이지 방문: <https://api.slack.com/apps>
2. 기존 앱 선택 또는 새 앱 생성
3. **"Incoming Webhooks"** 섹션 이동
4. 기존 URL **"Revoke"** (폐기)
5. **"Add New Webhook to Workspace"** 클릭
6. 채널 선택 후 **"Allow"**
7. 새로 생성된 Webhook URL 복사

### 2. **환경변수 설정**

#### **로컬 개발 환경**

`.env.local` 파일 생성/수정:

```bash
# 📢 Slack 알림 설정
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/NEW/WEBHOOK
SLACK_DEFAULT_CHANNEL=#server-alerts
SLACK_ENABLED=true
```

#### **Vercel 배포**

Vercel 대시보드에서 환경변수 설정:

```bash
SLACK_WEBHOOK_URL = https://hooks.slack.com/services/YOUR/NEW/WEBHOOK
SLACK_DEFAULT_CHANNEL = #server-alerts
SLACK_ENABLED = true
```

#### **GitHub Actions**

Repository Settings > Secrets and variables > Actions에서 설정:

```bash
SLACK_WEBHOOK_URL = https://hooks.slack.com/services/YOUR/NEW/WEBHOOK
```

---

## 🧪 **Webhook 연결 테스트**

### **1. cURL 테스트**

```bash
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"✅ OpenManager Vibe v5 Webhook 테스트 성공!"}' \
$SLACK_WEBHOOK_URL
```

### **2. 애플리케이션 테스트**

```bash
npm run test:slack
# 또는
npm run test:integration -- --grep "slack"
```

### **3. 수동 테스트**

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 확인
http://localhost:3000/api/test/slack
```

---

## 🚨 **보안 체크리스트**

### ✅ **완료된 보안 조치**

- [x] 모든 하드코딩된 Webhook URL 제거
- [x] 환경변수 기반 로드로 전환
- [x] `.gitignore`에 민감한 파일 패턴 추가
- [x] 테스트 코드에서 하드코딩된 URL 제거
- [x] 백업/설정 파일에서 URL 제거

### 🔄 **추가 필요 작업**

- [ ] Slack에서 **기존 Webhook URL 폐기**
- [ ] **새 Webhook URL 생성**
- [ ] **환경변수에 새 URL 설정**
- [ ] **연결 테스트 실행**
- [ ] **팀원들에게 새 설정 공유**

---

## 🔒 **향후 보안 가이드라인**

### **1. 민감한 정보 관리**

- ❌ **절대 금지**: 코드에 직접 하드코딩
- ❌ **절대 금지**: 설정 파일에 평문 저장
- ✅ **권장**: 환경변수 사용
- ✅ **권장**: 암호화된 시크릿 관리

### **2. Repository 보안**

```bash
# 민감한 정보 커밋 전 확인
git diff --cached | grep -i "hook"
git diff --cached | grep -i "webhook"
git diff --cached | grep -E "T[0-9A-Z]{10}/B[0-9A-Z]{10}/[a-zA-Z0-9]{24}"
```

### **3. 정기 보안 점검**

- 📅 **월 1회**: Webhook URL 로테이션
- 📅 **주 1회**: 환경변수 설정 점검
- 📅 **커밋 시**: 민감한 정보 누출 검사

---

## 🆘 **문제 해결**

### **Q: Webhook이 작동하지 않음**

```bash
# 1. 환경변수 확인
echo $SLACK_WEBHOOK_URL

# 2. Slack 설정 확인
curl -I $SLACK_WEBHOOK_URL

# 3. 로그 확인
npm run logs:slack
```

### **Q: 테스트 실패**

1. 새 Webhook URL 생성 확인
2. 환경변수 정확한 설정 확인
3. Slack 채널 권한 확인
4. 네트워크 연결 확인

---

## 📞 **지원**

문제 발생 시:

1. 🔍 로그 확인: `development/logs/`
2. 🧪 테스트 실행: `npm run validate:quick`
3. 📧 팀 내 보고: Slack `#dev-alerts` 채널

---

**⚡ 보안은 개발의 기본입니다. 항상 환경변수를 사용하세요!**
