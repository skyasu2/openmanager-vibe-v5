/**
 * 🧪 Slack Webhook 테스트 유틸리티
 * OpenManager Vibe v5 - 실제 Slack 알림 테스트
 */

export const testSlackWebhook = async (message = '🧪 테스트 메시지') => {
  const res = await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `🧪 ${message}` }),
  });
  if (!res.ok) throw new Error(`Slack 오류: ${res.status}`);
  return res.ok;
};
