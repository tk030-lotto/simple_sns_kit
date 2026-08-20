import React from 'react';
import { styles } from './VerifyStyles';

export function VerifyLoading() {
  return (
    <div style={styles.card}>
      <div style={styles.spinnerContainer}>
        <div style={styles.spinner}></div>
      </div>
      <h2 style={styles.title}>合言葉を検証中</h2>
      <p style={styles.subtitle}>
        コミュニティへの参加コードを確認しています。しばらくお待ちください...
      </p>
    </div>
  );
}

export function VerifySuspenseLoading() {
  return (
    <div style={styles.card}>
      <div style={styles.spinnerContainer}>
        <div style={styles.spinner}></div>
      </div>
      <h2 style={styles.title}>検証準備中...</h2>
    </div>
  );
}
