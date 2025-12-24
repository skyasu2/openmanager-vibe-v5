# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [5.83.11](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.10...v5.83.11) (2025-12-24)


### ⚠ BREAKING CHANGES

* **ai:** Rust ML service removed entirely

## Removed
- `cloud-run/rust-inference/` - Entire Rust ML service (dead code)
- `src/lib/rust-ml-client.ts` - Vercel-side Rust client
- `cloud-run/ai-engine/src/lib/rust-ml-client.ts` - AI Engine client
- `src/lib/ai/monitoring/` - Duplicate TypeScript ML on Vercel
- `src/scripts/generate-rust-data.ts` - Data generation script
- `clusterLogPatternsTool` from analyst-agent.ts (unused tool)

## Updated
- `cloud-run/docker-compose.yml` - Removed rust-inference service
- Documentation updated to reflect TypeScript-only ML stack
- Fixed time window comments: 26h → 6h (actual implementation)

## ML Stack (TypeScript only)
- Location: `cloud-run/ai-engine/src/lib/ai/monitoring/`
- SimpleAnomalyDetector: 6-hour moving average + 2σ
- TrendPredictor: Linear regression

Total: -2,870 lines of dead code removed

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

### Features

* **ai:** add Promptfoo QA testing and LangFuse observability ([c3acb13](https://github.com/skyasu2/openmanager-vibe-v5/commit/c3acb135db7d5cc651f37279dea59e374fe2780c))


### Bug Fixes

* **ai:** integrate LangFuse callbacks with LangGraph supervisor ([7ce8fe9](https://github.com/skyasu2/openmanager-vibe-v5/commit/7ce8fe9ac59282e5a445e854bef1c44d422e8f4d))
* **ai:** restore analyst-agent tools after accidental truncation ([d13bbae](https://github.com/skyasu2/openmanager-vibe-v5/commit/d13bbaeca721eaad335cf7d4600820d0c7158d1c))
* **ai:** restore Data Stream Protocol for AI chat responses ([d1400f3](https://github.com/skyasu2/openmanager-vibe-v5/commit/d1400f3c250e1877e5c6981449f93ed0bfb35be8))
* **ai:** use TextStreamChatTransport for plain text streaming ([afaea36](https://github.com/skyasu2/openmanager-vibe-v5/commit/afaea36381c496d563a2c3292e4c66f59ac90d56))
* **lint:** resolve 9 lint issues in AI assistant code ([8746849](https://github.com/skyasu2/openmanager-vibe-v5/commit/874684932e5ea8ad75082e325fd5df996cea2da8))
* **supabase:** rename timestamp to recorded_at in get_metrics_window function ([c348f1b](https://github.com/skyasu2/openmanager-vibe-v5/commit/c348f1bbe05dd5a6bf8388e016a4ab0afba0e0e5))


* **ai:** remove Rust ML service and consolidate TypeScript ML ([d151dc8](https://github.com/skyasu2/openmanager-vibe-v5/commit/d151dc8fb37b85e5e3a71246c6b9fb18ff2509f7))

### [5.83.10](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.9...v5.83.10) (2025-12-23)


### Features

* **ai-engine:** implement 4 architecture improvements ([f82c1f9](https://github.com/skyasu2/openmanager-vibe-v5/commit/f82c1f911ad42ceae0de06d03d8b6ba146a64558))
* **ai-engine:** implement context compression system (Phase 1-3) ([6be161e](https://github.com/skyasu2/openmanager-vibe-v5/commit/6be161e9954ab0e3e19480f624476ce94cfb56de))
* **ai:** integrate context compression and sync anomaly detection ([9efb620](https://github.com/skyasu2/openmanager-vibe-v5/commit/9efb6202d6cba6fa107e486d2f844bca41d7cfd9))
* **ai:** optimize engine with Gemini 2.5 Flash-Lite, quotas, and architecture docs ([363e210](https://github.com/skyasu2/openmanager-vibe-v5/commit/363e2109f61f656ad58accfe9cfaf31f471523f7))
* **db:** add ai_jobs table migration for async job queue ([38b3496](https://github.com/skyasu2/openmanager-vibe-v5/commit/38b34968a1c75af21dd61cfaab3885f1bb571544))
* **hooks:** add WSL Limited Mode for pre-push validation ([ef085e2](https://github.com/skyasu2/openmanager-vibe-v5/commit/ef085e242a1ac0b7dc43d8e953f2899e0cf2bce0))
* **scripts:** add cumulative review for unreviewed commits (v6.12.0) ([bc1fdf4](https://github.com/skyasu2/openmanager-vibe-v5/commit/bc1fdf4281d10c8ae736138ed9c11331b86118d6))
* **scripts:** add human review tracker and change validation storage ([4813150](https://github.com/skyasu2/openmanager-vibe-v5/commit/481315048c46d22e8051dcb7a0d3e4d26bfc3b54))


### Bug Fixes

* **ai-engine:** address Codex review issues in context compression ([5af96d2](https://github.com/skyasu2/openmanager-vibe-v5/commit/5af96d2ca2d4305742c6b992617e4e2aaa42f484))
* **ai-engine:** use HumanMessage for Groq API compatibility ([5764c06](https://github.com/skyasu2/openmanager-vibe-v5/commit/5764c06a1501c333258db3d84005806aef2606be))
* **ai:** revert to DefaultChatTransport to fix protocol parsing ([e3ab409](https://github.com/skyasu2/openmanager-vibe-v5/commit/e3ab40967dd76684b7d509178650e5375f14c5d0))
* **ai:** TypeScript errors in stream parser and transport import ([8292442](https://github.com/skyasu2/openmanager-vibe-v5/commit/82924425063d015bfa1eff292c20cc652d403e84))
* **hooks:** swap WSL/Windows limited mode logic ([e842656](https://github.com/skyasu2/openmanager-vibe-v5/commit/e842656dfcdac4f365080652ef030f2efdf65f62))
* **scripts:** improve unreviewed commit detection in auto-ai-review (v6.13.0) ([b771a09](https://github.com/skyasu2/openmanager-vibe-v5/commit/b771a0993a2bc81c5da2a02ce14e0f5efee792d6))
* **skills:** update validation paths and script versions ([8a69c4e](https://github.com/skyasu2/openmanager-vibe-v5/commit/8a69c4e146baf64309b374a3cde4bd2909aec099))
* **stream:** add 'd:' and 'e:' prefix handling to Data Stream parser ([0358600](https://github.com/skyasu2/openmanager-vibe-v5/commit/0358600a437f4bd5f5c1c5b1bb0d8260bcf23242))
* **tooling:** add cross-platform Biome wrapper for WSL/Windows ([3ee4d59](https://github.com/skyasu2/openmanager-vibe-v5/commit/3ee4d59c4221bd8c21e25a58ea03fefc3e1d24f8))
* **ui:** revert ai transport to default ([e187efe](https://github.com/skyasu2/openmanager-vibe-v5/commit/e187efe82c13e2012b2d6010eff325c91b186c12))

### [5.83.9](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.8...v5.83.9) (2025-12-22)


### Features

* **api:** unified-stream 호환 프록시 및 마이그레이션 가이드 추가 ([0fb5346](https://github.com/skyasu2/openmanager-vibe-v5/commit/0fb5346bfc62e6364ec07af933acf5c2f0123d35))


### Bug Fixes

* **api:** Codex 리뷰 반영 - maxDuration 재수출 및 H1 일관성 수정 ([b63c392](https://github.com/skyasu2/openmanager-vibe-v5/commit/b63c3924ec593b7caaae775c9ec719daa6cef777))
* **cloud-run:** 환경변수 일관성 개선 및 시크릿 마운트 수정 ([88d3ad2](https://github.com/skyasu2/openmanager-vibe-v5/commit/88d3ad2c55732256e827926ee96b86d07b521cb0))
* **test:** MetricsProvider 테스트 개선 (Codex 리뷰 반영) ([c244487](https://github.com/skyasu2/openmanager-vibe-v5/commit/c24448758d3a45fc726892686964542fa7656612))

### [5.83.8](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.7...v5.83.8) (2025-12-21)


### Features

* **ai-ui:** add ChatGPT-style UX features to AI chat ([8fa0731](https://github.com/skyasu2/openmanager-vibe-v5/commit/8fa073190f0c3134b85422db91d57c936db397fa))
* **auth:** add Google OAuth login support ([b724c8b](https://github.com/skyasu2/openmanager-vibe-v5/commit/b724c8b7fbc8aa06ddeb0fbe403af6e7513f8fbb))
* **dashboard:** UI/UX 대대적 최적화 - 공간 효율성 향상 ([0bc85fe](https://github.com/skyasu2/openmanager-vibe-v5/commit/0bc85fee56ddba9e870c669a44793fd4f4b0ae28))
* **login:** 로그인 페이지 다크 슬레이트 디자인 적용 ([0488c82](https://github.com/skyasu2/openmanager-vibe-v5/commit/0488c82e6350e88f47d9d045ec103ee8e409c395))
* **rate-limit:** Cloud Run 무료 티어 최적화를 위한 일일 제한 추가 ([863cf20](https://github.com/skyasu2/openmanager-vibe-v5/commit/863cf201fe353cb27acb91ff536a84dcb9502a87))
* **rust-inference:** add feedback analysis API endpoints ([7ca161c](https://github.com/skyasu2/openmanager-vibe-v5/commit/7ca161c0438c5e781927d7147629c5c61311e37b))


### Bug Fixes

* **ai-tools:** nvm prefix 충돌 해소 로직 추가 ([2f9fca9](https://github.com/skyasu2/openmanager-vibe-v5/commit/2f9fca97671dd9fbe9f32bb691e723bab7d52e07))
* **dashboard:** Hydration 불일치 및 접근성 이슈 수정 ([1ac78ba](https://github.com/skyasu2/openmanager-vibe-v5/commit/1ac78baa818b351baf0e5735f6a7409365214c0b))
* **deps:** Biome Linux 전용 패키지를 devDependencies에서 제거 ([078923e](https://github.com/skyasu2/openmanager-vibe-v5/commit/078923ebcf47f92710b4b8ef627826ed7f4b6a5b))
* **EnhancedServerCard:** compact 모드 차트 레이아웃 개선 (4열→2열) ([f196c54](https://github.com/skyasu2/openmanager-vibe-v5/commit/f196c5406953573d9fd12f990d83ccef29ffbf7e))
* **modal:** 서버 상세 모달 콘텐츠 렌더링 버그 수정 ([8d7925f](https://github.com/skyasu2/openmanager-vibe-v5/commit/8d7925f0427e1248e59f6bd5575ed60778b3327f))
* **scripts:** 삭제된 subagent 스크립트 참조 제거 ([e076b16](https://github.com/skyasu2/openmanager-vibe-v5/commit/e076b16842f074ced36cbc1283c88f916c0e7ff0))
* **security:** improve API key masking in test scripts ([ac75cd6](https://github.com/skyasu2/openmanager-vibe-v5/commit/ac75cd6a50ebf9b81ca474d4a1f3841dde41bb3f))
* **security:** 테스트 파일 및 가짜 키 패턴 제외 ([578bae0](https://github.com/skyasu2/openmanager-vibe-v5/commit/578bae0ab5c4422f75daa9f2135ab6387bf39fde))
* **tests:** clean up failing tests and reorganize scripts ([156a9ce](https://github.com/skyasu2/openmanager-vibe-v5/commit/156a9ce2c23506252c736c0aea76f99d6a4c21bd))
* **test:** 테스트 키 길이 수정 및 스냅샷 업데이트 ([d3e10cc](https://github.com/skyasu2/openmanager-vibe-v5/commit/d3e10ccc6213f4d82d327ed41d14dffdc79c7ed5))
* **useSystemStart:** React 렌더링 규칙 준수하여 router.push 분리 ([77e98a1](https://github.com/skyasu2/openmanager-vibe-v5/commit/77e98a14fcea850bac74fa669f4eff3cab4d6f7b))

### [5.83.7](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.6...v5.83.7) (2025-12-19)


### Features

* **auth:** allow unauthenticated access to main page with login button ([fe72adc](https://github.com/skyasu2/openmanager-vibe-v5/commit/fe72adc5de130250156c183040795a8cb3360b00))
* **cloud-run:** add embedding and generate services to AI Engine ([21f37d1](https://github.com/skyasu2/openmanager-vibe-v5/commit/21f37d1ffdc9b4cef3a203f8a53a6414cd675f21))
* **proxy:** add automatic local Docker detection for development ([1fff5f8](https://github.com/skyasu2/openmanager-vibe-v5/commit/1fff5f8f799f2befac4af39a165f2bf23a53f0f1))
* **proxy:** improve local Docker priority in development mode ([819201e](https://github.com/skyasu2/openmanager-vibe-v5/commit/819201e4182cf103633347c91bfb2c72b1b21434))


### Bug Fixes

* **bootstrap:** prevent infinite polling loop in SystemBootstrap ([d427469](https://github.com/skyasu2/openmanager-vibe-v5/commit/d42746979481eebac1783f11d84b69bee2f32cd2))
* **dashboard:** correct invalid Tailwind CSS class w-22 to w-20 ([aa37bf5](https://github.com/skyasu2/openmanager-vibe-v5/commit/aa37bf583ea731896ccbc7cf1f3837c5afff11f7))
* **e2e:** update routing paths from /main to / in tests ([0adb64e](https://github.com/skyasu2/openmanager-vibe-v5/commit/0adb64e9b4ace26c0d3e422c7364fc5bae3f0815))
* **hydration:** resolve SSR/client HTML mismatch issues ([a6d5a61](https://github.com/skyasu2/openmanager-vibe-v5/commit/a6d5a61168b313fb98d6af19d0bab1f4fc54cc18))
* **routing:** update remaining /main references to / across codebase ([98eaa70](https://github.com/skyasu2/openmanager-vibe-v5/commit/98eaa707b4f0f6cb8c3000576b0291cdfe931f11))

### [5.83.6](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.5...v5.83.6) (2025-12-19)


### Features

* **docs:** generate Mermaid diagrams with mmdc CLI ([fedf33b](https://github.com/skyasu2/openmanager-vibe-v5/commit/fedf33bf8d43e81214c1b279d56ade83db28fe3f))
* implement Knowledge Externalization (Phase 1) ([638332c](https://github.com/skyasu2/openmanager-vibe-v5/commit/638332cb28981fa515de4564c05d271eacb68133))
* **rules:** implement Supabase integration (Phase 2) ([5faecd4](https://github.com/skyasu2/openmanager-vibe-v5/commit/5faecd4bb03978984f6e0963979694cc345ede6b))
* **skills:** add mermaid-diagram skill for architecture visualization ([142e263](https://github.com/skyasu2/openmanager-vibe-v5/commit/142e2634da729e0b4ee5d78dc3c0f2c48506924c))


### Bug Fixes

* **ai:** improve Reporter model type safety and add fallback ([e627c22](https://github.com/skyasu2/openmanager-vibe-v5/commit/e627c224c8296359eced78e5a00a9764ecdfc351))
* **docs:** correct broken documentation links ([e63e141](https://github.com/skyasu2/openmanager-vibe-v5/commit/e63e141bff2e77c9dd8fce77f39f1b2a8b4bd9e2))
* **e2e:** add waitFor to server card loading in guest test ([0ccaddc](https://github.com/skyasu2/openmanager-vibe-v5/commit/0ccaddc898460a443f3f4623a4fcc7b5f5ce1b95))
* **paths:** update remaining path references from docs reorganization ([69c0bb6](https://github.com/skyasu2/openmanager-vibe-v5/commit/69c0bb63bfaae8d3964351964c4325a18c83a355))
* remove unused imports and deprecated method ([1d1e7f6](https://github.com/skyasu2/openmanager-vibe-v5/commit/1d1e7f6d93e69a6a297a212a529dddf58eddc218))

### [5.83.5](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.4...v5.83.5) (2025-12-19)


### Features

* **auth:** add auth strategy utility for environment-based auth method ([51b41d4](https://github.com/skyasu2/openmanager-vibe-v5/commit/51b41d4a0e17057c45eb8a19f51a6e10544183bd))
* **claude-code:** add /review command and update skills ([ad41eef](https://github.com/skyasu2/openmanager-vibe-v5/commit/ad41eef17a9dbd7d2256fdd9efac24f6561de72d))
* **review:** add doc/test validation to AI review pipeline ([caaa2ab](https://github.com/skyasu2/openmanager-vibe-v5/commit/caaa2ab101d81bbbced0b6b9087f13604476bcf8)), closes [#5](https://github.com/skyasu2/openmanager-vibe-v5/issues/5)


### Bug Fixes

* **ai:** update Gemini models to 2.5 series for 2025 free tier ([72205ba](https://github.com/skyasu2/openmanager-vibe-v5/commit/72205ba6fd35ac2a6a221bb516f14856a8ba2393))
* **lint:** remove unused variables in dashboard-server-cards.spec.ts ([8c77dd3](https://github.com/skyasu2/openmanager-vibe-v5/commit/8c77dd382fab5537d7ccc6c9910d2c96f50fd090))
* **scripts:** update path reference to reports/planning ([d3c24eb](https://github.com/skyasu2/openmanager-vibe-v5/commit/d3c24eb91a0ce5df73a090ddf4c601bbcecc7a64))
* **skill:** improve playwright-triage script robustness ([b2257bc](https://github.com/skyasu2/openmanager-vibe-v5/commit/b2257bc6bf5978a51469e36266a593d818a73962))

### [5.83.4](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.3...v5.83.4) (2025-12-18)


### Features

* **rag:** add BM25 text search for hybrid Vector + Text + Graph RAG ([7f44d34](https://github.com/skyasu2/openmanager-vibe-v5/commit/7f44d34bc88048a5a54d4442f1d70179d0e1cf92))


### Bug Fixes

* **auth:** consume sessionStorage redirect target in OAuth callback ([67a7681](https://github.com/skyasu2/openmanager-vibe-v5/commit/67a7681c245e833f2dd26d982bb142e3d599347b))
* **auth:** enhance PKCE error handling and add RAG table compatibility ([b93482f](https://github.com/skyasu2/openmanager-vibe-v5/commit/b93482f18235686fe30b7f4d9ac94205c38a16ff))
* **auth:** resolve OAuth fetch error and guest login cookie issues ([b4e1286](https://github.com/skyasu2/openmanager-vibe-v5/commit/b4e1286da8d6b1c9c3af48f7c13b9d11814a5a01))
* **dashboard:** add SVG mini charts to compact mode server cards ([29281ab](https://github.com/skyasu2/openmanager-vibe-v5/commit/29281ab74bf7229684409a9c64dc838572276d25))
* **migration:** sync BM25 text search with deployed DB fixes ([a9e19d1](https://github.com/skyasu2/openmanager-vibe-v5/commit/a9e19d1b31ac3795ca70c8a8d8dabb94e8541085))
* **migration:** sync BM25 text search with deployed DB fixes ([d2c5888](https://github.com/skyasu2/openmanager-vibe-v5/commit/d2c5888648be4830c90d8f1f82a297bd8e66b90b))
* resolve code review issues from AI review ([6f917d5](https://github.com/skyasu2/openmanager-vibe-v5/commit/6f917d5c561ff216f0a57439261cef58a25ff4a0))

### [5.83.3](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.2...v5.83.3) (2025-12-17)


### Features

* **code-interpreter:** add browser-based Python execution ([24ce68c](https://github.com/skyasu2/openmanager-vibe-v5/commit/24ce68c34508fe9ccf653876d3a4cf98506f74f1))
* **rag:** implement GraphRAG hybrid search with knowledge graph ([c96e4dd](https://github.com/skyasu2/openmanager-vibe-v5/commit/c96e4dd785b80d439016c34698ddd511a10a819f))

### [5.83.2](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.1...v5.83.2) (2025-12-17)


### Features

* **ai:** add Circuit Breaker event system and AI management UI ([252b9c7](https://github.com/skyasu2/openmanager-vibe-v5/commit/252b9c7e435ad0864aa0d0de189d2663f2f3c757))
* improve metrics hook UX and add log analysis to NLQ agent ([e2ddebf](https://github.com/skyasu2/openmanager-vibe-v5/commit/e2ddebfd5a90bc23b54706631fa9ad3fdf0346cc))
* **review:** add small change filter to AI code review ([5005e8b](https://github.com/skyasu2/openmanager-vibe-v5/commit/5005e8b4b97378669268663a21d0b1c309648c09))


### Bug Fixes

* **cloud-run:** restore getPatternInsights helper function ([fcbd39c](https://github.com/skyasu2/openmanager-vibe-v5/commit/fcbd39c0c68fe94b486aaa558315dbfcf7ffa23e))
* **inspection:** resolve all issues from 2025-12-18 inspection ([bc04204](https://github.com/skyasu2/openmanager-vibe-v5/commit/bc04204f59631003465fba76bd0dfe20caad891d))

### [5.83.1](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.83.0...v5.83.1) (2025-12-17)


### Bug Fixes

* apply AI code review improvements ([e76e7f5](https://github.com/skyasu2/openmanager-vibe-v5/commit/e76e7f577338b7523bad1125a3da30ae19bf281e))
* remove duplicate .versionrc causing config conflict ([3432de2](https://github.com/skyasu2/openmanager-vibe-v5/commit/3432de254adf97289c14b61f6470e094f481d5bf))

## [5.83.0](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.82.0...v5.83.0) (2025-12-17)


### Features

* Add Jules CLI wrapper and Cloud Run AI engine deployment ([01fce0b](https://github.com/skyasu2/openmanager-vibe-v5/commit/01fce0b4f621fa296eab0314f43ecb2a280ff4f6))
* **ai:** add Cloud Run status indicator with warmup support ([57829ec](https://github.com/skyasu2/openmanager-vibe-v5/commit/57829ec6c1bcb55c5c350030f53fd5b48c464ec5))
* **ai:** Migrate AI engine to Google Cloud Run and update related docs ([b44f7f2](https://github.com/skyasu2/openmanager-vibe-v5/commit/b44f7f23be21d46718e4ff005d1df87dc5418401))
* **cloud-run:** add Rust ML inference service for LangGraph support ([6d3605d](https://github.com/skyasu2/openmanager-vibe-v5/commit/6d3605da9e39b3f950b0813e840fb085fdce1107))
* **hitl:** add shared types and approval-store tests ([ba95d33](https://github.com/skyasu2/openmanager-vibe-v5/commit/ba95d3357a6929af2f5894d365ff2192324ad078))
* **hitl:** implement SSE-based Human-in-the-Loop approval system ([194702a](https://github.com/skyasu2/openmanager-vibe-v5/commit/194702a1adf4c28dc9cd4434f066c28214ca816b))
* implement zero-internal-traffic architecture with supabase rag ([c46c091](https://github.com/skyasu2/openmanager-vibe-v5/commit/c46c0918b5ae76d4077e98b64e651f40abb22440))
* **infra:** migrate AI Engine to Cloud Run & integrate with Vercel ([0b23e9f](https://github.com/skyasu2/openmanager-vibe-v5/commit/0b23e9f9c3f5a0ccffe91a87c27ab703ef340c1d))
* **langgraph:** implement A2A communication patterns for multi-agent system ([cfe8df9](https://github.com/skyasu2/openmanager-vibe-v5/commit/cfe8df9f804fff7f3a0ef411fd1729a9ac3caf85))
* **langgraph:** integrate Rust ML service with TypeScript fallback ([584d9bd](https://github.com/skyasu2/openmanager-vibe-v5/commit/584d9bd68bfea4fa84f6c279d44298aaba4b69e2))
* optimize AI supervisor route and guest mode config ([3502bc3](https://github.com/skyasu2/openmanager-vibe-v5/commit/3502bc39210138ef8001b0c563b76a1041dbccde))
* **rag:** implement P1 knowledge base RAG for reporter agent ([0365bba](https://github.com/skyasu2/openmanager-vibe-v5/commit/0365bba6eea81cf887aab66538a7fa300f1ac872))
* **rust-ml:** add clustering endpoint and docker-compose setup ([8971708](https://github.com/skyasu2/openmanager-vibe-v5/commit/8971708367fd5e3b1694678b138ddbcb2432d5e1))
* **rust-ml:** deploy clustering endpoint to Cloud Run ([55e5011](https://github.com/skyasu2/openmanager-vibe-v5/commit/55e501124daab4d63e9d933784e059e86101f135))
* **session:** add session message limit (20) for free tier protection ([91743cc](https://github.com/skyasu2/openmanager-vibe-v5/commit/91743cc693335c0ef512b5a102e5a2e904e102c3))


### Bug Fixes

* **ai:** change streaming Content-Type to text/event-stream for AI SDK compatibility ([c1f4353](https://github.com/skyasu2/openmanager-vibe-v5/commit/c1f4353000b554f4b1e6e7f6a13ed109feefa819))
* **ai:** fix Accept header check for AI SDK v5 DefaultChatTransport ([be1a72d](https://github.com/skyasu2/openmanager-vibe-v5/commit/be1a72d5f3b4ff7b04de6301d0f998835e96c9f8))
* **ai:** implement AI SDK v5 Data Stream Protocol for streaming responses ([4cfe126](https://github.com/skyasu2/openmanager-vibe-v5/commit/4cfe1267da7042d77cde653b95c3b074818812c8))
* **ai:** implement AI SDK v5 Data Stream Protocol for streaming responses ([d68fa1c](https://github.com/skyasu2/openmanager-vibe-v5/commit/d68fa1cc703d611dafbb87a467cb74098ed14387))
* **ai:** Resolve remaining issues from AI engine migration ([3802f0d](https://github.com/skyasu2/openmanager-vibe-v5/commit/3802f0d513d2019519e507001dcc0980f4c7b182))
* **ai:** support AI SDK v5 UIMessage format in unified-stream API ([d18023c](https://github.com/skyasu2/openmanager-vibe-v5/commit/d18023cfb859c93fcb7c324b819f09c7763f9a29))
* **ai:** use GEMINI_API_KEY_PRIMARY for Vercel production compatibility ([dcc7546](https://github.com/skyasu2/openmanager-vibe-v5/commit/dcc75464440c644a2298d81fb23d5ac77343166c))
* Apply Biome lint fixes and line ending normalization ([4d11f56](https://github.com/skyasu2/openmanager-vibe-v5/commit/4d11f56ff3471b3dce6889aa6419171cc9a559d6))
* Clean up unused imports ([c4549c5](https://github.com/skyasu2/openmanager-vibe-v5/commit/c4549c58d99372f16e805edd210c8f717b6e1e48))
* Correct component props for MonitoringWorkflow and MonitoringResults ([fce6a72](https://github.com/skyasu2/openmanager-vibe-v5/commit/fce6a7215af24ee0d27dc8453309159eabf2574f))
* Correct IntelligentAnalysisRequest property name ([2472aa2](https://github.com/skyasu2/openmanager-vibe-v5/commit/2472aa251deeede2dde5d433e717bf816b73a838))
* **hitl:** resolve session ID mismatch between Frontend and Cloud Run ([cea5e01](https://github.com/skyasu2/openmanager-vibe-v5/commit/cea5e01d8e37138867a0647888a89d269cac8307))
* **langgraph:** add finish message on streaming error for AI SDK v5 protocol compliance ([4f159d4](https://github.com/skyasu2/openmanager-vibe-v5/commit/4f159d4a15c7aa191ec27fb1d0940e4e013da16d))
* **langgraph:** change supervisor model from Groq to Gemini ([2997cf3](https://github.com/skyasu2/openmanager-vibe-v5/commit/2997cf3853177040ffdbe20a7d417f7ef20f24ff))
* **langgraph:** support POSTGRES_URL_NON_POOLING for Vercel PostgreSQL ([a126390](https://github.com/skyasu2/openmanager-vibe-v5/commit/a126390116d9123360f84982210c838a64459c7d))
* **rag:** add error handling for Supabase client init (Codex review) ([405daac](https://github.com/skyasu2/openmanager-vibe-v5/commit/405daacfcc8d089176995bf79fb5e8ce9a0c8e78))
* Remove unused imports in AnalysisTab ([05752b6](https://github.com/skyasu2/openmanager-vibe-v5/commit/05752b63951d28640657d72613874a1f1ad9919e))
* Remove unused variables in AnalysisTab ([9ddb2aa](https://github.com/skyasu2/openmanager-vibe-v5/commit/9ddb2aabf6e71050c247736bf00659a58dbafbd0))
* Replace MonitoringWorkflow with simple button ([6accc48](https://github.com/skyasu2/openmanager-vibe-v5/commit/6accc4894cab8cd38acd3bb867c31cea343adfc9))
* Resolve TypeScript and lint warnings ([732d058](https://github.com/skyasu2/openmanager-vibe-v5/commit/732d0580a00a5a3c176e237a6b4d05b1218e23c4))
* resolve TypeScript build errors for Gemini 2.5 migration ([3ec952e](https://github.com/skyasu2/openmanager-vibe-v5/commit/3ec952e86f2fa651f87e1167daf1988c163b56f2))
* **rust-ml:** use get_mut for safe array access (Qwen review) ([33f86a8](https://github.com/skyasu2/openmanager-vibe-v5/commit/33f86a81f937772b84a82be7ab048afd2167cb22))
* Use correct IntelligentAnalysisRequest interface ([986a01e](https://github.com/skyasu2/openmanager-vibe-v5/commit/986a01e6a8b1bc135157b98fc6d68475acff449a))
* **vercel:** use absolute path for cloud-run ignore ([b5ceabc](https://github.com/skyasu2/openmanager-vibe-v5/commit/b5ceabc13a248661d4928b7f6b1eeda26ffa5831))
* **version:** sync API version to 5.82.0 and Next.js 16.0.10 ([7b72a9f](https://github.com/skyasu2/openmanager-vibe-v5/commit/7b72a9ff218c3ba31ce53af9519f89df1d137611))

## [5.82.0](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.81.0...v5.82.0) (2025-12-14)


### 🚀 Features

* **code-review:** add semantic version recommendation to AI review reports ([dcede29](https://github.com/skyasu2/openmanager-vibe-v5/commit/dcede290d5b7286892d8ae07b05e832d376e9b94))


### 📚 Documentation

* complete script consolidation Phase 3-4 (72% reduction) ([93cf1c0](https://github.com/skyasu2/openmanager-vibe-v5/commit/93cf1c0be52c3dd113b0e5b6b041a9507aab2449))


### 🐛 Bug Fixes

* **code-review:** add word boundary and colon to BREAKING pattern (v6.9.3) ([c66fc15](https://github.com/skyasu2/openmanager-vibe-v5/commit/c66fc154a32c81da1e1057a7b6ede1f7fbb7f11c))
* **code-review:** correct BREAKING change detection pattern (v6.9.2) ([84d2cf2](https://github.com/skyasu2/openmanager-vibe-v5/commit/84d2cf26d0d4a231658586426ca611221ae24428))


### ♻️ Refactoring

* **code-review:** remove version recommendation, add to CLAUDE.md (v7.2.0) ([1dad3ee](https://github.com/skyasu2/openmanager-vibe-v5/commit/1dad3eea53412f537265476f7dbe4838d3d29454))
* **code-review:** simplify version recommendation to one-line (v7.1.0) ([d2b9f80](https://github.com/skyasu2/openmanager-vibe-v5/commit/d2b9f80901822941ad5fddadee5ac9b152bc512e))

## [5.81.0](https://github.com/skyasu2/openmanager-vibe-v5/compare/v5.80.0...v5.81.0) (2025-12-14)


### 👷 CI/CD

* GitHub Actions를 Biome으로 마이그레이션 ([aa58862](https://github.com/skyasu2/openmanager-vibe-v5/commit/aa588626b1699a4fa96da9c20b9e687ce78d2363))
* Rollup binary 이슈 및 Lint 타임아웃 개선 ([d4fe99c](https://github.com/skyasu2/openmanager-vibe-v5/commit/d4fe99cc7029187f89dd1529eade415ae5b28838))


### ⚡ Performance

* **cache:** SWR 비활성화 - Vercel Function 호출 최적화 ([7eeaffa](https://github.com/skyasu2/openmanager-vibe-v5/commit/7eeaffa00f6d283b90e73cdc73fd58dcb4a965fd))
* **dashboard:** change EnhancedServerCard update interval to 5 minutes ([4d4304d](https://github.com/skyasu2/openmanager-vibe-v5/commit/4d4304dfbe6dbdb562db829cd375d46bf892e8a9))
* **health:** AI Health Check 최적화 (SSE 5분 주기 + 60초 캐싱) ([1963cc3](https://github.com/skyasu2/openmanager-vibe-v5/commit/1963cc3b0f9e3ef452783a1c768f794374eca735))
* **hooks:** optimize QUICK_PUSH mode to skip Biome lint ([e57bab8](https://github.com/skyasu2/openmanager-vibe-v5/commit/e57bab8c69db3d319dbdfbf904329a1f80076cd4))
* **hooks:** remove 5s wait in doc-validation & optimize pre-push ([78a83c0](https://github.com/skyasu2/openmanager-vibe-v5/commit/78a83c0c958a7e3533dce6006221ddf86924fcec))
* **hooks:** useResponsivePageSize에 debounce 적용 (150ms) ([c53d930](https://github.com/skyasu2/openmanager-vibe-v5/commit/c53d930c24863c7e0e3a1401c103698fdbcb3d9c))
* **lint:** optimize ESLint/lint-staged for WSL2 performance ([2236546](https://github.com/skyasu2/openmanager-vibe-v5/commit/2236546a10dbcfdfea91799d592cdad24eab00f7))
* Phase 4.1 bundle optimization complete - all pages < 500KB ([64f2e96](https://github.com/skyasu2/openmanager-vibe-v5/commit/64f2e96d149a40b6d5d425db39ab3e05fc012c70))
* prevent GuestMode excessive console logging ([e4f00e1](https://github.com/skyasu2/openmanager-vibe-v5/commit/e4f00e1b25eca6dcc50813a4d661f44483cfb95c))


### ✅ Testing

* **ai:** update AI engine tests for v4.0 UNIFIED mode ([eff9b94](https://github.com/skyasu2/openmanager-vibe-v5/commit/eff9b940bfd8d28a548575b3fe8e6f716c4c6f6c))
* **api:** update core-endpoints integration test ([f29380a](https://github.com/skyasu2/openmanager-vibe-v5/commit/f29380aac72aac0e1661574c3f7386112b4725a3))
* **components:** update component unit tests for React 19 ([2a1d2c2](https://github.com/skyasu2/openmanager-vibe-v5/commit/2a1d2c2e537912195ab221bd06a89c930c06b454))
* **e2e:** add comprehensive dashboard E2E tests (4 phases) ([763951f](https://github.com/skyasu2/openmanager-vibe-v5/commit/763951fe8548efeee840fb5a22f3aeef605b7d66))
* **e2e:** add Feature Cards comprehensive E2E tests ([5bca5e1](https://github.com/skyasu2/openmanager-vibe-v5/commit/5bca5e174f512aedd43ba2225a8c1fd060343cdf))
* **e2e:** add system-boot and error-boundary test suites ([cc42a42](https://github.com/skyasu2/openmanager-vibe-v5/commit/cc42a423e8908be1aed04047aad9f16e665acb0f))
* **e2e:** AI 사이드바 종합 검증 테스트 추가 ([e6b5b60](https://github.com/skyasu2/openmanager-vibe-v5/commit/e6b5b608b7b0f33349014ea2078550609d3b74e9))
* **e2e:** fix E2E test assertions and selectors ([eb5fa50](https://github.com/skyasu2/openmanager-vibe-v5/commit/eb5fa506f2deb77db36cf03556736a1ae6cd989c))
* **e2e:** fix Feature Cards test alignment with rendered data ([4333c05](https://github.com/skyasu2/openmanager-vibe-v5/commit/4333c05dcc5b0f53310556117176211022226b1e))
* **hooks/services:** update unit tests for state management refactor ([2b5b9c1](https://github.com/skyasu2/openmanager-vibe-v5/commit/2b5b9c13603a813bca4db1f442646ed6f890bb2b))
* **integration:** update integration tests for LangGraph API ([e23a69e](https://github.com/skyasu2/openmanager-vibe-v5/commit/e23a69e6ecf0d0f592bef41d5eadc137827f2ab8))
* reorganize and clean up test files ([a1e955d](https://github.com/skyasu2/openmanager-vibe-v5/commit/a1e955dd281540a099f9512711a39b756cef3930))
* update AI component test mocks ([6df0214](https://github.com/skyasu2/openmanager-vibe-v5/commit/6df0214d3c6c33dba90d9adfbc5d74264966c19e))
* update and reorganize unit tests ([790b4cd](https://github.com/skyasu2/openmanager-vibe-v5/commit/790b4cd8700a34665d16b651c0bd5e1a59207f18))
* **v4.0:** useAIEngine Hook 테스트 완전 재작성 (UNIFIED 전용) ([b2a1e44](https://github.com/skyasu2/openmanager-vibe-v5/commit/b2a1e44bb5309838144f181ffb81a7c0ada977c7))


### ♻️ Refactoring

* **agents:** optimize subagents for project stack (11→9) ([7e5a6d6](https://github.com/skyasu2/openmanager-vibe-v5/commit/7e5a6d6898b7fa537023c4fab59deffb5036088a))
* **ai-review:** v5.0.0 모듈화 구조로 리팩토링 (Codex 8/10→10/10) ([b1ddf56](https://github.com/skyasu2/openmanager-vibe-v5/commit/b1ddf56ef235a9e0721c256770d1d51c063818f3))
* **ai:** AI insights API 및 미사용 컴포넌트 정리 ([87aaab3](https://github.com/skyasu2/openmanager-vibe-v5/commit/87aaab3d1c230f95c9488da30ecfdf467434f121))
* **ai:** AIWorkspace v3.0.0 Unified Streaming + 레거시 정리 ([6ca2b12](https://github.com/skyasu2/openmanager-vibe-v5/commit/6ca2b127757b249e323ca3436e8ff946d7049cc2))
* **ai:** AIWorkspace 전체 리팩토링 완료 ([3bd07f6](https://github.com/skyasu2/openmanager-vibe-v5/commit/3bd07f66f5ef6e1a38bfa33e1ddda25dc05c9bb2)), closes [#1e1e1](https://github.com/skyasu2/openmanager-vibe-v5/issues/1e1e1)
* **ai:** archive deprecated AISidebarV3 component ([0c3ef3d](https://github.com/skyasu2/openmanager-vibe-v5/commit/0c3ef3db8216bec8b8e78b957255a2bf5f3befa0))
* **ai:** enhance interaction logging + biome fixes ([257c657](https://github.com/skyasu2/openmanager-vibe-v5/commit/257c6575450258e9f2d0022e4c592fda13fa5f17))
* **ai:** IntelligentMonitoringPage 컴포넌트 분할 및 최적화 ([96d591d](https://github.com/skyasu2/openmanager-vibe-v5/commit/96d591d5cc57b229f55f2e28dee8e877351db092))
* **ai:** optimize ai engine and gcp integration ([9fd88df](https://github.com/skyasu2/openmanager-vibe-v5/commit/9fd88df6b71bc001897c29dc4f01fe4867aa3203))
* **ai:** remove legacy AI services and routing engine ([63b4261](https://github.com/skyasu2/openmanager-vibe-v5/commit/63b42614a0795b41038ed82f29c6ce78e957099a))
* **api:** remove legacy ai apis (phase 21.1) ([f76ed20](https://github.com/skyasu2/openmanager-vibe-v5/commit/f76ed201d13c3827736f5079f149d3554f16ac8c))
* **api:** remove legacy ai apis (phase 21.1) ([4c0518f](https://github.com/skyasu2/openmanager-vibe-v5/commit/4c0518f2b662b9dfda7d496f5caf6fbb40b9bd6e))
* **api:** remove unused ServerStatus import and SupabaseServer interface ([bc6ee1a](https://github.com/skyasu2/openmanager-vibe-v5/commit/bc6ee1af103db18743eb85d3486cb572dfa72abc))
* **archive:** Remove archive reference to ensure independence ([a9ec6f0](https://github.com/skyasu2/openmanager-vibe-v5/commit/a9ec6f0fd65af6823be66636f70dffe368ff47cf))
* **biome:** enforce noExplicitAny in src/, fix all lint errors ([d122a79](https://github.com/skyasu2/openmanager-vibe-v5/commit/d122a794420c27732b8f44536a74a017f166f6a2))
* **biome:** resolve 9 actionable warnings (17→8) ([60f5a39](https://github.com/skyasu2/openmanager-vibe-v5/commit/60f5a39b61f71f467382defe631afac71316d930))
* **boot:** 순수 타이머 기반 로딩으로 단순화 ([2fb84a8](https://github.com/skyasu2/openmanager-vibe-v5/commit/2fb84a8392f74f0f97995471b5bab7711e3d1932))
* **ci:** Gemini AI 리뷰 제안 반영 - 성능 및 가독성 개선 ([4488247](https://github.com/skyasu2/openmanager-vibe-v5/commit/44882473d999edb14c13f4bf273d3eb3c4c22c3d))
* clean up code and update documentation ([dc1b875](https://github.com/skyasu2/openmanager-vibe-v5/commit/dc1b8756652592a7c929d7acd189318375f4793e))
* cleanup legacy code and redundant types ([421854c](https://github.com/skyasu2/openmanager-vibe-v5/commit/421854c2bd72dfb449c6bf72fa80280fa67d0ece))
* cleanup packages, remove eslint, and sync docs ([2d8c8bb](https://github.com/skyasu2/openmanager-vibe-v5/commit/2d8c8bb54881179bc0e371f727f67937263ae474))
* **cleanup:** delete 21 unused component/hook files (~4700 lines) ([6d0e826](https://github.com/skyasu2/openmanager-vibe-v5/commit/6d0e8264bb0a73a46ea2b3806bf259fb844d0d9f))
* **cleanup:** remove 15 unused AI components and duplicate pages ([071b206](https://github.com/skyasu2/openmanager-vibe-v5/commit/071b206dda05662650ddfc91a0c863947493eff5))
* **cleanup:** 레거시 메트릭 생성 스크립트 아카이브 ([a146669](https://github.com/skyasu2/openmanager-vibe-v5/commit/a146669dc18cab641ef3af6c7679b6b937cb165b))
* **cleanup:** 코드 품질 개선 (import 정리, ESLint 수정, 테스트 개선) ([5909ee2](https://github.com/skyasu2/openmanager-vibe-v5/commit/5909ee2e457b3ef693b7f538feb6dd0e666bb555))
* **code-review:** simplify fallback to 1-retry + deferred compensation ([149b621](https://github.com/skyasu2/openmanager-vibe-v5/commit/149b62197bc52dd925df757ffc68156d75643473))
* **code-review:** v6.9.2 - handle_review_success() 헬퍼 함수 추출 ([d0c5d0b](https://github.com/skyasu2/openmanager-vibe-v5/commit/d0c5d0b8d7223d13e0e3676c1347c4911a7a811b))
* **components:** extract FullScreenLayout from auth components ([90d02f3](https://github.com/skyasu2/openmanager-vibe-v5/commit/90d02f380cc098ed7065b7e4d497b3920adf7229))
* **dashboard:** DashboardClient 유틸리티 분리 및 디버그 코드 정리 ([bfab300](https://github.com/skyasu2/openmanager-vibe-v5/commit/bfab30096b9dbd2144be617293921c084f26f5ef))
* **dashboard:** simplify server components, remove over-engineering ([c3fa843](https://github.com/skyasu2/openmanager-vibe-v5/commit/c3fa8434881bcbe0de7921c31e4d051675d9f063))
* **dashboard:** 정적 분석 기반 대시보드 코드 개선 ([dfa27df](https://github.com/skyasu2/openmanager-vibe-v5/commit/dfa27dfd7bf2a11946fcd40bee4093adf52e0b44))
* **data:** UnifiedServerDataSource 대폭 단순화 (scenario-loader 전용) ([4cbd049](https://github.com/skyasu2/openmanager-vibe-v5/commit/4cbd049c80ff1e159c4952a18e16ca3cf8fbb96d))
* **docs:** archive 12 analysis/report files (500+ lines) ([3fd2674](https://github.com/skyasu2/openmanager-vibe-v5/commit/3fd267447e44be99847f5f8ac4862b9df1051133))
* **docs:** archive large reports + remove 9 more duplicates ([5e8ca29](https://github.com/skyasu2/openmanager-vibe-v5/commit/5e8ca29512329a30d49225acbacbd9a275918e7e))
* **docs:** consolidate GCP docs to platforms/gcp/ ([1d832ee](https://github.com/skyasu2/openmanager-vibe-v5/commit/1d832ee16b5eb114079024121677d22f7e57ab89))
* **docs:** move legacy reports to archive (27 files) ([f8b536e](https://github.com/skyasu2/openmanager-vibe-v5/commit/f8b536e7e61920c4f1a5abafa68df78265300d98))
* **docs:** remove 5 duplicate files ([f9c8792](https://github.com/skyasu2/openmanager-vibe-v5/commit/f9c879220fa1ae2a68d9d5fdb33a407db636cea6))
* **docs:** remove duplicate folders (Phase 5 cleanup) ([9df84dc](https://github.com/skyasu2/openmanager-vibe-v5/commit/9df84dccdace9fb3c1e4e0d5e22cd66320e802a3))
* **docs:** WSL \ubcf5\uc6d0 \uac00\uc774\ub4dc \uac1c\uc120 - \ucf54\ub4dc \ub9ac\ubdf0 \uc81c\uc548 \ubc18\uc601 ([f5934b3](https://github.com/skyasu2/openmanager-vibe-v5/commit/f5934b31e6d4e55b0fc6bf38437684ddd953e734))
* **docs:** WSL 복원 가이드 최종 개선 - Gemini 추가 제안 100% 반영 ([362e97f](https://github.com/skyasu2/openmanager-vibe-v5/commit/362e97f2e17373557e5a4322c66765996ad31add))
* **e2e:** extract security helpers and use test.skip pattern ([cd95877](https://github.com/skyasu2/openmanager-vibe-v5/commit/cd95877d12600f7fc2ad9e8c1bdb11c2cb5313d7))
* **error:** consolidate ServerCardErrorBoundary to single source ([f2b0188](https://github.com/skyasu2/openmanager-vibe-v5/commit/f2b0188600a0916ea09ca9f07d5243255ba9ed6c))
* **frontend:** improve CSP config and clean up CSS ([d0cb782](https://github.com/skyasu2/openmanager-vibe-v5/commit/d0cb782d3f94bdb8912bea7478d552b34074e3ed))
* GCP Functions 통합 + Tailwind gradient 문법 수정 ([f9700a6](https://github.com/skyasu2/openmanager-vibe-v5/commit/f9700a6348421dc7cc2bdf7820023375c16ba7d5))
* **hooks:** remove fake subagent checks (not actual Claude AI) ([5e3155e](https://github.com/skyasu2/openmanager-vibe-v5/commit/5e3155e7eb5a74d39c3e3d78da88a0eef90b3a80))
* **lint:** move ESLint from pre-push to post-commit only ([21c517c](https://github.com/skyasu2/openmanager-vibe-v5/commit/21c517c2705d2e347c00c4625cf1df3882c445c0))
* **login:** simplify button UI and restore cursor-pointer ([4487a96](https://github.com/skyasu2/openmanager-vibe-v5/commit/4487a96897f45cf8e9a67c76dfe309f6378a1021))
* **main:** 메인 페이지 리팩토링 - 568줄 → 300줄 (47% 감소) ([0ebb7f8](https://github.com/skyasu2/openmanager-vibe-v5/commit/0ebb7f83ce368fa055e0671ca724b6a4f39480f0))
* **mcp:** implement SSOT for MCP server configuration ([e5f8139](https://github.com/skyasu2/openmanager-vibe-v5/commit/e5f8139d053e38f117170fe2b4b2a76ef0d4aff8))
* **metrics:** 5분 갱신 주기 적용 + 구버전 문서 정리 ([a55f99c](https://github.com/skyasu2/openmanager-vibe-v5/commit/a55f99c3017b87c6b8df4678850f633536fcf00d))
* migrate middleware.ts to proxy.ts (Next.js 16) ([9ec880e](https://github.com/skyasu2/openmanager-vibe-v5/commit/9ec880e02bf0bba3406723e8b9bf155fd6fb0c58))
* **migrations:** reorganize pgvector migration files ([6f2c5c5](https://github.com/skyasu2/openmanager-vibe-v5/commit/6f2c5c51c8555876921a1d6c8ad5cf7ea4f6f29d))
* modularize supabase-rag-engine.ts ([808b2c6](https://github.com/skyasu2/openmanager-vibe-v5/commit/808b2c6cc3f0118042afaa0bb535d42b7acd6660))
* **rag:** add searchWithContext method to SupabaseRAGEngine ([b8b8d61](https://github.com/skyasu2/openmanager-vibe-v5/commit/b8b8d61ddce94eead7dd93917c8d0b33967c4741))
* remove GCP Functions client code and mock handlers ([32a9ea6](https://github.com/skyasu2/openmanager-vibe-v5/commit/32a9ea6df2e473b95c5b4efe711751f3bc56731a))
* remove legacy code and unused files ([c990b14](https://github.com/skyasu2/openmanager-vibe-v5/commit/c990b140c0a55d514fe8a8e3137d59fdb2aca722))
* simplify Dashboard and ServerModal, remove over-engineering ([eb8996a](https://github.com/skyasu2/openmanager-vibe-v5/commit/eb8996ac338e84cce4b5b0cefec72d23b21df371))
* **skills:** align Claude Code skills with tech stack upgrade ([4731019](https://github.com/skyasu2/openmanager-vibe-v5/commit/473101938c7880ed4b98eaab153057345f97af3d))
* split useServerDashboard.ts into types, utils, and hooks ([25d99a0](https://github.com/skyasu2/openmanager-vibe-v5/commit/25d99a05759f13f77a34c0ca2c9182774eda9116))
* **store:** simplify state management architecture ([e626d65](https://github.com/skyasu2/openmanager-vibe-v5/commit/e626d65e9b1177255db66e72a208d7ce06c21758))
* streamline state management and component imports ([1b17fbe](https://github.com/skyasu2/openmanager-vibe-v5/commit/1b17fbe1bb9fc2d8ac75a9f98bece676b3ce0052))
* **subagents:** optimize 8 subagent configs with best practices ([44bc935](https://github.com/skyasu2/openmanager-vibe-v5/commit/44bc93517703288f7c0b57b17a7b8292ff256ef5))
* **test:** improve AI engine test type safety (Gemini review fixes) ([014f53c](https://github.com/skyasu2/openmanager-vibe-v5/commit/014f53c9feb83c9e5e81838bc9c61f1363648124))
* **test:** openAiSidebar 에러 메시지 개선 (Qwen 리뷰 반영) ([7b7afd4](https://github.com/skyasu2/openmanager-vibe-v5/commit/7b7afd415f11c14c22bb4b2efd6129f5b4b36bff))
* **test:** openAiSidebar 에러 메시지 완전 개선 (Claude 리뷰 반영) ([01e9122](https://github.com/skyasu2/openmanager-vibe-v5/commit/01e9122862bfcfa4f66cb840cd9264c804f14917))
* **types:** extract shared types for AI Query API responses (Codex 8/10→10/10) ([8bbdd8e](https://github.com/skyasu2/openmanager-vibe-v5/commit/8bbdd8e15af1303592031e0802cb1114c6c73762))
* **ui:** GitHub 로그인 메뉴 description 제거 ([1205384](https://github.com/skyasu2/openmanager-vibe-v5/commit/1205384fefa6d0c58cd96d68cae2ba808cdf92e4))
* **utils:** 유틸리티 함수 중복 제거 및 구조 개선 ([5554db6](https://github.com/skyasu2/openmanager-vibe-v5/commit/5554db665869d19d72b53221438b76f6be4d050c))
* **validators:** use Zod v4 coerce API for paginationQuerySchema ([6dceaff](https://github.com/skyasu2/openmanager-vibe-v5/commit/6dceaff0034d9b00b6f721d5a6c6153aa05eb23f))
* **workflow:** separate validation into background post-commit ([22462dd](https://github.com/skyasu2/openmanager-vibe-v5/commit/22462dd7749543f85c54b95b7edc53abb87dd5d4))
* 대규모 코드 정리 및 문서 자동화 시스템 구축 ([799e3a1](https://github.com/skyasu2/openmanager-vibe-v5/commit/799e3a1b483992490ae38a3ea89cc91f370d667f))
* 타입 정리 및 불필요한 import 제거 ([28075a9](https://github.com/skyasu2/openmanager-vibe-v5/commit/28075a9f67f326ccad1c502121c9c39474f45b7a))


### 🐛 Bug Fixes

* **a11y:** improve LoginClient accessibility for WCAG 2.1 AA compliance ([3cdb97e](https://github.com/skyasu2/openmanager-vibe-v5/commit/3cdb97e6ef056247e210de9daab5c17936f91cac))
* **a11y:** restore keyboard focus visibility and debugging context ([375f571](https://github.com/skyasu2/openmanager-vibe-v5/commit/375f571224bfaedf220041fe7fdfc34212996a50))
* add defensive null guards for services and log.source ([74b8c87](https://github.com/skyasu2/openmanager-vibe-v5/commit/74b8c876cb75a6c42125e072bb513815b0a03261))
* add shebang to pre-push hook ([55f402f](https://github.com/skyasu2/openmanager-vibe-v5/commit/55f402f387edf370f25c5a95c78435002faf7c43))
* **ai-review:** AI_ENGINE 변수 전파 버그 수정 (v5.0.1) ([b273be7](https://github.com/skyasu2/openmanager-vibe-v5/commit/b273be7a4116458371afac73a40e927d65b36771))
* **ai-review:** wrapper 스크립트 실행 시 bash 명시적 사용 ([f8e33d8](https://github.com/skyasu2/openmanager-vibe-v5/commit/f8e33d871c5cbcc6900e596e7a147012e9d8ba0a))
* **ai:** AISidebarV4 useChat import 경고 완전 해결 ([9e06008](https://github.com/skyasu2/openmanager-vibe-v5/commit/9e060082266e87f4bec9aa4cd9b23360ce68c826))
* **ai:** Zod v4 + pdf-parse v3 compatibility updates ([cb56d82](https://github.com/skyasu2/openmanager-vibe-v5/commit/cb56d82fc6b7080e27df3bf81b9cea578360aa4c))
* **api:** apply Zod v4 ESM import pattern ([1b1b4bd](https://github.com/skyasu2/openmanager-vibe-v5/commit/1b1b4bd7c933c634f9f69c5d5b997ec268986046))
* **api:** migrate dashboard API from /servers/all to /servers-unified ([cff3bb0](https://github.com/skyasu2/openmanager-vibe-v5/commit/cff3bb0c3b7f4e124ca580b0642297a7c00e0d1f))
* **api:** update raw-metrics path to use hourly-data folder ([c5e5c0d](https://github.com/skyasu2/openmanager-vibe-v5/commit/c5e5c0db8a59e5740407ad136fd4d2da6ef29ed8))
* **auth:** apply getSupabase() pattern to auth-state-manager.ts ([bd9266c](https://github.com/skyasu2/openmanager-vibe-v5/commit/bd9266c67083bd0ce6a40fb09d818b8b52e26021))
* **auth:** enhance security with JWT validation and secure guest IDs ([7ec222d](https://github.com/skyasu2/openmanager-vibe-v5/commit/7ec222d48993894493cb2174bf90b7830ec3b509))
* **auth:** remove server-only imports from client-side auth files ([24daf1e](https://github.com/skyasu2/openmanager-vibe-v5/commit/24daf1ebcccb31b66b1c8c1bdcd63b55f27ff7f4))
* **auth:** resolve GitHub OAuth PKCE session creation failure ([5753af5](https://github.com/skyasu2/openmanager-vibe-v5/commit/5753af5d81f83c328a4880ab03249a04d1970598))
* **auth:** suppress expected 'Auth session missing' warnings in guest mode ([1af1b82](https://github.com/skyasu2/openmanager-vibe-v5/commit/1af1b82e8138778e016486dd26062037aa20c012))
* **auth:** 세션 만료 기간 30일 → 7일로 변경 ([7a024d5](https://github.com/skyasu2/openmanager-vibe-v5/commit/7a024d59faf6936c473603eee4f0216fe38a8749))
* **biome:** resolve circular dependency in useAutoLogout ([8ad5d59](https://github.com/skyasu2/openmanager-vibe-v5/commit/8ad5d5960691c0e297e0f8552e9bc4e5678a3984))
* **biome:** support both Windows and WSL environments ([f5cd501](https://github.com/skyasu2/openmanager-vibe-v5/commit/f5cd501f2d2106f04b44309fe9701a2bda173218))
* **build:** remove node: protocol to support Vercel deployment ([d130591](https://github.com/skyasu2/openmanager-vibe-v5/commit/d13059138e9c096e0fbc167e30ef19e563d74e98))
* **build:** revert node: protocol to fix Vercel client bundling ([c82e85d](https://github.com/skyasu2/openmanager-vibe-v5/commit/c82e85d22a4484ea238c688fd554ca7cc946acd9))
* **build:** Vercel 배포 수정 - generate:server-data 스크립트 제거 ([d0826bb](https://github.com/skyasu2/openmanager-vibe-v5/commit/d0826bb24a75b30bea88ddc1abb1134886144e23))
* **cache:** add hardcoded production URL fallback for Vercel serverless ([db184f3](https://github.com/skyasu2/openmanager-vibe-v5/commit/db184f3e8fd8fe301e2c22c94bab0a0957f0b39f))
* **cache:** always use production URL for static file access ([7b64fdd](https://github.com/skyasu2/openmanager-vibe-v5/commit/7b64fdd8ed72cfe129ba049b0902490e360bd02d))
* **charts:** resolve ResponsiveContainer -1 width/height warnings ([9cc09c6](https://github.com/skyasu2/openmanager-vibe-v5/commit/9cc09c614e3daf5df48b8cf8b5aa7f226a5616e9))
* **ci:** use optimized lint:ci command to prevent OOM ([ddc9725](https://github.com/skyasu2/openmanager-vibe-v5/commit/ddc97250dc67839fad1403ca3c33d78c999fac9a))
* **cloud-run:** fix package versions and add package-lock.json ([845f183](https://github.com/skyasu2/openmanager-vibe-v5/commit/845f18378533a4afe1454cc48607fce2dd381d00))
* **cloud-run:** handle trailing newline in env vars with .trim() ([250e7a5](https://github.com/skyasu2/openmanager-vibe-v5/commit/250e7a51bb26b66b330aa2575424cc22774f984e))
* **cloud-run:** read env vars dynamically for serverless ([4e2c3bb](https://github.com/skyasu2/openmanager-vibe-v5/commit/4e2c3bbc76722faf77e814fd1126a2d46954864e))
* **cloud-run:** update @langchain/core to ^0.3.79 for peer dependency compatibility ([5891a39](https://github.com/skyasu2/openmanager-vibe-v5/commit/5891a3977b513a88e246862cf72657902639a92c))
* **code-review:** v6.3.0 - 1:1:1 균등분배 보장 + Rate Limit 감지 ([89617d0](https://github.com/skyasu2/openmanager-vibe-v5/commit/89617d00e4613cef61021840cd610b8f98c1386d))
* **code-review:** v6.4.0 - 초기 상태 버그 수정 + Rate Limit 통합 ([3813d35](https://github.com/skyasu2/openmanager-vibe-v5/commit/3813d35c9428d3b940dd977edba78eeb746471a4))
* **code-review:** v6.9.1 - set_last_ai 버그 수정 ([afc9569](https://github.com/skyasu2/openmanager-vibe-v5/commit/afc9569c73e25368a81288d0cc5b0823556c23a5))
* **config:** align Cloud Run AI endpoint and feature flags ([e317b1a](https://github.com/skyasu2/openmanager-vibe-v5/commit/e317b1a2dcfac368ab22007b091ba7e2a8c3f3b8))
* **config:** apply Zod v4 ESM safe integer pattern ([29176b3](https://github.com/skyasu2/openmanager-vibe-v5/commit/29176b3238416da9a89585981bc09068982947b9))
* correct OpenStack to Open Source in feature cards ([820bbd7](https://github.com/skyasu2/openmanager-vibe-v5/commit/820bbd7d9d0fb94ce5abc45801ddda942c7a0a58))
* **critical:** resolve AI code review findings (3 bugs) ([59e7075](https://github.com/skyasu2/openmanager-vibe-v5/commit/59e707599a73a29daa28b02cb8b8c3c4d1da0a4a))
* **css:** resolve Tailwind v4 padding utilities not applying ([2726f29](https://github.com/skyasu2/openmanager-vibe-v5/commit/2726f29c16bb48b528df565ea846afefa384e63b))
* **dashboard:** prevent DashboardContent render log spam ([89eee14](https://github.com/skyasu2/openmanager-vibe-v5/commit/89eee14f33eaa6037f254735312fc7d1b27e793c))
* **dashboard:** remove unused 1-second interval causing graph flicker ([9ef7583](https://github.com/skyasu2/openmanager-vibe-v5/commit/9ef7583710fa85bfd04ffde235ea26e8f673f975))
* **dashboard:** resolve API over-calling causing ERR_INSUFFICIENT_RESOURCES ([31b4825](https://github.com/skyasu2/openmanager-vibe-v5/commit/31b4825eee15540dfd87f6c588556aedb9992f5e))
* **data:** add client-side API fallback for UnifiedServerDataSource ([de55f31](https://github.com/skyasu2/openmanager-vibe-v5/commit/de55f316c19daaafbe9661ef2af356ded753e4e5))
* **data:** remove stage4 from history and update current tech stack ([5c101dd](https://github.com/skyasu2/openmanager-vibe-v5/commit/5c101ddd2d77f6208b5d5229fc3ccb1e8db627a5))
* **deps:** regenerate lockfile with --legacy-peer-deps ([0ab2b7b](https://github.com/skyasu2/openmanager-vibe-v5/commit/0ab2b7b2629fb467c6956bbab10a53f2e098dc19))
* **deps:** regenerate package-lock.json for Vercel compatibility ([4676714](https://github.com/skyasu2/openmanager-vibe-v5/commit/4676714d50dd43594dfdf41e60d081a041361ede))
* **deps:** Zod v4 호환성 수정 ([582ef3e](https://github.com/skyasu2/openmanager-vibe-v5/commit/582ef3e3a01ef431ece71f8668f63298bb3f5e50))
* **dev:** enable Windows IDE access to WSL dev server ([d13da2e](https://github.com/skyasu2/openmanager-vibe-v5/commit/d13da2efe455b9582a9dccfd479fec5fcb9434f7))
* **docs:** correct MCP path references and remove stale directory ([b98ec22](https://github.com/skyasu2/openmanager-vibe-v5/commit/b98ec2286ed5b429780dcf82ce5d151e6710649e))
* **docs:** correct relative path links in environment/tools/ ([18b2bf1](https://github.com/skyasu2/openmanager-vibe-v5/commit/18b2bf15c1b9742c3235697146edbb5dfed21fa8))
* **docs:** correct YAML frontmatter and broken links ([4b1848f](https://github.com/skyasu2/openmanager-vibe-v5/commit/4b1848f4af4076e292d5ffad5127a805c8407a05))
* **docs:** correct YAML frontmatter and broken links ([2de9b80](https://github.com/skyasu2/openmanager-vibe-v5/commit/2de9b803acc2c0eb7412a4d07cb34b63c834f2c1))
* **docs:** unify ENDPOINT env var format (remove /process suffix) ([b752e99](https://github.com/skyasu2/openmanager-vibe-v5/commit/b752e99f5046142e3845cd85ccca8b78dc1ac98f))
* **docs:** update validation rules per project standards ([6e14e4e](https://github.com/skyasu2/openmanager-vibe-v5/commit/6e14e4e669627d9543978ad7e3c9da2f4f1e1117))
* **e2e:** resolve local E2E test failures with production build mode ([a790c8c](https://github.com/skyasu2/openmanager-vibe-v5/commit/a790c8c9b1d42a77855078d6af0d513051c2a9cf))
* **e2e:** stabilize local dev server E2E testing for Next.js 15 ([915b893](https://github.com/skyasu2/openmanager-vibe-v5/commit/915b893feebb3087cb7ba9422cbd65e71b43ab37))
* **file-cache:** use fetch API for Vercel serverless environment ([524cc9e](https://github.com/skyasu2/openmanager-vibe-v5/commit/524cc9e4d0da8358dab28f3508b6cb1a753fbf5d))
* **gcp:** 레거시 Cloud Functions URL 완전 제거 ([a0ad79c](https://github.com/skyasu2/openmanager-vibe-v5/commit/a0ad79cfaf43307602be5677a9bbcc4e773bd402))
* **gitignore:** use root-scoped patterns per Codex review ([d1e6da2](https://github.com/skyasu2/openmanager-vibe-v5/commit/d1e6da2b9c7ca90a10e1a9b4babdcd4bdd9d82d3))
* **health:** improve database connection check resilience ([6fdc7b9](https://github.com/skyasu2/openmanager-vibe-v5/commit/6fdc7b929cd4244cf6d64fce97124d596fd34106))
* **health:** use auth session check instead of RPC for database connectivity ([594d1c5](https://github.com/skyasu2/openmanager-vibe-v5/commit/594d1c5b05fefb2cffa3d6dad75d575483136143))
* **hooks:** improve POSIX compatibility and reduce log noise ([d8ced7b](https://github.com/skyasu2/openmanager-vibe-v5/commit/d8ced7b33e1e578d78cbbffde3ed77615c789ed9))
* **import:** UnifiedServerDataSource import 경로 @ alias로 복원 및 타입 명시 ([0540243](https://github.com/skyasu2/openmanager-vibe-v5/commit/05402430fe30f2f71ced38d2594ad0425db2d47d))
* **import:** UnifiedServerDataSource import 경로 @ alias로 복원 및 타입 명시 ([f6fcbca](https://github.com/skyasu2/openmanager-vibe-v5/commit/f6fcbcafa128596a3501656ec36138c3ba0bc982))
* improve CSP safety and fix UI/CSS issues ([bc5588d](https://github.com/skyasu2/openmanager-vibe-v5/commit/bc5588d00809ae598609dcbed612f6dd35fa74bc))
* **lint:** AIChatInterface Biome 오류 수정 ([db94579](https://github.com/skyasu2/openmanager-vibe-v5/commit/db9457926aa2eae22a369fa4e942bf43c5ea28cb))
* **lint:** ESLint no-floating-promises 에러 수정 (DashboardClient) ([845b02c](https://github.com/skyasu2/openmanager-vibe-v5/commit/845b02c9523c5af20f62b105ebc96ba4a60e0ee6))
* **lint:** route.ts noExplicitAny 오류 수정 ([1cad056](https://github.com/skyasu2/openmanager-vibe-v5/commit/1cad056f31d394ec053f731c4a137f33b7732794))
* **login:** restore Sparkles gradient icon on login page ([9e7dae2](https://github.com/skyasu2/openmanager-vibe-v5/commit/9e7dae28df055259c639a7203358e311b5284b65))
* **main:** 게스트 모드 시스템 시작 접근 허용 ([28809ff](https://github.com/skyasu2/openmanager-vibe-v5/commit/28809ff62472878ad767bdfc771f3c09103de379))
* post-upgrade maintenance fixes ([bc7e5d7](https://github.com/skyasu2/openmanager-vibe-v5/commit/bc7e5d7adf2c6af4d31bec8a5fd053832ee9c425))
* **rag:** apply code review feedback - type safety & warning log ([95515c8](https://github.com/skyasu2/openmanager-vibe-v5/commit/95515c81a5c2eef2128c4be036dc9f5ff6cd6ab1))
* **rag:** Phase 3.1-3.2 캐시 안정성 개선 ([9d43661](https://github.com/skyasu2/openmanager-vibe-v5/commit/9d43661d0fad94f6edae47ef41b97e7828b755df))
* Remove side-effects from admin mode removal ([b20615e](https://github.com/skyasu2/openmanager-vibe-v5/commit/b20615e6765a95f8c880835a6c428ed170eb44f8))
* remove unused imports (lint) ([1d2090d](https://github.com/skyasu2/openmanager-vibe-v5/commit/1d2090d85f147702a56f9f3ac12e0551562278f1))
* resolve all Biome lint warnings (49→0) ([fdf70e7](https://github.com/skyasu2/openmanager-vibe-v5/commit/fdf70e76ff2c47f93ce1993f39cc69502fd19acc))
* resolve Biome lint warnings ([cf2bc03](https://github.com/skyasu2/openmanager-vibe-v5/commit/cf2bc039c32d13b2afe8c0118585559934480e2b))
* resolve broken script references from cleanup commit ([75a9855](https://github.com/skyasu2/openmanager-vibe-v5/commit/75a9855aae2cd4376f862dc4fbe31d59d0ca2a6a))
* resolve Gemini logging regression and improve output capture ([81de64e](https://github.com/skyasu2/openmanager-vibe-v5/commit/81de64eb30a841123ac7da8e9b9480ace0611984))
* restore GCP Functions details in feature cards (Python/OpenStack) ([d188ea7](https://github.com/skyasu2/openmanager-vibe-v5/commit/d188ea7e048659ee99179d816ae99753f7ad36f1))
* **review:** Gemini wrapper v3.1.0 - 쿼리 이스케이핑 버그 수정 ([1d4982e](https://github.com/skyasu2/openmanager-vibe-v5/commit/1d4982e44f3bbdde88b578a8d7da39fad61f64b7))
* **review:** Gemini wrapper 일관성 + 버전 동기화 + 경로 주석 ([b30d330](https://github.com/skyasu2/openmanager-vibe-v5/commit/b30d330a6670f4f30a92f4867b9e269037264158))
* **review:** Gemini wrapper 일관성 + 버전 동기화 + 경로 주석 ([56b94ae](https://github.com/skyasu2/openmanager-vibe-v5/commit/56b94ae4f38b8227c28031604df6713760a78ea3))
* **security:** add API auth, PII filter, and optimize Cloud Run config ([6d60527](https://github.com/skyasu2/openmanager-vibe-v5/commit/6d605276a4cbe0e105032621412233b1da8f1eb0))
* **security:** address AI review feedback - improve type safety ([b43bf5c](https://github.com/skyasu2/openmanager-vibe-v5/commit/b43bf5cbde638e920cd0fefd2c56f1b18befe20d))
* **security:** address AI review feedback - session security hardening ([b53724a](https://github.com/skyasu2/openmanager-vibe-v5/commit/b53724ae5d153be0221975c64a06ef021bc6a4bb))
* **security:** correct Buffer encoding from utf8 to hex ([3a800f4](https://github.com/skyasu2/openmanager-vibe-v5/commit/3a800f419da0963c0746af4dac967ea56d35dfc7))
* **security:** patch 4 vulnerabilities (HIGH+MODERATE) ([94fbe73](https://github.com/skyasu2/openmanager-vibe-v5/commit/94fbe7399bbe5223d3bbb80a1fb4406fe1d967d6))
* **security:** Shell Injection 방어 및 CI/CD 호환성 개선 ([76238c8](https://github.com/skyasu2/openmanager-vibe-v5/commit/76238c8ed002a9cd56b2a021bb1f98903f6ca29a))
* **security:** update Next.js 15.5.5 → 15.5.7 (CVE-2025-66478) ([a595b13](https://github.com/skyasu2/openmanager-vibe-v5/commit/a595b13ca1ebc0e89bd869b5f221579b91498ad8))
* **supabase:** SSR 안전성 개선 - 모듈 최상위 클라이언트 초기화 수정 ([229254c](https://github.com/skyasu2/openmanager-vibe-v5/commit/229254c1d7fce509daa49aea36b0ba1732be4eeb))
* **test:** add guest login flow to Feature Cards E2E tests ([04cd741](https://github.com/skyasu2/openmanager-vibe-v5/commit/04cd74148cbddf5706d5e111bff084d98aa46bea))
* **test:** AI 사이드바 E2E 테스트 안정성 개선 (Codex 리뷰 반영) ([f6b7f4c](https://github.com/skyasu2/openmanager-vibe-v5/commit/f6b7f4c5bf0368596d1f2554d3edd2118ff73135))
* **test:** E2E 테스트 /system-boot 로딩 페이지 대기 로직 추가 ([57b3e92](https://github.com/skyasu2/openmanager-vibe-v5/commit/57b3e92af3eccf10da3b3750eeb237abe1d17b0b))
* **test:** E2E 테스트 navigation 레이스 컨디션 수정 (Promise.all 패턴) ([1cdb666](https://github.com/skyasu2/openmanager-vibe-v5/commit/1cdb666fec73f773a4aa3c9210f6cedb1216a39d))
* **test:** E2E 테스트 timeout 값 표준화 (Vercel Cold Start 대응) ([f04047f](https://github.com/skyasu2/openmanager-vibe-v5/commit/f04047f558085bad3657f630fc0e95e1cb53c572))
* **test:** E2E 테스트 대시보드 접근 개선 ([4d79117](https://github.com/skyasu2/openmanager-vibe-v5/commit/4d791174cf2b72ca45b5802a7619ac4961f06d4b))
* **test:** E2E 테스트 시스템 초기화 대기 로직 추가 ([d23e043](https://github.com/skyasu2/openmanager-vibe-v5/commit/d23e043b0ca5dd817cd04cbfc4689d4163229725))
* **test:** E2E 테스트 안정성 개선 - Gemini 리뷰 Critical 이슈 수정 ([6ffd096](https://github.com/skyasu2/openmanager-vibe-v5/commit/6ffd096ca9c22c3060e09b9ad396438667d3f460))
* **test:** E2E 테스트 파일 경로 수정 ([0d59947](https://github.com/skyasu2/openmanager-vibe-v5/commit/0d59947f6eeb208e9a0541773080a5f50d510f9d))
* **test:** formatPercentage 테스트 기대값 수정 ([523dac0](https://github.com/skyasu2/openmanager-vibe-v5/commit/523dac00303e351d99b0a2a93b8b6b684cb7263e))
* **test:** improve Dashboard E2E test stability (Codex review fixes) ([6c27536](https://github.com/skyasu2/openmanager-vibe-v5/commit/6c275367621ff0b35560cb616b1284ce517dc0e9))
* **test:** openAiSidebar 헬퍼 함수 개선 - 이미 열린 사이드바 처리 ([174f01c](https://github.com/skyasu2/openmanager-vibe-v5/commit/174f01cf89ec8d5eed8b51f580ac7ae3ee7838d4))
* **tests:** repair orphaned test files importing non-existent modules ([655cd35](https://github.com/skyasu2/openmanager-vibe-v5/commit/655cd35c1cc3fb831d818c1c5399a4a1c226d86a))
* **test:** 테스트 개선 및 import 경로 수정 ([bfbe666](https://github.com/skyasu2/openmanager-vibe-v5/commit/bfbe666ab9d31e5d8b0a4d8a8c9637945cf014cf))
* **types:** AISidebarContent 타입 에러 수정 (undefined 처리 + aiAnalysis 타입 추가) ([70c2bef](https://github.com/skyasu2/openmanager-vibe-v5/commit/70c2bef4b5965f2cdc22ddd12b61b4d06fd4350a))
* **types:** EnhancedServerMetrics 타입 정의 보완 및 ESLint 수정 (24+4개 오류 해결) ([7d12ed9](https://github.com/skyasu2/openmanager-vibe-v5/commit/7d12ed9a32387fbcc24a1be3bbca7b25a0adfb9f))
* **types:** TypeScript 컴파일 오류 수정 (5개 오류 해결) ([fd575ec](https://github.com/skyasu2/openmanager-vibe-v5/commit/fd575ec713d1a44e55dca3b642545292a27474cc))
* **types:** TypeScript 타입 에러 최종 수정 (AISidebarContent + IntelligentMonitoringService) ([57a5888](https://github.com/skyasu2/openmanager-vibe-v5/commit/57a58887276127f24e7f004798234d6f20c019fd))
* **ui:** 10개 핵심 컴포넌트 애니메이션 클래스 활성화 ([3973ce1](https://github.com/skyasu2/openmanager-vibe-v5/commit/3973ce1670829d1a8506c75e19a464ef44e63880))
* **ui:** 4개 컴포넌트 애니메이션 클래스 활성화 ([afdae8e](https://github.com/skyasu2/openmanager-vibe-v5/commit/afdae8e803fb717302717660aa8b245c681d8a7d))
* **ui:** AI 사이드바 E2E 테스트 지원을 위한 data-testid 추가 ([9ae4bc1](https://github.com/skyasu2/openmanager-vibe-v5/commit/9ae4bc1395853c3129223714598f4017abeab034))
* **ui:** apply dark background for Dark Glassmorphism visibility ([316d37b](https://github.com/skyasu2/openmanager-vibe-v5/commit/316d37b801ca68b548c401804df58072387b6380))
* **ui:** correct AI icon gradient colors - pink → purple → cyan ([d3f0407](https://github.com/skyasu2/openmanager-vibe-v5/commit/d3f040739b75dc46d39602c1cac299637bdb84ca)), closes [#ec4899](https://github.com/skyasu2/openmanager-vibe-v5/issues/ec4899) [#a855f7](https://github.com/skyasu2/openmanager-vibe-v5/issues/a855f7) [#22d3](https://github.com/skyasu2/openmanager-vibe-v5/issues/22d3)
* **ui:** enable disabled Tailwind CSS animations ([70cf480](https://github.com/skyasu2/openmanager-vibe-v5/commit/70cf480b32b5e3d328635d40a9e5d7c50913ba8f))
* **ui:** improve gradient cross-browser compatibility and prevent ID collisions ([bc2c626](https://github.com/skyasu2/openmanager-vibe-v5/commit/bc2c626ef2279b3e0ddf92d906667b32372d93dd))
* **ui:** improve login page layout and visual hierarchy ([ef0fcfe](https://github.com/skyasu2/openmanager-vibe-v5/commit/ef0fcfe3f17956645037d9d28b2d41382d045e19))
* **ui:** improve login page layout and visual hierarchy ([7445bda](https://github.com/skyasu2/openmanager-vibe-v5/commit/7445bdae195e853c41fecf7a370fd416c1d9f149))
* **ui:** ImprovedServerCard에 누락된 아이콘 import 추가 ([0a195df](https://github.com/skyasu2/openmanager-vibe-v5/commit/0a195df9b357169a507cb1e7beb3155fca111803))
* **ui:** remove 'AI 독립 모드' text from main page logo ([6132272](https://github.com/skyasu2/openmanager-vibe-v5/commit/613227215e2ec061260fa96d1f16e0fdc816c720))
* **ui:** remove background ServerIcon causing gray box artifacts ([699e362](https://github.com/skyasu2/openmanager-vibe-v5/commit/699e3624c954cfe6c95ebe88a749361128f27b54))
* **ui:** SystemBootClient 로딩 애니메이션 활성화 ([9a30dbf](https://github.com/skyasu2/openmanager-vibe-v5/commit/9a30dbf7b1025f71fb1003641ca75b3f56e591e5))
* **ui:** update version display from v5.44.3 to v5.80.0 ([ebc09e8](https://github.com/skyasu2/openmanager-vibe-v5/commit/ebc09e8e2d54acf7c3338e521c3c87e27c0e899e))
* **ui:** 로딩 애니메이션 활성화 및 loading.tsx 추가 ([f298dea](https://github.com/skyasu2/openmanager-vibe-v5/commit/f298deaf70cffda214042b6ba5304566944b67ec))
* update document refs and MCP server config after archive cleanup ([b25e566](https://github.com/skyasu2/openmanager-vibe-v5/commit/b25e5665cb0bc012ac3a30b359813491a381a850))
* **utils:** formatPercentage decimals 일관성 수정 ([bf9d906](https://github.com/skyasu2/openmanager-vibe-v5/commit/bf9d906ac0cade24a8b5a4de32e860fd81812145))
* **wrappers:** Codex/Qwen v3.1.0 - stdout/stderr 분리 + 견고성 향상 ([08fb6c4](https://github.com/skyasu2/openmanager-vibe-v5/commit/08fb6c4c97ced0038e00b249f5f0e24f0f76c6c6))
* **wrapper:** stdout/stderr 분리로 파이프라인 호환성 향상 ([03e73e2](https://github.com/skyasu2/openmanager-vibe-v5/commit/03e73e2561136511317d15399d1c1e31cdb7fa08))
* **wrappers:** v3.1.0 로그 메시지 → v3.3.0 일괄 수정 ([c87a65d](https://github.com/skyasu2/openmanager-vibe-v5/commit/c87a65d4f0764626c195a4c8b00fc4a4b766c608))
* **wrappers:** v3.2.0 - temp_stdout unbound variable 버그 수정 ([30dfbe8](https://github.com/skyasu2/openmanager-vibe-v5/commit/30dfbe8f7be6bd7940cd5a8107b32ecb839a1469))
* **wrappers:** v3.3.0 NUL bytes 제거 및 버전/컨텍스트 일관성 수정 ([8ec3487](https://github.com/skyasu2/openmanager-vibe-v5/commit/8ec3487ef05e2bbd7a6475e93b25b810ce17df55))
* **zod:** resolve Zod v4 ESM module bundling issues ([db330cf](https://github.com/skyasu2/openmanager-vibe-v5/commit/db330cfd24d3555c33ce2f5074b0060ad5afb8d7))


### 🚀 Features

* /api/ai/query 엔드포인트 추가 (AISidebarContent 버그 수정) ([f172223](https://github.com/skyasu2/openmanager-vibe-v5/commit/f172223fba038f485098fdc59eac1f34bf8591cc))
* add Cloud Run LangGraph multi-agent backend ([9237e17](https://github.com/skyasu2/openmanager-vibe-v5/commit/9237e171e3091cd5689309f66553287267777455))
* Add route protection middleware with dev bypass ([753b39e](https://github.com/skyasu2/openmanager-vibe-v5/commit/753b39eb43401d7e77c37c040e5154dfc8a88093))
* AI 리뷰에 문서/테스트 검증 경고 연동 ([898de63](https://github.com/skyasu2/openmanager-vibe-v5/commit/898de639881d0f5f84c4bb3a44c74f158f175b17))
* **ai-review:** restore 3-AI rotation with Claude CLI fix (v6.7.0) ([4d9a933](https://github.com/skyasu2/openmanager-vibe-v5/commit/4d9a93349b29e62c46c31e06e7cd4678d1245c9c))
* **ai-review:** 순서 기반 AI 선택 + Qwen 최종 폴백 (v6.0.0/v6.1.0) ([7fbef55](https://github.com/skyasu2/openmanager-vibe-v5/commit/7fbef55fb25b601f0f7df7b6a1d9a7acbddd3659))
* **ai-sidebar:** connect ML Learning Center to API + cleanup ([50eedac](https://github.com/skyasu2/openmanager-vibe-v5/commit/50eedaca43848a7ce70e54bffed5ed2fde4a2d3d))
* **ai-wrappers:** v3.3.0 comprehensive reviewer context ([be25f28](https://github.com/skyasu2/openmanager-vibe-v5/commit/be25f28aa30dfa776828d71064fa8f8926873bb3))
* **ai:** add insights API and database migrations ([c6779ba](https://github.com/skyasu2/openmanager-vibe-v5/commit/c6779ba0888d668d52e8121f4a9f40fe30a40e4b))
* **ai:** add validation-analysis skill and auto-review system ([6343f93](https://github.com/skyasu2/openmanager-vibe-v5/commit/6343f93a3c0091f3081fc9e01a622e050592d38e))
* **ai:** AI 어시스턴트 전체화면 모드 + Biome lint 수정 ([b9c702c](https://github.com/skyasu2/openmanager-vibe-v5/commit/b9c702c84364afc17bb829dbac017a3477b1c1c0))
* **ai:** Gemini 2.5 Flash 업그레이드 + Groq 폴백 시스템 추가 ([32f90cf](https://github.com/skyasu2/openmanager-vibe-v5/commit/32f90cfce1a387a112e747dfc0a2ebd3963e1fee))
* **ai:** Gemini 3 Pro로 코드 리뷰 모델 업그레이드 ([6f6b466](https://github.com/skyasu2/openmanager-vibe-v5/commit/6f6b466cc762924e89188f83acabbd7fd8b8a82b))
* **ai:** integrate SmartRoutingEngine with /api/ai/query ([b52798b](https://github.com/skyasu2/openmanager-vibe-v5/commit/b52798b4d6cc815d45a1749a66e92ac0f4db5086))
* **ai:** integrate Vercel AI SDK for real-time thinking process and update docs ([54f28a8](https://github.com/skyasu2/openmanager-vibe-v5/commit/54f28a8fe55458143872f7057bba93294e0b9fbb))
* **ai:** integrate Vercel AI SDK streaming and complete Phase 1-2 documentation ([8cfc5a1](https://github.com/skyasu2/openmanager-vibe-v5/commit/8cfc5a14187498326e255ba2290603294b610df6))
* **ai:** migrate to LangGraph unified-stream API ([5e77013](https://github.com/skyasu2/openmanager-vibe-v5/commit/5e77013a6dd5c4f465c0a3cef63d37382d127a50))
* **ai:** SmartRoutingEngine 통합 + 문서 버전 관리 표준 ([33d9725](https://github.com/skyasu2/openmanager-vibe-v5/commit/33d97256445a76d798e8005c480dda8f3fba4626))
* **ai:** unified-ai-processor v3.3.0 - Quart async + batch API ([180356c](https://github.com/skyasu2/openmanager-vibe-v5/commit/180356cc1abad7d7877f1e5bdabc57156d7bb1cc))
* **analyst-agent:** integrate anomaly detection & trend prediction tools ([d22ba01](https://github.com/skyasu2/openmanager-vibe-v5/commit/d22ba01f50b32f01c203c26fd25a52ff64756e68))
* **animations:** GPU-accelerated animation system (Day 1/3 - 120fps target) ([f74e0b2](https://github.com/skyasu2/openmanager-vibe-v5/commit/f74e0b26f017845edef7d913f8e464aad1615ea0))
* **auth:** 30일 세션 만료 기능 추가 ([6f195ba](https://github.com/skyasu2/openmanager-vibe-v5/commit/6f195badf4f195f013397260ead60b1f6c9e13b1))
* **auth:** add controlled mode props to GitHubLoginButton ([dc36a89](https://github.com/skyasu2/openmanager-vibe-v5/commit/dc36a89d5363ee8a514e6f9512f6e5e2f9d7a487))
* **auth:** enable full guest permissions during development ([eb85407](https://github.com/skyasu2/openmanager-vibe-v5/commit/eb85407973e68b59023f47f72a5e335fe35174dc))
* **auth:** enable guest full access mode for AI API ([95a4e85](https://github.com/skyasu2/openmanager-vibe-v5/commit/95a4e85ea861300bc2e614021e47e35ba8b663b3))
* **biome:** Biome v2.3.8 전체 적용 + pre-commit 일시 비활성화 ([aac3d26](https://github.com/skyasu2/openmanager-vibe-v5/commit/aac3d26188563c31d79ed8627b890fe489c9a566))
* **biome:** Biome 설정 v2.3.8로 마이그레이션 완료 ([db59567](https://github.com/skyasu2/openmanager-vibe-v5/commit/db59567143420a491995aea04a971ecb675346f6))
* **biome:** Biome 완전 마이그레이션 및 pre-commit 활성화 ([d4ab729](https://github.com/skyasu2/openmanager-vibe-v5/commit/d4ab72939f7604a7ed86bbd0bd0e62dca472f26c))
* **cache:** 캐싱 전략 표준화 - TTL 계층화 및 SWR 프리셋 적용 ([dddd513](https://github.com/skyasu2/openmanager-vibe-v5/commit/dddd513fd73f4d5996612d91ef7e45cfa730c6e9))
* **ci:** add automated linting workflow ([c1d7443](https://github.com/skyasu2/openmanager-vibe-v5/commit/c1d744370f0cee38907a85bbf66a14b6d31f815b))
* **ci:** add weekly branch & PR cleanup automation ([8181667](https://github.com/skyasu2/openmanager-vibe-v5/commit/8181667d98dd859d11d1b539c9293e59e6d843e8))
* **cloud-run:** add Google AI API key round-robin rotation ([ba0fd8c](https://github.com/skyasu2/openmanager-vibe-v5/commit/ba0fd8c5aff2eaa697430b25be21351c80aab7cf))
* **cloud-run:** integrate Cloud Run AI backend with Vercel proxy ([5c56d2a](https://github.com/skyasu2/openmanager-vibe-v5/commit/5c56d2aaa018ab4467e950136d90f7d9a723a5ae))
* **code-review:** v6.9.0 - 3-AI 1:1:1 rotation with mutual fallback ([887a9b2](https://github.com/skyasu2/openmanager-vibe-v5/commit/887a9b250a16c7b55acec85c26c4c04f0d0ea8eb))
* **dashboard:** restore EnhancedServerCard v5.0 with Framer Motion ([f7d2b8e](https://github.com/skyasu2/openmanager-vibe-v5/commit/f7d2b8e18fef7518bc300df3a445b2eae0b7ef6f))
* **data:** add 24h rotating JSON data system for dashboard ([ef11bad](https://github.com/skyasu2/openmanager-vibe-v5/commit/ef11badea40457445b35060bebaa2c7023e88369))
* **deps:** complete Zod v4 migration (Phase 3) ([57c97be](https://github.com/skyasu2/openmanager-vibe-v5/commit/57c97beec53e0ff779f1960d220d1eb53b6df43d))
* **deps:** Phase 1-4 패키지 대규모 업그레이드 완료 ([bc69a6e](https://github.com/skyasu2/openmanager-vibe-v5/commit/bc69a6e88edff12e086cf1621f991de433019831))
* **dev:** 포트 관리 자동화 및 Playwright 설정 개선 ([80a4490](https://github.com/skyasu2/openmanager-vibe-v5/commit/80a4490faedcd444f3f3fd900cd0d7f15c97dbce))
* **dev:** 포트 관리 자동화 스크립트 추가 ([201e9c7](https://github.com/skyasu2/openmanager-vibe-v5/commit/201e9c712bc5ddb546bd28b19837f25d65b67b82))
* **docs:** add architecture and security docs to core/ ([b28e0d0](https://github.com/skyasu2/openmanager-vibe-v5/commit/b28e0d05dd7403abe035c2cc91b60d9f387c7054))
* **docs:** add documentation validation tools ([95f4174](https://github.com/skyasu2/openmanager-vibe-v5/commit/95f4174c15f0e9455fa51d05a4b5b10685aea55f))
* **gcp:** Cloud Functions → Cloud Run 마이그레이션 완료 ([0a86ae2](https://github.com/skyasu2/openmanager-vibe-v5/commit/0a86ae21d2024410979f027e5426418676c815b2))
* **gcp:** maximize free tier utilization ([03f37b2](https://github.com/skyasu2/openmanager-vibe-v5/commit/03f37b215494fc8064a9b58e0b64b2432177fbb2))
* **hitl:** implement natural language approval UX ([5172a2e](https://github.com/skyasu2/openmanager-vibe-v5/commit/5172a2e3082a49bf1807da3a80783e681d53b392))
* **hooks:** add Claude Code Hooks for AI workflow automation ([c898b51](https://github.com/skyasu2/openmanager-vibe-v5/commit/c898b5103c452e64c6267eea136818fbd3aa5cec))
* **hooks:** integrate isSystemStarted into server query hooks ([9d45799](https://github.com/skyasu2/openmanager-vibe-v5/commit/9d45799f99da09c88831e23b288777550c0ea36e))
* **infra:** add Cloud Run deployment for LangGraph agents ([057cc27](https://github.com/skyasu2/openmanager-vibe-v5/commit/057cc2717b7813395cfe3571e1c6945a4cd09731))
* **infra:** PM2 프로세스 관리 시스템 구현 (WSL Best Practice Item 3+4) ([d1ce69f](https://github.com/skyasu2/openmanager-vibe-v5/commit/d1ce69f60b6347778aa8207f639075776a3cbbd9))
* **langgraph:** add Human-in-the-Loop approval and parallel execution ([c375d44](https://github.com/skyasu2/openmanager-vibe-v5/commit/c375d44911312372ca821cbf6cf04c89260d1ec7))
* **langgraph:** add multi-agent StateGraph architecture ([bf92f54](https://github.com/skyasu2/openmanager-vibe-v5/commit/bf92f5429b106e92391c5548b36f0590250e6329))
* **langgraph:** implement A2A delegation & Return-to-Supervisor patterns ([bf657bf](https://github.com/skyasu2/openmanager-vibe-v5/commit/bf657bf495b174a345bb5927700072b45eb6adc5))
* **login:** improve accessibility and UX ([3a0704c](https://github.com/skyasu2/openmanager-vibe-v5/commit/3a0704c3d754c3770718e1a3728c601eb6af8a89))
* **logo:** unify OpenManagerLogo across all pages with click navigation ([21cdefa](https://github.com/skyasu2/openmanager-vibe-v5/commit/21cdefa45186a5ebc0b4fd61a394730e924a0169))
* **mcp:** Brave Search MCP 추가 및 filesystem 제거 ([b9ed861](https://github.com/skyasu2/openmanager-vibe-v5/commit/b9ed861fcb7b13b6b99fe26019c763520c9ec51a))
* **nlp:** spaCy 영어 NLP 지원 추가 + enhanced-korean-nlp 경량화 ([79a090a](https://github.com/skyasu2/openmanager-vibe-v5/commit/79a090abac54a7a93495de05d00f5cde49f7286b))
* **profile:** 게스트 사용자에게 시스템 관리 메뉴 통합 ([d522845](https://github.com/skyasu2/openmanager-vibe-v5/commit/d522845d67093589e094be8c1d93d960a6522537))
* **rag:** extend searchKnowledgeBase tool with intent-based optimization ([20a8240](https://github.com/skyasu2/openmanager-vibe-v5/commit/20a8240be64555b9de57a1d0f326ad377e30220e))
* **rag:** Phase 3 - Intent 기반 캐시 TTL + 24시간 로테이션 ([7b66212](https://github.com/skyasu2/openmanager-vibe-v5/commit/7b66212fb77d3eaec3dc5cdf465afb1388aef89d))
* refactor system boot, improve ai sidebar ux, and cleanup code ([7b86458](https://github.com/skyasu2/openmanager-vibe-v5/commit/7b86458f6b4b650e39dd26a770c68be731ac7f7a))
* refactor useServerDashboard hook and unify design consistency ([6a19f96](https://github.com/skyasu2/openmanager-vibe-v5/commit/6a19f96d2d4b39ecd76b228f65b0031ecd2971a5))
* **review:** 3-AI 순번 (codex→gemini→claude) + 즉시 Qwen 폴백 ([76a33d6](https://github.com/skyasu2/openmanager-vibe-v5/commit/76a33d6e7b8e7e1f0c01baec1e202dcbb165a674))
* **security:** AI 통합 스트리밍 API 인증 적용 ([bdf2786](https://github.com/skyasu2/openmanager-vibe-v5/commit/bdf27866369c52c10c5158ac4861f693f21bee7b))
* **security:** 나머지 AI API 인증 적용 (raw-metrics, rag/benchmark) - 최종 ([fa33bae](https://github.com/skyasu2/openmanager-vibe-v5/commit/fa33baebc646f96539e5840a93d54eb3961c6e9f))
* **security:** 서버 API 인증 미들웨어 적용 + withAuth 제네릭 타입 지원 ([a2db623](https://github.com/skyasu2/openmanager-vibe-v5/commit/a2db6238292ad13315637d41f2ee258ab4550622))
* **security:** 주요 AI API 인증 미들웨어 적용 (3개) ([6ad1e38](https://github.com/skyasu2/openmanager-vibe-v5/commit/6ad1e38d56c849bfa40af42b41984fca371ce29e))
* **test:** AI 사이드바 E2E 테스트 Suite 추가 (7개 시나리오) ([55fc8cc](https://github.com/skyasu2/openmanager-vibe-v5/commit/55fc8cc81fa1f81dfb4422b4c0e162e763b2dae7))
* **test:** E2E 테스트 API 인증 바이패스 및 안정성 개선 ([e44aa57](https://github.com/skyasu2/openmanager-vibe-v5/commit/e44aa578497d881c82a443b93761284ad73785ad))
* **ui:** add AI icon gradient to login page with enhanced blue spectrum ([aa19cdc](https://github.com/skyasu2/openmanager-vibe-v5/commit/aa19cdcea71a866e70a5e460528371553b09386e))
* **ui:** add AI Insight Badge and enhance Bento Grid layout ([97288c5](https://github.com/skyasu2/openmanager-vibe-v5/commit/97288c5b697312f3e3e8b15c5bbc62abff7acba8))
* **ui:** apply Dark Glassmorphism to ServerCard and ServerModal ([602c2e7](https://github.com/skyasu2/openmanager-vibe-v5/commit/602c2e75f84418f833948d644a58fd45f845c40e)), closes [#0F1115](https://github.com/skyasu2/openmanager-vibe-v5/issues/0F1115)
* **ui:** apply White Mode Glassmorphism to server cards ([b71d867](https://github.com/skyasu2/openmanager-vibe-v5/commit/b71d8675dd37203f628e83c64fa074d4f273a18b))
* **ui:** refine login page with diagonal gradient and depth effects ([295ea00](https://github.com/skyasu2/openmanager-vibe-v5/commit/295ea000cc8512cd2f220bb8ae90fe8fba291747))
* **ui:** replace guest restriction alert with styled modal dialog ([507628d](https://github.com/skyasu2/openmanager-vibe-v5/commit/507628d3f05f5f70314876976833b8027a3400ba))
* **ui:** 서버 카드 그래프를 라인 차트로 통합 + Dark Glass 일관성 ([63763ca](https://github.com/skyasu2/openmanager-vibe-v5/commit/63763cafedf2b84679617509518f3c134be112f4))
* update feature cards and secure dev apis (phase 21.2) ([532138c](https://github.com/skyasu2/openmanager-vibe-v5/commit/532138c5bd604811aa611df3b563bc59ec7641dd))
* update tech stack details in feature cards (Recharts 3.x, TanStack Query, NextAuth) ([e7eaf71](https://github.com/skyasu2/openmanager-vibe-v5/commit/e7eaf719aa67d1bb6d612e304663a613c5fbc147))
* **workflow:** add 5min timeout and auto-summary for Claude Code ([ae641bc](https://github.com/skyasu2/openmanager-vibe-v5/commit/ae641bcda11b9a14fadf86beeb3925c2a95bff62))


### 📚 Documentation

* add AI tool comparison analysis and update review system ([3e91c9e](https://github.com/skyasu2/openmanager-vibe-v5/commit/3e91c9efb2aebf8327150f3091016fa2cc26692f))
* add code quality and security roadmaps ([1b84ec3](https://github.com/skyasu2/openmanager-vibe-v5/commit/1b84ec362cd5b57771accfc2a683933f21a1dceb))
* add documentation management principles to README ([bb1462a](https://github.com/skyasu2/openmanager-vibe-v5/commit/bb1462ae7715a6085f384a3836bca337b1fed3e7))
* add environment-specific MCP configurations ([0027868](https://github.com/skyasu2/openmanager-vibe-v5/commit/00278680176bd2c8556b11fa87d6d7eb81d45edf))
* Add production security restoration checklist to TODO ([93d67a2](https://github.com/skyasu2/openmanager-vibe-v5/commit/93d67a22d03207f130e180df727a3bdc0cdb1f3b))
* add WSL development environment guidelines ([dfaff00](https://github.com/skyasu2/openmanager-vibe-v5/commit/dfaff007a39ea6952c56c3b392b3faf24a6af002))
* AI 메모리 파일 및 문서 정리 ([81baf9e](https://github.com/skyasu2/openmanager-vibe-v5/commit/81baf9e9708a24394da9170acd6526802209800e))
* AI 코드 리뷰 시스템 v6.4.0 문서 동기화 ([c098245](https://github.com/skyasu2/openmanager-vibe-v5/commit/c098245a0da771a512164be6b11f2f04d593f23a))
* **ai:** sync AI tool version references ([da5eff0](https://github.com/skyasu2/openmanager-vibe-v5/commit/da5eff02a79a876d0ef78c80b385fdcb2918897a))
* **ai:** update registry-core.yaml with LangGraph architecture ([dfa9fb2](https://github.com/skyasu2/openmanager-vibe-v5/commit/dfa9fb2b3ebbe21c9d2557b816e3a50f099ae3de))
* **ai:** update subagents guide to 9 active agents ([857ebd1](https://github.com/skyasu2/openmanager-vibe-v5/commit/857ebd1eb82bc5d2fc472f88cc841e5fb33f3cf5))
* **analysis:** 서버 카드 디자인 분석 보고서 작성 (v1.0 → v3.1 비교) ([0927390](https://github.com/skyasu2/openmanager-vibe-v5/commit/0927390ac3d2e476198af0571f3448c4d278e577))
* **architecture:** 대시보드 아키텍처 다이어그램 추가 + 포맷팅 ([a07f8ae](https://github.com/skyasu2/openmanager-vibe-v5/commit/a07f8ae4822f8b793a3632b615f66216fe1a5b3c))
* **architecture:** 레거시 데이터 정리 및 난개발 방지 시스템 구축 ([5c1dbcb](https://github.com/skyasu2/openmanager-vibe-v5/commit/5c1dbcb62a606be733c3a9d65395d7f62964261c))
* archive completed planning documents ([e059b9b](https://github.com/skyasu2/openmanager-vibe-v5/commit/e059b9bac9010e388193d15ef999b698f0e1be97))
* archive completed UI/UX improvements and refactoring tasks ([1ba55d7](https://github.com/skyasu2/openmanager-vibe-v5/commit/1ba55d7528876ae8143494465caf9cfa4387d2ac))
* archive outdated v5.71.0 architecture docs + fix testing README ([3bec146](https://github.com/skyasu2/openmanager-vibe-v5/commit/3bec146666e2371994ccc05aed54516d00066102))
* **archive:** clean up 42 outdated archive documents ([0da036f](https://github.com/skyasu2/openmanager-vibe-v5/commit/0da036f15be863039d7214e3f8935a236d286b2c))
* **archive:** remove 42 outdated archive documents ([8fa4b83](https://github.com/skyasu2/openmanager-vibe-v5/commit/8fa4b83caa6e60a13c6e11f93b2da08d0680d151))
* **arch:** update ai-sidebar architecture diagram ([48b3886](https://github.com/skyasu2/openmanager-vibe-v5/commit/48b38867c282ff487fcc8a557854a3f160100269))
* **arch:** update dashboard architecture diagram per live inspection ([7d99eed](https://github.com/skyasu2/openmanager-vibe-v5/commit/7d99eed9db3d2e98d3ba2d040fd33680b3ef142f))
* **arch:** update version to v5.80.0 and add version API test ([de4f9d3](https://github.com/skyasu2/openmanager-vibe-v5/commit/de4f9d3403076eaf07032de4e48e146f8689d167))
* clarify ENDPOINT differences between services ([f964b6c](https://github.com/skyasu2/openmanager-vibe-v5/commit/f964b6ce5e369596ba5556c1b85d5215e364690a))
* **CLAUDE.md:** add autonomous subagent usage principles ([c11ba84](https://github.com/skyasu2/openmanager-vibe-v5/commit/c11ba84707ddd8bff7f5a65661213688970f68ff))
* clean up miscellaneous documentation ([fcc57a5](https://github.com/skyasu2/openmanager-vibe-v5/commit/fcc57a50762654830088839972afc2fcd82a7d6b))
* consolidate duplicate test:vercel:e2e entries in DEVELOPMENT.md ([b930ba2](https://github.com/skyasu2/openmanager-vibe-v5/commit/b930ba2971ab2bb19f5e4b9cc286b95511682c26))
* **core:** restructure architecture with design folder content ([dd013bf](https://github.com/skyasu2/openmanager-vibe-v5/commit/dd013bf9a04a3a1c561c74e66e230266f0c407c1))
* **data:** update Vibe Coding evolution & GCP Cloud Run migration ([dd9ca11](https://github.com/skyasu2/openmanager-vibe-v5/commit/dd9ca1133078642f3c161e997f9b087b035f9925))
* **development:** reorganize development documentation ([b034e45](https://github.com/skyasu2/openmanager-vibe-v5/commit/b034e4510a84e1c00b1a4e9147db7e05acfe1d05))
* **environment:** consolidate to development folder ([48a679f](https://github.com/skyasu2/openmanager-vibe-v5/commit/48a679f267c68cf11ea30ac4c957f73fcfc4a8f8))
* **environment:** WSL 재설치 복원 가이드 추가 ([c7397df](https://github.com/skyasu2/openmanager-vibe-v5/commit/c7397df92f643e75d628b9c16096b7433c5ad11f))
* **feature-cards:** Vibe Coding 카드 내용 현행화 ([19c1527](https://github.com/skyasu2/openmanager-vibe-v5/commit/19c15272906717b2beb17cea30887cb1b1951691))
* fix additional broken document path references ([363c61a](https://github.com/skyasu2/openmanager-vibe-v5/commit/363c61a1242ff3153c18c3e0eb8ac059480c98a7))
* fix broken document path references after reorganization ([305418f](https://github.com/skyasu2/openmanager-vibe-v5/commit/305418f10283aeb3675e59ad4a3b9f33dfe287a3))
* fix broken links after architecture docs reorganization ([fac4dfe](https://github.com/skyasu2/openmanager-vibe-v5/commit/fac4dfefcd233d6ec16cdac970d27f5c33945a0b))
* fix path errors and remove 7 duplicate/obsolete files ([af35f22](https://github.com/skyasu2/openmanager-vibe-v5/commit/af35f2209a1eb4e59e129542c93ca7fdf71d2335))
* integrate AI docs into core/ and development/ structure ([644bb57](https://github.com/skyasu2/openmanager-vibe-v5/commit/644bb577ec502f3ed5835d7fffa6e5b5a2a3da7c))
* major-version-upgrade-plan.md 완료 상태 업데이트 ([ca35d4f](https://github.com/skyasu2/openmanager-vibe-v5/commit/ca35d4fff0bab0a3ba3cef028f955c798b461b7d))
* MCP 12/12 상태 동기화 및 테스트 문서 현행화 ([fcca959](https://github.com/skyasu2/openmanager-vibe-v5/commit/fcca959867e3fe75bbc87ae0b670fe40afb05af4))
* MCP 서버 12/12 업데이트 - filesystem 제거, brave-search 추가 ([d575c03](https://github.com/skyasu2/openmanager-vibe-v5/commit/d575c036f2fbe61625b41fd60539d6d1635ab0bd))
* **mcp:** sync server configurations with .mcp.json ([eca2fae](https://github.com/skyasu2/openmanager-vibe-v5/commit/eca2fae701e869ea8f253b7c5fa7968f68fbd1cb))
* **mock:** Mock 시스템 현황 문서화 (README 추가) ([f0a0735](https://github.com/skyasu2/openmanager-vibe-v5/commit/f0a0735f7b620f05e167dc9928fd6f05f942df2a))
* **mock:** Mock 시스템 현황 문서화 및 역할 명확화 ([5f768ec](https://github.com/skyasu2/openmanager-vibe-v5/commit/5f768ec72be5342e15290999285ca70757b81196))
* organize development AI docs by tool type ([e106caa](https://github.com/skyasu2/openmanager-vibe-v5/commit/e106caa379e2b30e1f2449e5d094a22c37aa4c77))
* **performance:** GPU animation validation guide (Day 3/3 - 120fps verification) ([4502bca](https://github.com/skyasu2/openmanager-vibe-v5/commit/4502bca5b52ec7e6bb803cb9daf5013d029298aa))
* Phase 1-4 패키지 업그레이드 문서 동기화 ([0b1924c](https://github.com/skyasu2/openmanager-vibe-v5/commit/0b1924c41594d2f584a27b6859fa3d584ccb5e39))
* Phase 4 재구조화 완료 - core vs environment 분리 ([fd125c9](https://github.com/skyasu2/openmanager-vibe-v5/commit/fd125c981ecd7cd4fe9048f6a69cc9f07d6a73a1))
* **planning:** cleanup - archive completed reviews ([f140f4d](https://github.com/skyasu2/openmanager-vibe-v5/commit/f140f4dfca6a085d0f349742bd59c2bbf301cf49))
* **planning:** update improvement plan with completed phases ([171a1d1](https://github.com/skyasu2/openmanager-vibe-v5/commit/171a1d106de71cbea71103d175c11db501681f09))
* **readme:** modernize README with professional focus ([66664ff](https://github.com/skyasu2/openmanager-vibe-v5/commit/66664ffcbba10b194eae64b376d33e183dd8e6b8))
* remove deprecated ml-analytics-engine from Docker docs ([3a0e14b](https://github.com/skyasu2/openmanager-vibe-v5/commit/3a0e14b058e2dba2e24636beadf1a141a3f8e252))
* remove design folder (merged into architecture) ([cee4aac](https://github.com/skyasu2/openmanager-vibe-v5/commit/cee4aac4e4b7a03034e4bd243a9f296d4015e8f6))
* reorganize analysis files to archive directory ([97ec426](https://github.com/skyasu2/openmanager-vibe-v5/commit/97ec426d4cc05619a6acd4a185a904035aa7a3a2))
* reorganize architecture docs - move review to analysis, delete outdated ([6ca425f](https://github.com/skyasu2/openmanager-vibe-v5/commit/6ca425fab44a862721dfb5cef69136bdf5869369))
* reorganize documentation structure (JBGE principle) ([a9b10b1](https://github.com/skyasu2/openmanager-vibe-v5/commit/a9b10b1527c639a9ad421faf1698d3ee4e626071))
* **schemas:** add Zod v4 migration comments ([e62a555](https://github.com/skyasu2/openmanager-vibe-v5/commit/e62a555173c794865c32a853e2e8654a7fb8e271))
* **security:** improve GitHub OAuth documentation based on AI review ([993fd34](https://github.com/skyasu2/openmanager-vibe-v5/commit/993fd34d0732cfe541f6ee2c6291818f50f969c0))
* **status:** add measurement methodology and timestamp (Codex 8/10→10/10) ([5ee3bcb](https://github.com/skyasu2/openmanager-vibe-v5/commit/5ee3bcb366fb227826e4aa141f8b4faf21f4d8c3))
* **status:** sync codebase metrics with actual measurements ([7747c7b](https://github.com/skyasu2/openmanager-vibe-v5/commit/7747c7bb0d768a4485bdd23d662de180422acf5c))
* **status:** update E2E test count for Feature Cards ([545493c](https://github.com/skyasu2/openmanager-vibe-v5/commit/545493cc32cfa5a613073394eba05f2bc5316534))
* sync DOCKER_ECOSYSTEM.md with actual docker-compose state ([1e6cdfa](https://github.com/skyasu2/openmanager-vibe-v5/commit/1e6cdfab4b4cd73cb5d209c034a543eaf9f07686))
* sync documentation with v5.80.0 current state ([e5e7553](https://github.com/skyasu2/openmanager-vibe-v5/commit/e5e7553276573b2a4acf84e1ef95e84c894260b1))
* synchronize MCP configuration with CLAUDE.md ([ead1ede](https://github.com/skyasu2/openmanager-vibe-v5/commit/ead1ede86fec1f3f5d7e3481f0918c5c68149946))
* **tech-stacks:** Vibe Coding 모달 데이터 현행화 ([547ed46](https://github.com/skyasu2/openmanager-vibe-v5/commit/547ed46ec615acce49c24e44069dd153d6fe2405))
* TODO 정리 및 완료 작업 아카이브 ([6ff9d14](https://github.com/skyasu2/openmanager-vibe-v5/commit/6ff9d14330801f3352d97d75ee94fea6e824248b))
* update AI configuration and agent definitions ([dfb017f](https://github.com/skyasu2/openmanager-vibe-v5/commit/dfb017fed4b8b88af48a6b8788726fda03455107))
* update AI system documentation and fix ESLint errors ([7ce645c](https://github.com/skyasu2/openmanager-vibe-v5/commit/7ce645c024ba590629b64afa6f10ac53233f8fff))
* update CHANGELOG with 21 missing commits ([4403efe](https://github.com/skyasu2/openmanager-vibe-v5/commit/4403efe0ab03c73b6b099d0b005e8a0d8294d1ca))
* update CLAUDE.md references ([8207c6c](https://github.com/skyasu2/openmanager-vibe-v5/commit/8207c6ccac2a0f88cafc290f403a3351ca4a8142))
* update documentation for Cloud Run LangGraph architecture ([1bccace](https://github.com/skyasu2/openmanager-vibe-v5/commit/1bccacea9c9d6fee2b58da22e2eab02e5d41e79a))
* update GitHub OAuth & Guest authentication documentation ([506e176](https://github.com/skyasu2/openmanager-vibe-v5/commit/506e176baee905c489a84ce7198cc73b99279673))
* update improvement-plan.md with accurate phase statuses ([6b6b564](https://github.com/skyasu2/openmanager-vibe-v5/commit/6b6b564ad5700fd277512d2938e479e3ede45b9a))
* update improvement-plan.md with Phase 2.2 completion status ([1a35591](https://github.com/skyasu2/openmanager-vibe-v5/commit/1a35591a080a029f702d827e459b0b2639b5638b))
* update improvement-plan.md with Phase 3 completion status ([e0ca65d](https://github.com/skyasu2/openmanager-vibe-v5/commit/e0ca65d027fc9c8bf4acd0555f8bc00b401f6b58))
* update improvement-plan.md with Phase 3.1 completion status ([782d9af](https://github.com/skyasu2/openmanager-vibe-v5/commit/782d9af2a929c41f3c8f80f03ecade758d38237e))
* update references to deleted npm scripts ([655b58a](https://github.com/skyasu2/openmanager-vibe-v5/commit/655b58a23c6a3b98070a48f55633adc1f0809288))
* update script consolidation plan to v2.0.0 ([a9d7ea7](https://github.com/skyasu2/openmanager-vibe-v5/commit/a9d7ea77c0aeeda1c632a66452b1202d4035ed4e))
* update statistics after Phase 5 cleanup (311→300 files) ([cc9657b](https://github.com/skyasu2/openmanager-vibe-v5/commit/cc9657b47c6616f15b1db91bcfd77547b7f073e4))
* v5.80.0 post-upgrade maintenance 기록 업데이트 ([df33697](https://github.com/skyasu2/openmanager-vibe-v5/commit/df33697d36921c1d5696d2bde478650239ee40f4))
* 문서 정리 및 스크립트 참조 업데이트 ([9acca2f](https://github.com/skyasu2/openmanager-vibe-v5/commit/9acca2f6e16cc9ac81422c0f40e8d3f9afdbe6ba))
* 작업 계획서 정리 - 완료된 계획 아카이브 + TODO.md 통합 ([6a05857](https://github.com/skyasu2/openmanager-vibe-v5/commit/6a058575f1d11ea513cd6c0092ad87c4644c4cfb))

## [5.80.0] - 2025-11-15

### 🚀 Features

- **AI 엔진 개선**
  - UNIFIED/AUTO 모드 추가 (4c34e8f)
  - AI 엔진 단순화 및 최적화

### 🐛 Bug Fixes

- **Admin 모드 제거**
  - `useAdminMode` 참조 제거 (1dc6a06)
  - Admin 모드 제거 후 발생한 TypeScript 에러 수정 (b479aad)
  - Phase 2 - Admin 모드 완전 제거 (8e2e309)

- **타입스크립트**
  - 남아있던 TypeScript 에러 해결 (e5cb52f)
  - Lint 경고 해결 (cc1a637)

- **기타 수정**
  - `useTimerManager` async IIFE 구문 오류 수정 (78e2037)
  - 게스트 플로우 강화 및 레거시 문서 정리 (457033c)

### 📚 Documentation

- Lint 진행 상황 추적 및 프로젝트 분석 문서 추가 (a8a8f0d)
- 중복된 레거시 분석 문서 제거 (2fba402)

---

- debug: Error Boundary 로깅 시스템 추가 - 15개 TypeError 원인 추적 (3896662e)
- fix: 진짜 근본 원인 해결 - servers.length undefined 접근 15개 TypeError 완전 수정 (a0af7810)
- fix: ImprovedServerCard unsafe 배열 접근 패턴 수정 (6949483f)
- fix: 서버 카드 호버 에러 해결 - SafeServerCard 래퍼로 undefined 배열 접근 방지 (d57a1db5)
- fix: AI 엔진 URL 파싱 및 pgvector 함수 오류 수정 (9f681eaa)
- fix: AI Assistant 서버 카드 크래시 버그 완전 해결 + 테스트 안정화 (170f60fc)

#### Improved

- perf: 테스트 성능 44% 최적화 - 1인 AI 개발 맞춤 (181264af)

#### Documentation

- docs: README 최적화 및 문서 구조 개선 (0e8c3e17)
- docs: AI 시스템 이중 구조 문서화 개선 (e720f8f1)
- docs: Playwright MCP 복구 완전 가이드 + 시스템 개선 (19a71d3b)
- docs: v5.78.0 릴리즈 - 프로젝트 100% 완성 달성 (5b5a302f)
- docs: 베르셀 프로덕션 테스트 전략 + WSL Git 인증 가이드 완성 (cd2dec4b)

#### Testing

- feat: AI 친화적 테스트 시스템 구축 + 테스트 분리 최적화 (fe44b544)
- refactor: Mock 테스트 → 실제 환경 테스트 전략 전환 (ae42348c)
- feat: Google AI API 브라우저 테스트 페이지 추가 (0df54e43)
- fix: 폴백 메커니즘에 맞게 테스트 로직 수정 - 100% 통과 달성 (7127cf64)
- feat: 15개 서브에이전트 테스트 완료 + MCP 매핑 최적화 (a2ac9df8)

## [5.78.0] - 2025-09-21

### ✨ feat

#### 🎯 완료

- **프로젝트 완성도 100% 달성**: 90% → 100% 마무리 완료
  - ESLint 오류 완전 해결: 4개 → 0개 (코드 품질 100%)
  - 테스트 안정성: 54/55 통과 (98.2%) - skip된 1개 테스트 분석 완료
  - 프로덕션 배포 성공: 베르셀 자동 배포 트리거 완료
  - TypeScript strict 모드 100% 유지 (0개 에러)

### 🔧 fix

#### 🛠️ 개선사항

- **AdminClient.tsx React Hook 최적화**:
  - 불필요한 useEffect 무한 루프 방지 (useCallback 적용)
  - Floating Promise 문제 해결 (void 연산자 사용)
  - 사용하지 않는 Clock import 제거
- **backup-status API 최적화**:
  - 불필요한 async 키워드 제거 (실제 비동기 작업 없음)
  - 함수 시그니처 정확성 개선

### 🔒 security

#### 🛡️ 보안 상태

- **보안 취약점 현황**: 4개 low severity (devDependencies만 영향)
  - jsondiffpatch XSS 취약점 (Playwright MCP 체인 종속성)
  - 프로덕션 코드 영향 없음, 개발 환경만 해당
  - 수용 가능한 위험 수준으로 평가 완료

## [5.77.0] - 2025-09-07

### ✨ feat

#### 🚀 Added

- **TypeScript strict 모드 100% 완전 준수 달성**: 77개→0개 에러 완전 해결
  - noUncheckedIndexedAccess 완전 준수
  - 모든 undefined 접근 패턴 안전화 (?.와 ?? 활용)
  - Next.js 15.5.0 빌드 성공 (35초 컴파일)

### ♻️ refactor

#### 🔧 Improved

- **설계도 중복 문제 해결 및 문서 정리**: 구버전 아카이브, 현재 운영 상태 명시
  - `docs/architecture/system-design-blueprint-v5.md` → `docs/archive/future-plans/`로 이동
  - 현재 상태(`docs/system-architecture.md`) vs 미래 계획 명확히 구분
  - AI 도구 명명 정확성 개선: Codex → OpenAI CLI (Codex), ccusage → Claude 사용량 모니터링

### 🔧 fix

#### 🐛 Fixed

- **package.json 중복 키 해결**: deploy:check 중복 제거
- **Claude Code 메모리 최적화**: NODE_OPTIONS 4GB → 8GB로 증대

#### 📊 Updated

- **CLAUDE.md 실제 통계 반영**:
  - 코드베이스: 226,356줄, 873개 TypeScript 파일
  - Claude Code 버전: v1.0.107 최신 버전
  - WSL 메모리 사용률: 16.7% 정상 범위

## [이전 버전들]

상세한 이전 버전 히스토리는 다음 레거시 파일들을 참조하세요:

- **[CHANGELOG-LEGACY-1.md](./CHANGELOG-LEGACY-1.md)**: 2025년 8-9월 자동화 시스템 개발 기간
- **[CHANGELOG-LEGACY-2.md](./CHANGELOG-LEGACY-2.md)**: 2025년 8월 문서 체계화 기간
- **[CHANGELOG-LEGACY.md](./CHANGELOG-LEGACY.md)**: 2025년 5-8월 초기 개발 기간

---

> 🤖 이 CHANGELOG는 [스마트 자동 업데이트 시스템](./docs/development/smart-changelog-system.md)에 의해 관리됩니다.
