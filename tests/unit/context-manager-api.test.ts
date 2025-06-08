import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST, PUT, DELETE } from '@/app/api/admin/context-manager/route';
import { ContextLoader } from '@/modules/mcp/ContextLoader';
import { NextRequest } from 'next/server';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Admin Context Manager API', () => {
  it('upload-bundle 호출 시 ContextLoader.uploadContextBundle이 실행된다', async () => {
    const loader = ContextLoader.getInstance();
    const spy = vi.spyOn(loader, 'uploadContextBundle').mockResolvedValue(true);

    const req = new NextRequest('http://localhost/api/admin/context-manager', {
      method: 'POST',
      body: JSON.stringify({
        action: 'upload-bundle',
        bundleType: 'advanced',
        bundleData: { documents: { markdown: {}, patterns: {} } }
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await POST(req);
    const data = await res.json();

    expect(spy).toHaveBeenCalledWith('advanced', { documents: { markdown: {}, patterns: {} } }, undefined);
    expect(data.success).toBe(true);
  });

  it('invalidate-cache 호출 시 ContextLoader.invalidateCache가 실행된다', async () => {
    const loader = ContextLoader.getInstance();
    const spy = vi.spyOn(loader, 'invalidateCache');

    const req = new NextRequest('http://localhost/api/admin/context-manager', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalidate-cache' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await POST(req);
    const data = await res.json();

    expect(spy).toHaveBeenCalled();
    expect(data.success).toBe(true);
  });

  it('update-bundle-metadata 호출 시 ContextLoader.updateBundleMetadata가 실행된다', async () => {
    const loader = ContextLoader.getInstance();
    const spy = vi.spyOn(loader, 'updateBundleMetadata').mockResolvedValue(true);

    const req = new NextRequest('http://localhost/api/admin/context-manager', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'update-bundle-metadata',
        bundleType: 'advanced',
        metadata: { version: '1.1.0' }
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(spy).toHaveBeenCalledWith('advanced', { version: '1.1.0' }, undefined);
    expect(data.success).toBe(true);
  });

  it('delete-bundle 호출 시 ContextLoader.deleteContextBundle이 실행된다', async () => {
    const loader = ContextLoader.getInstance();
    const spy = vi.spyOn(loader, 'deleteContextBundle').mockResolvedValue(true);

    const req = new NextRequest('http://localhost/api/admin/context-manager?action=delete-bundle&bundleType=advanced', {
      method: 'DELETE'
    });

    const res = await DELETE(req);
    const data = await res.json();

    expect(spy).toHaveBeenCalledWith('advanced', null as any);
    expect(data.success).toBe(true);
  });
});
