# AISidebarV3 Deprecation Notice

**Date**: 2025-11-28
**Status**: Archived
**Replacement**: AISidebarV4

---

## Summary

AISidebarV3 has been archived and replaced by AISidebarV4, which uses Vercel AI SDK v5 with proper `@ai-sdk/react` integration.

---

## Why Deprecated?

1. **Vercel AI SDK v5 Migration**: V4 uses the official v5 pattern with `@ai-sdk/react` package
2. **Type Safety**: V4 removes `@ts-expect-error` workarounds and achieves 100% TypeScript strict mode compliance
3. **Modern API Pattern**: V4 uses the latest `useChat` hook with proper error handling
4. **Production Stability**: V4 has been tested and is production-ready

---

## Migration Path

### For Developers

**No action required** - AISidebarV4 is already the default in production.

### For Reference

If you need to understand the V3 implementation:
- Main component: `AISidebarV3.tsx` (archived here)
- Test file: `AISidebarV3.test.tsx` (archived here)

---

## Archived Files

```
archive/deprecated/ai-sidebar-v3/
├── AISidebarV3.tsx         # Main component (320 lines)
├── AISidebarV3.test.tsx    # Test file
└── DEPRECATION_NOTICE.md   # This file
```

---

## Key Differences: V3 vs V4

| Feature | V3 | V4 |
|---------|----|----|
| **AI SDK** | ai v4.x (broken) | @ai-sdk/react v1.2.12 ✅ |
| **Import** | `import { useChat } from 'ai'` ❌ | `import { useChat } from '@ai-sdk/react'` ✅ |
| **Type Safety** | `@ts-expect-error` workaround | 100% strict mode ✅ |
| **Build Warnings** | Yes (recurring) | None ✅ |
| **Runtime Stability** | useChat undefined | Fully functional ✅ |

---

## Timeline

- **2025-11-26**: Vercel AI SDK v5.0.0 breaking change detected
- **2025-11-27**: AISidebarV4 created with `@ai-sdk/react` integration
- **2025-11-27**: Build warnings resolved (0 warnings)
- **2025-11-28**: AISidebarV3 archived

---

## Related Documentation

- [AI System Status Report](/tmp/ai-system-status-report.md)
- [Vercel AI SDK v5 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0)
- [AISidebarV4 Source](/src/domains/ai-sidebar/components/AISidebarV4.tsx)

---

**Archived by**: Claude Code v2.0.37
**Last Updated**: 2025-11-28
