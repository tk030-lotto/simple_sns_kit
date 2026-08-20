import React, { useState, useEffect } from 'react';
import { User, Group } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  groups: Group[];
  users: User[];
  onCreateGroup: (name: string, members: string[]) => Promise<boolean>;
  onDeleteGroup: (groupId: string, groupName: string) => Promise<void>;
}

export function GroupModal({ isOpen, onClose, currentUser, groups, users, onCreateGroup, onDeleteGroup }: Props) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewGroupName('');
      setNewGroupMembers([]);
      setIsCreatingGroup(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newGroupName.trim()) {
      setErrorMsg('グループ名を入力してください。');
      return;
    }
    if (newGroupMembers.length === 0) {
      setErrorMsg('メンバーを1人以上選択してください。');
      return;
    }

    setErrorMsg(null);
    setIsCreatingGroup(true);
    const success = await onCreateGroup(newGroupName, newGroupMembers);
    if (!success) {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💬</span> トークグループの作成・管理
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        {errorMsg && (
          <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '12px', marginBottom: '12px' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        
        {groups.filter(g => g.created_by === currentUser?.id).length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>作成済みのトークグループ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
              {groups.filter(g => g.created_by === currentUser?.id).map(g => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#fff' }}>{g.name}</span>
                  <button 
                    className="delete-btn" 
                    style={{ fontSize: '12px', padding: '4px' }}
                    onClick={() => onDeleteGroup(g.id, g.name)}
                    disabled={isCreatingGroup}
                    title="グループを削除"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />

        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#38bdf8' }}>➕ 新規トークグループ作成</div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: '#94a3b8' }}>トークグループ名</label>
          <input 
            type="text" 
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="例：プロジェクトA専用"
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '13px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#94a3b8' }}>含めるメンバーを選択</label>
          <div style={{ maxHeight: '140px', overflowY: 'auto', padding: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {users.length > 0 ? (
              users.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', fontSize: '13px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={newGroupMembers.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewGroupMembers([...newGroupMembers, u.id]);
                      } else {
                        setNewGroupMembers(newGroupMembers.filter(id => id !== u.id));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '6px' }} />
                  ) : (
                    <span style={{ fontSize: '14px', marginRight: '6px' }}>👤</span>
                  )}
                  <span style={{ color: '#fff' }}>{u.name}</span>
                </label>
              ))
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b' }}>参加可能なメンバーがいません</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            className="btn" 
            onClick={onClose}
            disabled={isCreatingGroup}
            style={{ fontSize: '12px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
          >
            キャンセル
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isCreatingGroup}
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            {isCreatingGroup ? '作成中...' : '作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}
