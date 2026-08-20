import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<boolean>;
  errorMsg: string;
}

export function JoinGroupModal({ isOpen, onClose, onJoin, errorMsg }: Props) {
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setJoinGroupCode('');
      setIsJoiningGroup(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!joinGroupCode.trim()) return;
    setIsJoiningGroup(true);
    const success = await onJoin(joinGroupCode);
    if (!success) {
      setIsJoiningGroup(false);
    }
    // 成功時は親が閉じる
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '24px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
        >
          ×
        </button>
        <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>🔑 合言葉でグループに追加参加</h2>
        
        {errorMsg && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(255, 69, 58, 0.2)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#ffb3b0' }}>
            {errorMsg}
          </div>
        )}
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>合言葉（参加コード）</label>
          <input
            type="text"
            className="input-field"
            value={joinGroupCode}
            onChange={(e) => setJoinGroupCode(e.target.value)}
            placeholder="新しいグループの合言葉を入力"
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isJoiningGroup}
          >
            キャンセル
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={isJoiningGroup || !joinGroupCode.trim()}
          >
            {isJoiningGroup ? '参加処理中...' : '参加する'}
          </button>
        </div>
      </div>
    </div>
  );
}
