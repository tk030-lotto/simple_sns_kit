'use client';

import React, { useState, useEffect } from 'react';
import { getCookie, setCookie } from '@/lib/cookies';
import { browserStore } from '@/lib/browser-store';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { PassphraseManager } from '@/components/admin/PassphraseManager';
import { MemberManager } from '@/components/admin/MemberManager';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [passphrases, setPassphrases] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newPassphraseCode, setNewPassphraseCode] = useState('');
  const [newPassphraseValidity, setNewPassphraseValidity] = useState('month');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
        setSuccessMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  // すでに管理者ロールなら自動ログインまたはパスワード照合
  useEffect(() => {
    const currentRole = getCookie('sns_user_role');
    if (currentRole === 'admin') {
      setIsLoggedIn(true);
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const storedUsers = browserStore.getUsers();
      const storedPasses = browserStore.getPassphrases();
      const storedLogs = browserStore.getAuditLogs();

      setMembers(storedUsers);
      setPassphrases(storedPasses);
      setAuditLogs(storedLogs);
      setIsLoggedIn(true);
    } catch (e: any) {
      setErrorMsg('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    // 簡易パスワード認証 (admin または任意)
    if (password === 'admin' || password === 'admin123' || password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      fetchDashboardData();
    } else {
      setErrorMsg('パスワードが間違っています。（デモ用初期パスワード: admin）');
    }
  };

  const handleUpdateRole = (id: string, newRole: string) => {
    try {
      const ok = browserStore.updateUserRole(id, newRole as 'admin' | 'member', 'admin_user');
      if (!ok) throw new Error('権限の更新に失敗しました。');

      const currentUserId = getCookie('sns_user_id');
      if (currentUserId === id) {
        setCookie('sns_user_role', newRole);
      }

      setSuccessMsg(`権限を ${newRole} に変更しました。`);
      fetchDashboardData();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleDeleteMember = (id: string) => {
    if (!window.confirm('本当にこのメンバーを削除しますか？\n削除すると、このユーザーはシステムにアクセスできなくなります。')) return;

    try {
      const ok = browserStore.deleteUser(id, 'admin_user');
      if (!ok) throw new Error('メンバーの削除に失敗しました。');

      setSuccessMsg('メンバーを削除しました。');
      fetchDashboardData();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleDeletePassphrase = (code: string) => {
    if (!window.confirm(`合言葉 "${code}" を削除しますか？`)) return;

    try {
      const ok = browserStore.deletePassphrase(code, 'admin_user');
      if (!ok) throw new Error('合言葉の削除に失敗しました。');

      setSuccessMsg('合言葉を削除しました。');
      fetchDashboardData();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleCreatePassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassphraseCode) return;

    setLoading(true);
    try {
      browserStore.createPassphrase(newPassphraseCode, newPassphraseValidity, newGroupName, 'admin_user');
      setSuccessMsg('新しい合言葉を作成しました。');
      setNewPassphraseCode('');
      setNewGroupName('');
      fetchDashboardData();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <AdminLoginForm
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        loading={loading}
        errorMsg={errorMsg}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 md:p-12 text-slate-200" style={{ background: '#0b0f19', minHeight: '100vh', padding: '32px 16px' }}>
      <div className="max-w-6xl mx-auto space-y-8" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛡️</span> 簡易管理ダッシュボード（ブラウザ完結版）
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>コミュニティの参加者と合言葉・監査ログをローカルで管理します。</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/" className="btn" style={{ fontSize: '13px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              🏠 タイムラインへ戻る
            </a>
            <button 
              onClick={fetchDashboardData}
              disabled={loading}
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              🔄 最新の情報に更新
            </button>
          </div>
        </header>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '14px' }}>
            ✅ {successMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
          <PassphraseManager
            passphrases={passphrases}
            newPassphraseCode={newPassphraseCode}
            setNewPassphraseCode={setNewPassphraseCode}
            newPassphraseValidity={newPassphraseValidity}
            setNewPassphraseValidity={setNewPassphraseValidity}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            onCreatePassphrase={handleCreatePassphrase}
            onDeletePassphrase={handleDeletePassphrase}
            loading={loading}
          />

          <MemberManager
            members={members}
            onUpdateRole={handleUpdateRole}
            onDeleteMember={handleDeleteMember}
          />
        </div>
        
        <div style={{ marginTop: '32px' }}>
          <AuditLogViewer auditLogs={auditLogs} />
        </div>
      </div>
    </div>
  );
}
