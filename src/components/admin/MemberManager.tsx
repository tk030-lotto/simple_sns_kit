import React from 'react';

// 共通テーブルスタイル定数
const S = {
  card: {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
    display: 'flex' as const,
    flexDirection: 'column' as const,
  },
  cardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  th: {
    padding: '10px 20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textAlign: 'left' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    background: 'var(--bg-inset)',
    position: 'sticky' as const,
    top: 0,
  },
  td: {
    padding: '14px 20px',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    verticalAlign: 'middle' as const,
  },
  btnDanger: {
    background: 'transparent',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'background 0.15s ease',
  },
};

interface Props {
  members: any[];
  onUpdateRole: (id: string, newRole: string) => void;
  onDeleteMember: (id: string) => void;
}

export function MemberManager({ members, onUpdateRole, onDeleteMember }: Props) {
  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={{ fontSize: '22px' }}>👥</span>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>メンバー一覧</h2>
        <span style={{
          marginLeft: 'auto',
          background: 'var(--bg-inset)',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          padding: '3px 10px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
        }}>計 {members.length} 名</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={S.th}>表示名 / ID</th>
              <th style={S.th}>有効期限</th>
              <th style={S.th}>参加グループ</th>
              <th style={{ ...S.th, textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isExpired = new Date(m.expires_at) < new Date();
              return (
                <tr key={m.user_id} style={{ opacity: isExpired ? 0.5 : 1, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={S.td}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {m.display_name}
                      {m.role === 'admin' && (
                        <span style={{
                          padding: '2px 6px', fontSize: '10px',
                          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                          color: '#d6336c', borderRadius: '12px', fontWeight: 'bold',
                          border: '1px solid rgba(214, 51, 108, 0.3)',
                        }}>🛡️ ADMIN</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}
                      title={m.user_id}>
                      {m.user_id.length > 15 ? m.user_id.substring(0, 15) + '...' : m.user_id}
                    </div>
                  </td>
                  <td style={S.td}>
                    <div style={{ fontWeight: '500', color: isExpired ? 'var(--danger)' : 'var(--accent-emerald)', fontSize: '0.8rem' }}>
                      {new Date(m.expires_at).toLocaleString('ja-JP')}
                    </div>
                    {isExpired && <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>期限切れ</span>}
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {m.joined_groups && m.joined_groups.length > 0 ? (
                        m.joined_groups.filter((g: any) => g.is_community).map((g: any) => (
                          <span key={g.id} style={{
                            fontSize: '0.7rem',
                            background: 'var(--bg-inset)',
                            color: 'var(--text-secondary)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                          }}>{g.name}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {m.role !== 'admin' ? (
                        <button
                          onClick={() => onUpdateRole(m.user_id, 'admin')}
                          style={{
                            color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.3)', padding: '5px 10px',
                            borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', transition: 'background 0.15s',
                          }}
                          title="管理者に昇格"
                        >🛡️ 管理者にする</button>
                      ) : (
                        <button
                          onClick={() => onUpdateRole(m.user_id, 'member')}
                          style={{
                            color: 'var(--text-secondary)', background: 'var(--bg-inset)',
                            border: '1px solid var(--border-color)', padding: '5px 10px',
                            borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', transition: 'background 0.15s',
                          }}
                          title="一般メンバーに戻す"
                        >👤 一般に戻す</button>
                      )}
                      <button
                        onClick={() => onDeleteMember(m.user_id)}
                        style={{ ...S.btnDanger }}
                        title="強制削除（アクセス停止）"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '18px' }}>🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                  登録されているメンバーはいません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
