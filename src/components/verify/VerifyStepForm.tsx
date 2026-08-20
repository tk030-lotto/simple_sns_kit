import React from 'react';
import { useRouter } from 'next/navigation';
import { styles } from './VerifyStyles';

interface Props {
  isExistingUser: boolean;
  displayName: string;
  setDisplayName: (val: string) => void;
  code: string;
  setCode: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function VerifyStepForm({ isExistingUser, displayName, setDisplayName, code, setCode, onSubmit }: Props) {
  const router = useRouter();

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{isExistingUser ? 'グループ参加・有効期限更新' : '新規ユーザー登録・認証'}</h2>
      <p style={styles.subtitle}>
        {isExistingUser 
          ? '管理者から共有された「合言葉」を入力して、新しいグループに参加、またはアクセス有効期限を更新します。' 
          : '管理者から共有された「合言葉」と「お名前」を入力して、システムへのユーザー登録とグループへの参加を完了してください。'}
      </p>

      <form onSubmit={onSubmit} style={styles.form}>
        {!isExistingUser && (
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>あなたの表示名（ニックネーム）</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: 山田 太郎"
              style={styles.input}
              required={!isExistingUser}
            />
            <span style={styles.inputHelp}>
              タイムラインで表示される名前です。後から変更することも可能です。
            </span>
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>合言葉</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="合言葉を入力"
            style={styles.input}
            required
            autoFocus={isExistingUser}
          />
        </div>

        <button type="submit" style={styles.buttonPrimary}>
          参加登録する
        </button>
      </form>

      <button onClick={() => router.push('/')} style={styles.buttonOutline}>
        タイムラインへ戻る
      </button>
    </div>
  );
}
