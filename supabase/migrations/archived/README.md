# Archived Migrations

이 폴더에는 더 이상 사용되지 않는 마이그레이션 파일들이 보관되어 있습니다.

## 보관된 파일 목록

| 파일명 | 생성 테이블 | 보관 사유 |
|--------|------------|----------|
| `20250807_create_hourly_server_states.sql` | hourly_server_states | 테스트 전용, 프로덕션 미사용 |
| `20251204_create_ml_training_results_table.sql` | ml_training_results | 코드 참조 없음 |
| `20251213_create_langgraph_checkpoints.sql` | langgraph_checkpoints | Cloud Run 메모리 기반으로 전환됨 |
| `20241213_langgraph_checkpoints.sql` | langgraph_checkpoints | 중복 마이그레이션 |
| `20251124_rate_limits_table.sql` | rate_limits | 메모리 기반 rate limiting으로 전환됨 |
| `20250116_create_template_backup_tables.sql` | template_backup_tables | 초기 설정용, 현재 불필요 |
| `20251017_create_portfolio_server_tables.sql` | portfolio_server_tables | fixed-24h-metrics로 대체됨 |
| `20251017_seed_portfolio_server_data.sql` | (시드 데이터) | portfolio_server_tables용 시드 데이터 |

## 분석 일자
2025-12-22

## 분석 방법
- 코드베이스 전체 `grep` 분석 (`supabase.from('table_name')` 패턴)
- 실제 테이블 참조 여부 확인

## 참고
- 테이블 정리 스크립트: `/scripts/supabase/cleanup-unused-tables.sql`
- 해당 테이블들은 Supabase 대시보드에서 수동으로 삭제해야 합니다
