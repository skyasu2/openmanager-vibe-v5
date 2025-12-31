# Documentation Review Process

> **최종 갱신**: 2025-12-31
> 문서 품질 유지를 위한 정기 리뷰 프로세스

---

## Review Schedule

| 주기 | 작업 | 담당 |
|------|------|------|
| **월 1회** | 문서 정확성 검토 | 개발팀 |
| **분기 1회** | 오래된 문서 아카이브 | 개발팀 |
| **릴리스 시** | CHANGELOG 업데이트 | 릴리스 담당자 |

---

## Monthly Review Checklist

```bash
# 1. 문서 수 확인
find docs -name "*.md" -not -path "*/archive/*" | wc -l

# 2. 깨진 링크 검사
grep -r "](\.\./" docs --include="*.md" | head -20

# 3. 오래된 버전 참조 확인
grep -rE "v5\.[0-9]+\.[0-9]+" docs --include="*.md" | grep -v "v5.83.x"

# 4. TODO/FIXME 확인
grep -r "TODO\|FIXME" docs --include="*.md"
```

---

## Archive Criteria

문서를 아카이브로 이동하는 기준:

1. **6개월 이상** 업데이트 없음
2. **더 이상 사용하지 않는** 기능/API 관련
3. **다른 문서로 통합**된 경우
4. **deprecated** 표시된 내용

---

## Quick Commands

```bash
# 문서 상태 확인
npm run docs:status    # (예정)

# 링크 검증
npm run docs:links     # (예정)
```

---

## Related

- [Documentation Standard](./documentation-standard.md)
- [DOCS-BASELINE](../../DOCS-BASELINE.md)
