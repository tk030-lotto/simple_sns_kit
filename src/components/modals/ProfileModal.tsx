import React, { useState, useEffect } from 'react';
import { User, Group } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  groups: Group[];
  onSave: (displayName: string, avatarFile: File | null) => Promise<boolean>;
  onLeaveGroup: (groupId: string, groupName: string) => void;
}

export function ProfileModal({ isOpen, onClose, currentUser, groups, onSave, onLeaveGroup }: Props) {
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditDisplayName(currentUser.name);
      setEditAvatarFile(null);
      setIsSaving(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!editDisplayName.trim()) return;
    setIsSaving(true);
    const success = await onSave(editDisplayName, editAvatarFile);
    if (!success) {
      setIsSaving(false); // 保存失敗時は状態を戻す（成功時は通常リロードまたは親側で閉じる）
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel fade-in" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>プロフィール編集</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {editAvatarFile ? (
                <img src={URL.createObjectURL(editAvatarFile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
              ) : currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Current" />
              ) : (
                <span style={{ fontSize: '32px' }}>👤</span>
              )}
            </div>
            <label className="btn" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', marginTop: '8px' }}>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setEditAvatarFile(e.target.files[0]);
                  }
                }}
              />
              画像を変更
            </label>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>表示名</label>
            <input
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="名前を入力"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>参加中のグループ</label>
            {groups.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {groups.map(g => (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#fff' }}>{g.name}</span>
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                      onClick={() => onLeaveGroup(g.id, g.name)}
                      disabled={isSaving}
                    >
                      退出
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', padding: '8px 0' }}>参加しているグループはありません</div>
            )}
          </div>
        </div>
        <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            className="btn" 
            onClick={onClose}
            disabled={isSaving}
          >
            キャンセル
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={isSaving || !editDisplayName.trim()}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
