import React from 'react';

interface Props {
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  errorMsg: string;
}

export function AdminLoginForm({ password, setPassword, onSubmit, loading, errorMsg }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '48px' }}>🛡️</span>
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: '24px',
          letterSpacing: '-0.025em',
        }}>管理者ダッシュボード</h1>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}>管理者パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              placeholder="パスワードを入力"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              background: loading || !password ? 'rgba(59,130,246,0.4)' : 'var(--accent-blue)',
              color: '#ffffff',
              fontWeight: '600',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.95rem',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span> : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
