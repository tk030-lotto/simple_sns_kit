import React from 'react';
import { Post, User } from '@/types';
import { PostItem } from './PostItem';

interface Props {
  posts: Post[];
  loading: boolean;
  error: string | null;
  currentUser: User | null;
  activeTab: string;
  onRetry: () => void;
  onDeletePost: (postId: string) => void;
  onToggleReaction: (postId: string) => void;
}

export function PostList({ posts, loading, error, currentUser, activeTab, onRetry, onDeletePost, onToggleReaction }: Props) {
  if (loading) {
    return (
      <div className="post-list">
        <div className="loading-shimmer-container">
          {[1, 2, 3].map((n) => (
            <div key={n} className="post-card card shimmer" style={{ minHeight: '120px', marginBottom: '16px' }}>
              <div className="post-header-shimmer" />
              <div className="post-content-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-list">
        <div className="empty-timeline card" style={{ color: 'var(--danger)' }}>
          <span className="empty-icon">⚠️</span>
          <p className="empty-title">エラーが発生しました</p>
          <p className="empty-subtitle">{error}</p>
          <button
            onClick={onRetry}
            className="btn btn-secondary"
            style={{ marginTop: '16px' }}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="post-list">
        <div className="empty-timeline card">
          <span className="empty-icon">💬</span>
          <p className="empty-title">まだ投稿がありません</p>
          <p className="empty-subtitle">最初の業務連絡・共有を投稿してみましょう！</p>
        </div>
      </div>
    );
  }

  const filteredPosts = activeTab === 'ALL' ? posts : posts.filter(p => p.target_group_id === activeTab);

  return (
    <div className="post-list">
      {filteredPosts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          currentUser={currentUser}
          onDelete={onDeletePost}
          onToggleReaction={onToggleReaction}
        />
      ))}
    </div>
  );
}
