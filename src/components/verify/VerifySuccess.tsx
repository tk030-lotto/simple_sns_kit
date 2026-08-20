import React from 'react';
import { useRouter } from 'next/navigation';
import { styles } from './VerifyStyles';

// 日本時間 (JST) フォーマット用ヘルパー
function formatJSTDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    // タイムゾーンを日本時間に固定してフォーマット
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    
    return formatter.format(date) + ' (JST)';
  } catch (err) {
    return dateStr;
  }
}

interface Props {
  activeUser: string;
  expiresAt: string;
}

export function VerifySuccess({ activeUser, expiresAt }: Props) {
  const router = useRouter();
  return (
    <div style={styles.card}>
      <div style={styles.successIcon}>
        <svg style={styles.svgIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={{ ...styles.title, background: 'linear-gradient(to right, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        登録が完了しました！
      </h2>
      <p style={styles.subtitle}>
        アカウントが有効化されました。コミュニティへようこそ。
      </p>
      
      <div style={styles.detailsBox}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>対象ユーザーID:</span>
          <span style={styles.detailValue}>{activeUser.length > 12 ? activeUser.substring(0, 12) + '...' : activeUser}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>アクセス有効期限:</span>
          <span style={{ ...styles.detailValue, color: '#10b981', fontWeight: 'bold' }}>
            {formatJSTDate(expiresAt)}
          </span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>ステータス:</span>
          <span style={styles.badgeSuccess}>アクティブ</span>
        </div>
      </div>

      <button onClick={() => router.push('/')} style={styles.buttonPrimary}>
        SNSタイムラインへ移動
      </button>
    </div>
  );
}
