import React from 'react';

interface Props {
  auditLogs: any[];
}

function actionStyle(action: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    CREATE: { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
    UPDATE: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    DELETE: { background: 'rgba(239,68,68,0.15)', color: '#f87171' },
  };
  return map[action] || { background: 'rgba(100,116,139,0.15)', color: 'var(--text-muted)' };
}

export function AuditLogViewer({ auditLogs }: Props) {
  return (
    <div style={{
      marginTop: '32px',
      background: 'var(--bg-card)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ヘッダー */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '22px' }}>📋</span>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>システム監査ログ</h2>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          直近の操作履歴（最大100件）
        </span>
      </div>

      {/* テーブル */}
      <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              {['日時', '操作ユーザー', 'アクション', '対象データ'].map(h => (
                <th key={h} style={{
                  padding: '10px 20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'var(--bg-inset)',
                  position: 'sticky',
                  top: 0,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                  {new Date(log.changed_at).toLocaleString('ja-JP')}
                </td>
                <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-emerald)', borderBottom: '1px solid var(--border-color)' }}>
                  {log.changed_by}
                </td>
                <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{
                    ...actionStyle(log.action),
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    display: 'inline-block',
                  }}>
                    {log.action}
                  </span>
                  <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.entity_type}</span>
                </td>
                <td style={{
                  padding: '12px 20px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  borderBottom: '1px solid var(--border-color)',
                }}
                  title={JSON.stringify(log.new_data || log.old_data)}>
                  {log.entity_id}
                </td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  監査ログはまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
