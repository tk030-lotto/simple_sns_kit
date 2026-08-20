import React, { useState } from 'react';
import { User } from '@/types';
import { setCookie } from '@/lib/cookies';
import { browserStore } from '@/lib/browser-store';

export const DEFAULT_USERS = [
  { id: 'admin_user', name: 'システム管理者 (佐藤)', role: 'admin' },
  { id: 'member_user', name: '一般ユーザー (山田)', role: 'member' },
  { id: 'user_a', name: 'Aさん', role: 'member' },
  { id: 'user_b', name: 'Bさん', role: 'member' },
  { id: 'user_c', name: 'Cさん', role: 'member' },
  { id: 'user_d', name: 'Dさん', role: 'member' },
  { id: 'user_e', name: 'Eさん', role: 'member' },
  { id: 'user_f', name: 'Fさん', role: 'member' },
  { id: 'user_g', name: 'Gさん', role: 'member' },
  { id: 'user_h', name: 'Hさん', role: 'member' },
  { id: 'expired_user', name: '期限切れユーザー (田中)', role: 'member' },
  { id: 'guest_user', name: '未登録の外部ゲスト', role: 'member' },
];

interface Props {
  currentUser: User | null;
}

export function UserSimulator({ currentUser }: Props) {
  const [isSimOpen, setIsSimOpen] = useState(false);

  // ストアから最新のユーザー名やアバターを取得
  const users = DEFAULT_USERS.map(u => {
    const stored = browserStore.getUser(u.id);
    if (stored) {
      return {
        ...u,
        name: stored.display_name || u.name,
        role: stored.role || u.role,
        avatarUrl: stored.avatar_url
      };
    }
    if (currentUser && u.id === currentUser.id) {
      return {
        ...u,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl
      };
    }
    return u;
  });

  const handleSwitchUser = (id: string, name: string, role: string) => {
    const stored = browserStore.getUser(id);
    const finalName = stored?.display_name || name;
    const finalRole = stored?.role || role;
    const avatarUrl = stored?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`;

    setCookie('sns_user_id', id);
    setCookie('sns_user_name', encodeURIComponent(finalName));
    setCookie('sns_user_role', finalRole);
    setCookie('sns_avatar_url', encodeURIComponent(avatarUrl));

    window.location.reload();
  };

  return (
    <div className="user-simulator glass-panel" style={{ marginBottom: '16px' }}>
      <div className="simulator-header" onClick={() => setIsSimOpen(!isSimOpen)} style={{ cursor: 'pointer' }}>
        <div className="simulator-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span>⚙️</span>
          <span>ユーザー切り替えシミュレーター（検証・デモ用）</span>
        </div>
        <span className={`simulator-toggle-icon ${isSimOpen ? 'open' : ''}`}>▼</span>
      </div>
      {isSimOpen && (
        <div className="simulator-body" style={{ marginTop: '12px' }}>
          <p className="simulator-description" style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
            クリックするとログインユーザーが切り替わり、管理者権限、別ユーザー視点での投稿・リアクション、有効期限チェックの動作確認が可能です。
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {users.map((u) => {
              const isActive = currentUser?.id === u.id;
              const defaultSeed = encodeURIComponent(u.name.replace('さん', '').split(' ')[0]);
              const imgUrl = (u as any).avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${defaultSeed}`;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSwitchUser(u.id, u.name, u.role)}
                  className={`simulator-user-btn ${isActive ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                    background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div className="simulator-avatar" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                    <img
                      src={imgUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="simulator-user-details" style={{ overflow: 'hidden' }}>
                    <span className="simulator-user-name" style={{ display: 'block', fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{u.name}</span>
                    <span className="simulator-user-role" style={{ fontSize: '10px', color: u.role === 'admin' ? '#f43f5e' : '#94a3b8', fontWeight: 600 }}>{u.role.toUpperCase()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
