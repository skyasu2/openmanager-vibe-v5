# Utility Functions

## 📊 Data Processing

```typescript
// formatBytes - Human readable file sizes
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// formatPercentage - Format percentage with color
export const formatPercentage = (value: number, total = 100) => {
  const percentage = Math.round((value / total) * 100);
  const color =
    percentage > 80
      ? 'text-red-500'
      : percentage > 60
        ? 'text-yellow-500'
        : 'text-green-500';

  return { percentage, color, display: `${percentage}%` };
};
```

## ⏰ Time Utilities

```typescript
// formatTimeAgo - Relative time formatting
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();

  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;

  if (diffMs < minute) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < week) return `${Math.floor(diffMs / day)}d ago`;

  return then.toLocaleDateString();
};

// parseTimeRange - Convert string to milliseconds
export const parseTimeRange = (range: string): number => {
  const ranges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return ranges[range as keyof typeof ranges] || ranges['1h'];
};
```

## 🔍 Validation Helpers

```typescript
// isValidEmail - Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// isValidServerId - Server ID validation
export const isValidServerId = (id: string): boolean => {
  return /^server-[a-z0-9]+-\d{2}$/.test(id);
};

// sanitizeInput - XSS prevention
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .trim()
    .substring(0, 255); // Limit length
};
```

## 🎨 UI Utilities

```typescript
// cn - Conditional class names (clsx alternative)
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

// getStatusColor - Status to color mapping
export const getStatusColor = (status: string): string => {
  const colors = {
    healthy: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
    unknown: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[status as keyof typeof colors] || colors.unknown;
};

// truncateText - Smart text truncation
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
```

## 🔢 Math Utilities

```typescript
// clamp - Constrain number between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// average - Calculate average of numbers
export const average = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

// roundToDecimals - Round to specific decimal places
export const roundToDecimals = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};
```

## 🔗 URL Utilities

```typescript
// buildApiUrl - Construct API URLs with params
export const buildApiUrl = (
  path: string,
  params: Record<string, string | number | boolean> = {}
): string => {
  const url = new URL(path, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value.toString());
    }
  });

  return url.toString();
};

// parseQueryParams - Extract query parameters
export const parseQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  for (const [key, value] of params) {
    result[key] = value;
  }

  return result;
};
```

## 💾 Storage Utilities

```typescript
// safeJsonParse - Safe JSON parsing
export const safeJsonParse = <T>(json: string | null, fallback: T): T => {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

// isClientSide - Check if running in browser
export const isClientSide = (): boolean => {
  return typeof window !== 'undefined';
};

// sleep - Promise-based delay
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
```

## 🎯 Type Guards

```typescript
// Type guard utilities
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const hasProperty = <T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> => {
  return isObject(obj) && prop in obj;
};
```
