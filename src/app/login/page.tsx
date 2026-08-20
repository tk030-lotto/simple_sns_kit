'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [agreement1, setAgreement1] = useState(false);
  const [agreement2, setAgreement2] = useState(false);
  const [agreement3, setAgreement3] = useState(false);
  const [version, setVersion] = useState('1.0.0');

  useEffect(() => {
    // クライアントサイドでのみ環境変数を取得
    const envVersion = process.env.NEXT_PUBLIC_LICENSE_AGREEMENT_VERSION || '1.0.0';
    setVersion(envVersion);
  }, []);

  const handleAgree = () => {
    if (agreement1 && agreement2 && agreement3) {
      const cookieName = `sns_license_accepted_v${version}`;
      // 有効期限を1年間（31,536,000秒）に設定
      document.cookie = `${cookieName}=true; path=/; max-age=31536000; SameSite=Lax`;
      
      // メイン画面へ遷移
      router.push('/');
      router.refresh(); // Middlewareの再判定を促すためリフレッシュ
    }
  };

  const isAllChecked = agreement1 && agreement2 && agreement3;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>コミュニティ参加のルール</h1>
        <p style={styles.subtitle}>
          当コミュニティのSNSを利用する前に、以下の参加ルールと注意事項をご確認いただき、同意をお願いします。
        </p>

        <div style={styles.termsBox}>
          <div style={styles.termItem}>
            <div style={styles.termHeader}>
              <span style={styles.badge}>ルール 1</span>
              <strong style={styles.termTitle}>システムは「現状のまま」での提供です</strong>
            </div>
            <p style={styles.termText}>
              本SNSは提供された状態での利用となり、機能の完全性やバグがないことを保証するものではありません。不具合修正の義務は負いかねますので、ご了承ください。
            </p>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={agreement1}
                onChange={(e) => setAgreement1(e.target.checked)}
                style={styles.checkbox}
              />
              <span>上記の事項を理解し、同意します。</span>
            </label>
          </div>

          <div style={styles.termItem}>
            <div style={styles.termHeader}>
              <span style={styles.badge}>ルール 2</span>
              <strong style={styles.termTitle}>自己責任でのご利用</strong>
            </div>
            <p style={styles.termText}>
              本SNSの利用、または利用できなかったことにより生じたトラブルや損害（データの消失など）について、運営・開発者は一切の責任を負いません。ご自身の責任での利用をお願いいたします。
            </p>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={agreement2}
                onChange={(e) => setAgreement2(e.target.checked)}
                style={styles.checkbox}
              />
              <span>自己責任での利用について理解し、同意します。</span>
            </label>
          </div>

          <div style={styles.termItem}>
            <div style={styles.termHeader}>
              <span style={styles.badge}>ルール 3</span>
              <strong style={styles.termTitle}>思いやりのあるコミュニケーションを</strong>
            </div>
            <p style={styles.termText}>
              他の参加者を尊重し、誹謗中傷や迷惑行為を行わないようお願いします。コミュニティの健全な運営にご協力ください。
            </p>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={agreement3}
                onChange={(e) => setAgreement3(e.target.checked)}
                style={styles.checkbox}
              />
              <span>ルールを守って楽しく利用することに同意します。</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleAgree}
          disabled={!isAllChecked}
          style={isAllChecked ? styles.buttonActive : styles.buttonDisabled}
        >
          同意してコミュニティに参加する
        </button>

        <div style={styles.footer}>
          Agreement Version: v{version}
        </div>
      </div>
    </div>
  );
}

// プレミアムなインラインスタイル定義 (Vibrant Dark, Glassmorphism)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'radial-gradient(circle at top left, #1e293b, #0f172a)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '640px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    boxSizing: 'border-box',
    color: '#f8fafc',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 0 10px 0',
    background: 'linear-gradient(to right, #38bdf8, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: '1.6',
    margin: '0 0 30px 0',
  },
  termsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    margin: '0 0 30px 0',
  },
  termItem: {
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  termHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  badge: {
    background: 'rgba(56, 189, 248, 0.2)',
    color: '#38bdf8',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  termTitle: {
    fontSize: '16px',
    color: '#e2e8f0',
  },
  termText: {
    fontSize: '13px',
    color: '#cbd5e1',
    margin: '0',
    lineHeight: '1.6',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#38bdf8',
    cursor: 'pointer',
    marginTop: '5px',
    userSelect: 'none',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#38bdf8',
  },
  buttonActive: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
  },
  buttonDisabled: {
    width: '100%',
    padding: '14px',
    background: '#334155',
    border: 'none',
    borderRadius: '8px',
    color: '#64748b',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
  },
  footer: {
    fontSize: '11px',
    color: '#475569',
    textAlign: 'center',
    marginTop: '20px',
  },
};
