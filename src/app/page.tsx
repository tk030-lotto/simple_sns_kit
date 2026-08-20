'use client';

import { useState, useEffect, useRef } from 'react';
import { getCookie, setCookie } from '@/lib/cookies';
import { User, Post, Group } from '@/types';
import { browserStore } from '@/lib/browser-store';
import { UserSimulator } from '@/components/UserSimulator';
import { ProfileModal } from '@/components/modals/ProfileModal';
import { GroupModal } from '@/components/modals/GroupModal';
import { JoinGroupModal } from '@/components/modals/JoinGroupModal';
import { PostForm } from '@/components/PostForm';
import { PostList } from '@/components/PostList';

function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(15,23,42,0.95)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '8px',
      zIndex: 9999,
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px'
    }}>
      {msg}
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [isJoinGroupModalOpen, setIsJoinGroupModalOpen] = useState(false);
  const [joinGroupError, setJoinGroupError] = useState('');

  const backupInputRef = useRef<HTMLInputElement | null>(null);

  // 1. 初期ユーザーの解決とストア同期
  const loadUserData = () => {
    let id = getCookie('sns_user_id');
    let name = getCookie('sns_user_name');
    let role = getCookie('sns_user_role');
    let avatarUrl = getCookie('sns_avatar_url');

    if (!id) {
      id = 'member_user';
      name = '一般ユーザー (山田)';
      role = 'member';
      avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=Yamada`;

      setCookie('sns_user_id', id);
      setCookie('sns_user_name', encodeURIComponent(name));
      setCookie('sns_user_role', role);
      setCookie('sns_avatar_url', encodeURIComponent(avatarUrl));
    }

    const finalId = id || 'member_user';
    const stored = browserStore.getUser(finalId);
    
    const finalName = stored?.display_name || (name ? decodeURIComponent(name) : '一般ユーザー');
    const finalRole = stored?.role || role || 'member';
    const finalAvatar = stored?.avatar_url || (avatarUrl ? decodeURIComponent(avatarUrl) : undefined);

    const user: User = { id: finalId, name: finalName, role: finalRole, avatarUrl: finalAvatar };
    setCurrentUser(user);

    // 有効期限チェック
    if (!browserStore.isUserActive(finalId)) {
      setExpired(true);
    } else {
      setExpired(false);
    }

    return user;
  };

  // 2. タイムライン投稿一覧の取得
  const refreshPosts = (userId: string, groupId?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const data = browserStore.getPosts(userId, groupId);
      setPosts(data || []);
    } catch (err: any) {
      console.error(err);
      setError('投稿データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const refreshGroups = (userId: string) => {
    try {
      const groupList = browserStore.getGroups(userId);
      setGroups(groupList || []);
      if (currentGroupId && !groupList.some(g => g.id === currentGroupId)) {
        setCurrentGroupId(null);
        setActiveTab('ALL');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshUsers = () => {
    try {
      const storedUsers = browserStore.getUsers();
      setUsers(storedUsers.map(u => ({
        id: u.user_id,
        name: u.display_name || u.user_id,
        role: u.role,
        avatarUrl: u.avatar_url
      })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const user = loadUserData();
    if (user?.id) {
      refreshGroups(user.id);
      refreshPosts(user.id, currentGroupId);
      refreshUsers();
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      refreshPosts(currentUser.id, currentGroupId);
    }
  }, [currentGroupId]);

  useEffect(() => {
    if (isGroupModalOpen) {
      refreshUsers();
    }
  }, [isGroupModalOpen]);

  // ファイルを Base64 Data URL に変換するヘルパー
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`ファイル「${file.name}」の読み込みに失敗しました`));
      reader.readAsDataURL(file);
    });
  };

  // 投稿送信ハンドラ
  const handlePostSubmit = async (content: string, files: File[], targetGroupId: string | null): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      // ファイルを Base64 に変換
      const mediaUrls: string[] = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          showToast(`ファイル「${file.name}」が5MBを超えています。`);
          return false;
        }
        const base64Url = await readFileAsDataUrl(file);
        mediaUrls.push(base64Url);
      }

      const newPost = browserStore.createPost({
        userId: currentUser.id,
        userName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        content: content.trim(),
        mediaUrls,
        targetGroupId: targetGroupId || null,
        targetUserId: null
      });

      setPosts(prev => [newPost, ...prev]);
      showToast('投稿しました！');
      return true;
    } catch (err: any) {
      console.error(err);
      showToast(err.message || '投稿に失敗しました。');
      return false;
    }
  };

  // 投稿削除
  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    if (!confirm('この投稿を削除しますか？')) return;

    try {
      const success = browserStore.deletePost(postId, currentUser.id);
      if (success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        showToast('投稿を削除しました。');
      } else {
        showToast('削除権限がありません。');
      }
    } catch (err) {
      showToast('削除処理中にエラーが発生しました。');
    }
  };

  // リアクション切替
  const handleToggleReaction = async (postId: string) => {
    if (!currentUser) return;
    try {
      const { myReaction, reactionsCount } = browserStore.toggleReaction(postId, currentUser.id);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, my_reaction: myReaction, reactions_count: reactionsCount } : p));
    } catch (err: any) {
      showToast(err.message || 'エラーが発生しました。');
    }
  };

  // プロフィール保存
  const handleSaveProfile = async (displayName: string, avatarFile: File | null): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      let finalAvatarUrl = currentUser.avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await readFileAsDataUrl(avatarFile);
      }

      browserStore.updateUserProfile(currentUser.id, displayName, finalAvatarUrl);
      
      setCurrentUser(prev => prev ? { ...prev, name: displayName, avatarUrl: finalAvatarUrl } : null);
      setCookie('sns_user_name', encodeURIComponent(displayName));
      if (finalAvatarUrl) setCookie('sns_avatar_url', encodeURIComponent(finalAvatarUrl));

      setIsProfileModalOpen(false);
      showToast('プロフィールを更新しました！');
      refreshPosts(currentUser.id, currentGroupId);
      return true;
    } catch (e: any) {
      showToast('プロフィールの保存に失敗しました: ' + e.message);
      return false;
    }
  };

  // 合言葉でグループ参加 / 認証
  const handleJoinGroup = async (code: string): Promise<boolean> => {
    if (!currentUser) return false;
    setJoinGroupError('');
    try {
      const res = browserStore.verifyCode(code, currentUser.id, currentUser.name);
      if (!res.success) {
        setJoinGroupError(res.error || '合言葉が無効です。');
        return false;
      }
      setIsJoinGroupModalOpen(false);
      showToast('合言葉による認証・参加が完了しました！');
      refreshGroups(currentUser.id);
      refreshPosts(currentUser.id, currentGroupId);
      setExpired(false);
      return true;
    } catch (err) {
      setJoinGroupError('処理中にエラーが発生しました。');
      return false;
    }
  };

  // グループ作成
  const handleCreateGroup = async (name: string, members: string[]): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      browserStore.createGroup(name, currentUser.id, members);
      showToast(`グループ「${name}」を作成しました！`);
      setIsGroupModalOpen(false);
      refreshGroups(currentUser.id);
      return true;
    } catch (err: any) {
      showToast('グループ作成失敗: ' + err.message);
      return false;
    }
  };

  // グループ削除
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!currentUser) return;
    if (!confirm(`グループ「${groupName}」を削除しますか？`)) return;
    try {
      const ok = browserStore.deleteGroup(groupId, currentUser.id);
      if (ok) {
        showToast(`グループ「${groupName}」を削除しました。`);
        refreshGroups(currentUser.id);
        if (currentGroupId === groupId) {
          setCurrentGroupId(null);
          setActiveTab('ALL');
        }
      } else {
        showToast('削除権限がありません。');
      }
    } catch (e: any) {
      showToast('削除失敗: ' + e.message);
    }
  };

  // グループ退出
  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!currentUser) return;
    if (!confirm(`グループ「${groupName}」から退出しますか？`)) return;
    try {
      browserStore.leaveGroup(groupId, currentUser.id);
      showToast(`グループ「${groupName}」から退出しました。`);
      refreshGroups(currentUser.id);
      if (activeTab === groupId) {
        setActiveTab('ALL');
        setCurrentGroupId(null);
      }
    } catch (err) {
      showToast('エラーが発生しました。');
    }
  };

  // データエクスポート（バックアップ）
  const handleExportData = () => {
    try {
      const json = browserStore.exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sns_kit_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('バックアップJSONをダウンロードしました。');
    } catch (e) {
      showToast('エクスポートに失敗しました。');
    }
  };

  // データインポート（リストア）
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const ok = browserStore.importData(text);
        if (ok) {
          showToast('データを復元しました。再読み込みします。');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('JSONファイルの形式が正しくありません。');
        }
      } catch (err) {
        showToast('インポート中にエラーが発生しました。');
      }
    };
    reader.readAsText(file);
  };

  // 初期データリセット
  const handleResetData = () => {
    if (!confirm('全ての投稿・グループデータを初期状態にリセットしますか？')) return;
    browserStore.ensureInitialData(true);
    showToast('初期状態にリセットしました。');
    setTimeout(() => window.location.reload(), 800);
  };

  // 期限切れ表示
  if (expired) {
    return (
      <div className="timeline-container">
        <Toast msg={toastMsg} />
        <UserSimulator currentUser={currentUser} />
        <div className="expired-card card fade-in">
          <span className="expired-icon">🔒</span>
          <h2 className="expired-title">アクセス有効期限切れ</h2>
          <p className="expired-text">
            本システムへのアクセス権限が切れているか、退職/契約満了によるアカウント失効が行われました。<br />
            継続してご利用になる場合は、以下の認証画面から合言葉を入力して手続きを完了させてください。
          </p>
          <a href="/verify" className="btn btn-primary" style={{ marginTop: '10px' }}>
            合言葉で認証する
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <Toast msg={toastMsg} />
      <UserSimulator currentUser={currentUser} />

      <div className="timeline-layout">
        {/* 上部ヘッダー・ツールバー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600 }}>
              ⚡ ブラウザ完結版（Zero-Network）
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* データ管理・バックアップ */}
            <input
              type="file"
              ref={backupInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <button
              className="btn"
              style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1' }}
              onClick={handleExportData}
              title="データをJSON保存"
            >
              📥 バックアップ
            </button>
            <button
              className="btn"
              style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1' }}
              onClick={() => backupInputRef.current?.click()}
              title="JSONからデータを復元"
            >
              📤 復元
            </button>
            <button
              className="btn"
              style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5' }}
              onClick={handleResetData}
              title="デモ初期データにリセット"
            >
              🔄 リセット
            </button>
            <button
              className="btn"
              style={{ fontSize: '12px', padding: '6px 14px', background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#fff' }}
              onClick={() => setIsJoinGroupModalOpen(true)}
            >
              🔑 合言葉で参加
            </button>
            <button
              className="btn"
              style={{ fontSize: '12px', padding: '6px 14px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              onClick={() => setIsGroupModalOpen(true)}
            >
              💬 トークグループ管理
            </button>
            {currentUser?.role === 'admin' && (
              <a
                href="/admin"
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                🛡️ 管理画面
              </a>
            )}
          </div>
        </div>

        {/* 投稿入力フォーム */}
        {currentUser && (
          <PostForm
            currentUser={currentUser}
            currentGroupId={currentGroupId}
            onProfileClick={() => setIsProfileModalOpen(true)}
            onPostSubmit={handlePostSubmit}
            onShowToast={showToast}
          />
        )}

        {/* グループ別タイムライン切り替えタブ */}
        {groups.length > 0 && (
          <div className="timeline-tabs card" style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '12px', overflowX: 'auto' }}>
            <button
              onClick={() => { setActiveTab('ALL'); setCurrentGroupId(null); }}
              className={`btn ${activeTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}
            >
              すべて ({posts.length})
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => { setActiveTab(g.id); setCurrentGroupId(g.id); }}
                className={`btn ${activeTab === g.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* タイムライン投稿一覧 */}
        <PostList
          posts={posts}
          loading={loading}
          error={error}
          currentUser={currentUser}
          activeTab={activeTab}
          onRetry={() => currentUser && refreshPosts(currentUser.id, currentGroupId)}
          onDeletePost={handleDeletePost}
          onToggleReaction={handleToggleReaction}
        />
      </div>

      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          groups={groups}
          onSave={handleSaveProfile}
          onLeaveGroup={handleLeaveGroup}
        />
      )}

      {currentUser && (
        <GroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          currentUser={currentUser}
          groups={groups}
          users={users}
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}

      <JoinGroupModal
        isOpen={isJoinGroupModalOpen}
        onClose={() => setIsJoinGroupModalOpen(false)}
        onJoin={handleJoinGroup}
        errorMsg={joinGroupError}
      />
    </div>
  );
}
