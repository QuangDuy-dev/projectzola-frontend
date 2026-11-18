import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { UserSessionDto } from '../types';

/**
 * [OFFLOAD_TO_DEV2] Contract tests for ActiveSessionsPanel.
 *
 * Expected file: src/features/profile/ActiveSessionsPanel.tsx
 * Expected export: export function ActiveSessionsPanel(props: ActiveSessionsPanelProps)
 *
 * Props contract:
 * - sessions: UserSessionDto[]
 * - isLoading?: boolean
 * - error?: string | null
 * - revokingSessionId?: string | null
 * - isLoggingOutAll?: boolean
 * - onRevokeSession: (sessionId: string) => void | Promise<void>
 * - onLogoutAll: () => void | Promise<void>
 */
describe('ActiveSessionsPanel [OFFLOAD_TO_DEV2]', () => {
  const sampleSessions: UserSessionDto[] = [
    {
      id: 'sess-1',
      deviceInfo: 'Chrome 130 on Windows 11',
      ipAddress: '192.168.1.10',
      createdAt: '2026-11-18T10:00:00Z',
      lastUsedAt: '2026-11-19T02:00:00Z',
      expiresAt: '2026-11-25T10:00:00Z',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      deviceInfo: 'Safari on iPhone 16',
      ipAddress: '10.0.0.42',
      createdAt: '2026-11-17T08:00:00Z',
      lastUsedAt: '2026-11-18T21:30:00Z',
      expiresAt: '2026-11-24T08:00:00Z',
      isCurrent: false,
    },
  ];

  async function loadPanel() {
    const modulePath = '../features/profile/ActiveSessionsPanel';
    const mod = await import(/* @vite-ignore */ modulePath);
    return mod.ActiveSessionsPanel as React.ComponentType<{
      sessions: UserSessionDto[];
      isLoading?: boolean;
      error?: string | null;
      revokingSessionId?: string | null;
      isLoggingOutAll?: boolean;
      onRevokeSession: (sessionId: string) => void | Promise<void>;
      onLogoutAll: () => void | Promise<void>;
    }>;
  }

  it('renders active sessions list with current device indicator and revoke action', async () => {
    const ActiveSessionsPanel = await loadPanel();
    const html = renderToStaticMarkup(
      React.createElement(ActiveSessionsPanel, {
        sessions: sampleSessions,
        onRevokeSession: () => undefined,
        onLogoutAll: () => undefined,
      })
    );

    expect(html).toContain('Chrome 130 on Windows 11');
    expect(html).toContain('Safari on iPhone 16');
    expect(html).toContain('192.168.1.10');
    expect(html).toContain('10.0.0.42');
  });

  it('renders empty state when there are no active sessions', async () => {
    const ActiveSessionsPanel = await loadPanel();
    const html = renderToStaticMarkup(
      React.createElement(ActiveSessionsPanel, {
        sessions: [],
        isLoading: false,
        onRevokeSession: () => undefined,
        onLogoutAll: () => undefined,
      })
    );

    expect(html.trim().length).toBeGreaterThan(0);
  });

  it('renders loading state when isLoading is true', async () => {
    const ActiveSessionsPanel = await loadPanel();
    const html = renderToStaticMarkup(
      React.createElement(ActiveSessionsPanel, {
        sessions: [],
        isLoading: true,
        onRevokeSession: () => undefined,
        onLogoutAll: () => undefined,
      })
    );

    expect(html.trim().length).toBeGreaterThan(0);
  });
});
