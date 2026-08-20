import React from 'react';
import { Post, User } from '@/types';

interface Props {
  post: Post;
  currentUser: User | null;
  onDelete: (postId: string) => void;
  onToggleReaction: (postId: string) => void;
}

// ユーティリティ関数
const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;

    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
};

const isImageFile = (url: string) => {
  const path = url.split('?')[0];
  const ext = path.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
};

const getFileNameFromUrl = (url: string) => {
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split('/');
    const lastPart = parts[parts.length - 1];
    const fileName = lastPart.substring(lastPart.indexOf('-') + 1);
    return fileName || lastPart;
  } catch (e) {
    return '添付ファイル';
  }
};

export function PostItem({ post, currentUser, onDelete, onToggleReaction }: Props) {
  const isOwner = currentUser?.id === post.user_id;
  const isAdmin = currentUser?.role === 'admin';
  const showDelete = isOwner || isAdmin;

  return (
    <div className="post-card card fade-in">
      <div className="post-header">
        <div className="post-user-info">
          {post.avatar_url ? (
            <img src={post.avatar_url} className="avatar-img" alt={post.user_name} />
          ) : (
            <div className="avatar-placeholder">👤</div>
          )}
          <div className="post-meta">
            <span className="post-user-name">
              {post.user_name}
              {post.user_role === 'admin' && (
                <span style={{
                  marginLeft: '8px', padding: '2px 6px', fontSize: '10px',
                  background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
                  color: '#d6336c', borderRadius: '12px', fontWeight: 'bold',
                  border: '1px solid rgba(214, 51, 108, 0.3)', verticalAlign: 'middle',
                  boxShadow: '0 2px 4px rgba(214, 51, 108, 0.15)'
                }}>
                  🛡️ ADMIN
                </span>
              )}
            </span>
            <span className="post-time">{formatTime(post.created_at)}</span>
            {post.target_user_id && (
              <span style={{ 
                marginLeft: '8px', padding: '2px 6px', fontSize: '10px', 
                background: 'rgba(255,64,129,0.2)', color: '#ff4081', 
                borderRadius: '4px', border: '1px solid rgba(255,64,129,0.3)',
                verticalAlign: 'middle'
              }}>
                🔒 秘密の宛先
              </span>
            )}
            {post.target_group_name && (
              <span style={{ 
                marginLeft: '8px', padding: '2px 6px', fontSize: '10px', 
                background: 'rgba(64,129,255,0.2)', color: '#4081ff', 
                borderRadius: '4px', border: '1px solid rgba(64,129,255,0.3)',
                verticalAlign: 'middle'
              }}>
                👥 {post.target_group_name} 宛
              </span>
            )}
          </div>
        </div>
        {showDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="delete-btn"
            title="投稿を削除"
          >
            🗑️
          </button>
        )}
      </div>
      
      {/* 投稿テキストコンテンツ */}
      <div className="post-content">
        {post.content}
      </div>

      {/* 投稿添付メディアの表示 */}
      {post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0 && (
        <div className="post-media-container">
          {post.media_urls.map((url: string, idx: number) => {
            if (isImageFile(url)) {
              return (
                <div key={idx} className="post-media-image-wrapper">
                  <img 
                    src={url} 
                    alt="添付画像" 
                    className="post-media-image" 
                    onClick={() => window.open(url, '_blank')} 
                  />
                </div>
              );
            } else {
              return (
                <a 
                  key={idx} 
                  href={`${url}?download=`} 
                  className="post-media-file-link card"
                >
                  <span className="file-icon">📎</span>
                  <span className="file-name">{getFileNameFromUrl(url)}</span>
                  <span className="download-text">ダウンロード</span>
                </a>
              );
            }
          })}
        </div>
      )}

      {/* 投稿下部アクションエリア（リアクションボタン） */}
      <div className="post-actions-panel">
        <button
          onClick={() => onToggleReaction(post.id)}
          className={`reaction-btn ${post.my_reaction ? 'active' : ''}`}
          title={post.my_reaction ? 'いいね解除' : 'いいね'}
        >
          <span className="reaction-icon">👍</span>
          <span className="reaction-count">{post.reactions_count || 0}</span>
        </button>
      </div>
    </div>
  );
}
