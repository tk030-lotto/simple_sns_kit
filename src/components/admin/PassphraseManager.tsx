import React from 'react';

interface Props {
  passphrases: any[];
  newPassphraseCode: string;
  setNewPassphraseCode: (val: string) => void;
  newPassphraseValidity: string;
  setNewPassphraseValidity: (val: string) => void;
  newGroupName: string;
  setNewGroupName: (val: string) => void;
  onCreatePassphrase: (e: React.FormEvent) => void;
  onDeletePassphrase: (code: string) => void;
  loading: boolean;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-inset)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  padding: '8px 12px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export function PassphraseManager({
  passphrases, newPassphraseCode, setNewPassphraseCode,
  newPassphraseValidity, setNewPassphraseValidity,
  newGroupName, setNewGroupName,
  onCreatePassphrase, onDeletePassphrase, loading
}: Props) {
  return (
    <div style={{
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
        <span style={{ fontSize: '22px' }}>🔑</span>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>合言葉の管理</h2>
      </div>

      {/* 新規作成フォーム */}
      <div style={{
        padding: '20px 24px',
        background: 'rgba(0,0,0,0.15)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <form onSubmit={onCreatePassphrase} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newPassphraseCode}
              onChange={(e) => setNewPassphraseCode(e.target.value)}
              placeholder="新しい合言葉 (例: 2026-spring)"
              style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
              required
            />
            <select
              value={newPassphraseValidity}
              onChange={(e) => setNewPassphraseValidity(e.target.value)}
              style={{ ...inputStyle, width: 'auto' }}
            >
              <option value="month">1ヶ月有効</option>
              <option value="year">1年間有効</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="グループ名 (例: Aチーム) ※作成する場合"
              style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'rgba(245,158,11,0.4)' : 'var(--accent-amber)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: '16px' }}>➕</span> 作成
            </button>
          </div>
        </form>
      </div>

      {/* 一覧テーブル */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              {['合言葉', '登録可能期限', '操作'].map((h, i) => (
                <th key={h} style={{
                  padding: '10px 20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  textAlign: i === 2 ? 'right' : 'left',
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
            {passphrases.map((p) => (
              <tr key={p.code_token}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: '600', color: 'var(--accent-amber)', borderBottom: '1px solid var(--border-color)' }}>
                  {p.code_token}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  {new Date(p.valid_until).toLocaleString('ja-JP')}
                  <span style={{
                    marginLeft: '8px', fontSize: '0.7rem', color: 'var(--text-muted)',
                    background: 'var(--bg-inset)', padding: '2px 8px', borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                  }}>
                    {p.target_month === 'yearly' ? '1年間' : '1ヶ月'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => onDeletePassphrase(p.code_token)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background 0.15s' }}
                    title="削除"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '18px' }}>🗑️</span>
                  </button>
                </td>
              </tr>
            ))}
            {passphrases.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  登録されている合言葉はありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
