import React from 'react';
import { useRouter } from 'next/navigation';
import { styles } from './VerifyStyles';

interface Props {
  errorMsg: string;
  hasQueryCode: boolean;
  onRetry: () => void;
}

export function VerifyError({ errorMsg, hasQueryCode, onRetry }: Props) {
  const router = useRouter();
  
  return (
    <div style={styles.card}>
      <div style={styles.errorIcon}>
        <svg style={styles.svgIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
      <h2 style={{ ...styles.title, background: 'linear-gradient(to right, #ef4444, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        認証に失敗しました
      </h2>
      <p style={styles.subtitle}>
        合言葉が正しくないか、期限が切れています。
      </p>

      <div style={styles.errorBox}>
        <span style={styles.errorText}>{errorMsg}</span>
      </div>

      {hasQueryCode ? (
        <div style={styles.actionGroup}>
          <button onClick={onRetry} style={styles.buttonSecondary}>
            手動で合言葉を入力する
          </button>
          <button onClick={() => router.push('/')} style={styles.buttonOutline}>
            メイン画面に戻る
          </button>
        </div>
      ) : (
        <button onClick={onRetry} style={styles.buttonPrimary}>
          戻る
        </button>
      )}
    </div>
  );
}
