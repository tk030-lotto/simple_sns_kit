import React, { useState, useEffect } from 'react';
import { User } from '@/types';

interface Props {
  currentUser: User;
  currentGroupId: string | null;
  onProfileClick: () => void;
  onPostSubmit: (content: string, files: File[], targetGroupId: string | null) => Promise<boolean>;
  onShowToast: (msg: string) => void;
}

export function PostForm({ currentUser, currentGroupId, onProfileClick, onPostSubmit, onShowToast }: Props) {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // BUG-1修正: コンポーネントアンマウント時にObjectURLを全解放してメモリリークを防ぐ
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (selectedFiles.length + filesArray.length > 4) {
        // IMP-4修正: alert()を廃止し、親のトースト通知を使用
        onShowToast('添付できるファイルは最大4個までです。');
        return;
      }
      // BUG-1修正: 新しいObjectURLを生成して管理リストに追加
      const newUrls = filesArray.map(f => URL.createObjectURL(f));
      setObjectUrls(prev => [...prev, ...newUrls]);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeSelectedFile = (index: number) => {
    // BUG-1修正: 削除時にObjectURLを解放
    URL.revokeObjectURL(objectUrls[index]);
    setObjectUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    if (selectedFiles.length > 0) setUploadingFiles(true);

    const success = await onPostSubmit(content, selectedFiles, currentGroupId);
    
    if (success) {
      setContent('');
      // BUG-1修正: 投稿成功後にObjectURLを全解放
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      setObjectUrls([]);
      setSelectedFiles([]);
    }
    
    setIsSubmitting(false);
    setUploadingFiles(false);
  };

  return (
    <div className="post-form-card card fade-in">
      <div className="form-header">
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          onClick={onProfileClick}
          title="プロフィールを編集"
        >
          {currentUser.avatarUrl ? (
            <img 
              src={currentUser.avatarUrl} 
              className="avatar-img" 
              alt={currentUser.name} 
              style={{ border: '2px solid transparent', transition: 'border 0.2s' }} 
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} 
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'} 
            />
          ) : (
            <div 
              className="avatar-placeholder" 
              style={{ border: '2px solid transparent', transition: 'border 0.2s' }} 
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} 
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >👤</div>
          )}
          <span className="post-as-text">
            {currentUser.name} <span style={{fontSize: '12px', color: 'var(--primary)', marginLeft: '8px'}}>✏️ 編集</span>
          </span>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="共有したい業務連絡やメモを入力してください..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          maxLength={1000}
          rows={3}
        />

        {selectedFiles.length > 0 && (
          <div className="attachment-preview-container">
            {selectedFiles.map((file, idx) => {
              const isImg = file.type.startsWith('image/');
              // BUG-1修正: createObjectObjectURL を毎回レンダーで呼ばず、管理済みURLを参照
              const fileUrl = objectUrls[idx] || '';
              return (
                <div key={idx} className="attachment-preview-item card">
                  {isImg ? (
                    <img src={fileUrl} alt="プレビュー" className="preview-thumbnail" />
                  ) : (
                    <div className="preview-file-icon">📎</div>
                  )}
                  <span className="preview-file-name" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(idx)}
                    className="preview-remove-btn"
                    title="添付を解除"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="form-actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div className="form-action-left" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', width: '100%' }}>
            <label className="file-attach-btn" title="ファイルを添付 (最大4つ)">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isSubmitting}
              />
              📎 ファイル添付
            </label>
            <span className="char-count">{content.length}/1000</span>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || (!content.trim() && selectedFiles.length === 0)}
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: '1.05rem', 
              fontWeight: 'bold',
              letterSpacing: '0.05em'
            }}
          >
            {isSubmitting 
              ? (uploadingFiles ? 'アップロード中...' : '投稿中...') 
              : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  );
}
