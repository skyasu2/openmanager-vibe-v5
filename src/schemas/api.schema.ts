/**
 * 📡 API Schema Index - Modular Architecture
 * 
 * Centralized export point for all API-related schemas
 * - Imports and re-exports from 13 specialized modules
 * - Maintains clean separation of concerns
 * - Single point of access for all API schemas
 * 
 * Modules:
 * - AI: AI queries, responses, and analysis
 * - Auth: Authentication and OAuth
 * - Cache: Caching strategies and operations  
 * - Dashboard: Dashboard APIs and data
 * - Database: Database operations and migrations
 * - DevTools: Development and debugging tools
 * - Health: System health checks and monitoring
 * - MCP: Model Context Protocol communications
 * - Notifications: Alert and notification systems
 * - Server: Server management and metrics
 * - Streaming: Real-time data streaming
 * - Alert: Alert management and rules
 * - Common: Shared schemas and utilities
 */

// ===== AI Schemas =====
export * from './api.ai.schema';

// ===== Alert Schemas =====
export * from './api.alert.schema';

// ===== Authentication Schemas =====
export * from './api.auth.schema';

// ===== Cache Schemas =====
export * from './api.cache.schema';

// ===== Common API Schemas =====
export * from './api.common.schema';

// ===== Dashboard Schemas =====
export * from './api.dashboard.schema';

// ===== Database Schemas =====
export * from './api.database.schema';

// ===== DevTools Schemas =====
export * from './api.devtools.schema';

// ===== Health Check Schemas =====
export * from './api.health.schema';

// ===== MCP Schemas =====
export * from './api.mcp.schema';

// ===== Notification Schemas =====
export * from './api.notification.schema';

// ===== Server Schemas =====
export * from './api.server.schema';

// ===== Streaming Schemas =====
export * from './api.streaming.schema';

/**
 * 🎯 Architecture Benefits:
 * 
 * Before: 1859 lines monolithic file
 * After: 13 specialized modules + 1 index file
 * 
 * - 📦 Modular: Each domain has its own file
 * - 🔍 Discoverable: Clear module organization
 * - 🛠️ Maintainable: Easy to locate and update schemas  
 * - 🔄 Reusable: Modules can be imported independently
 * - ⚡ Performance: Better tree-shaking and bundling
 */