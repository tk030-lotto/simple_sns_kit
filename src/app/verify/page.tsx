'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCookie, setCookie } from '@/lib/cookies';
import { browserStore } from '@/lib/browser-store';

import { styles } from '@/components/verify/VerifyStyles';
import { VerifyStepForm } from '@/components/verify/VerifyStepForm';
import { VerifySuccess } from '@/components/verify/VerifySuccess';
import { VerifyError } from '@/components/verify/VerifyError';
import { VerifyLoading, VerifySuspenseLoading } from '@/components/verify/VerifyLoading';

function VerifyContent() {
  const searchParams = useSearchParams();
  
  const queryCode = searchParams.get('code') || '';
  const queryUserId = searchParams.get('userId') || '';

  const [code, setCode] = useState(queryCode);
  const [userId, setUserId] = useState(queryUserId);
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [activeUser, setActiveUser] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    if (!queryUserId) {
      const loggedInUser = getCookie('sns_user_id');
      if (loggedInUser) {
        setUserId(loggedInUser);
        setIsExistingUser(true);
      }
    }
  }, [queryUserId]);

  useEffect(() => {
    if (queryCode && userId) {
      handleVerify(queryCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryCode, userId]);

  const handleVerify = (codeToVerify: string) => {
    if (!codeToVerify.trim()) {
      setErrorMsg('合言葉を入力してください。');
      setStatus('error');
      return;
    }
    
    if (!isExistingUser && !displayName.trim()) {
      setErrorMsg('表示名を入力してください。');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const targetUserId = userId || `user_${Date.now().toString(36)}`;
      const result = browserStore.verifyCode(codeToVerify, targetUserId, displayName);

      if (!result.success) {
        setStatus('error');
        setErrorMsg(result.error || '認証処理に失敗しました。');
      } else {
        setStatus('success');
        setExpiresAt(result.expiresAt || '');
        setActiveUser(targetUserId);
        
        setCookie('sns_user_id', targetUserId);
        if (displayName) setCookie('sns_user_name', encodeURIComponent(displayName));
        setUserId(targetUserId);
        setIsExistingUser(true);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg('認証処理中にエラーが発生しました。');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(code);
  };

  if (status === 'loading') {
    return <VerifyLoading />;
  }

  if (status === 'success') {
    return <VerifySuccess activeUser={activeUser} expiresAt={expiresAt} />;
  }

  if (status === 'error') {
    return (
      <VerifyError
        errorMsg={errorMsg}
        hasQueryCode={!!queryCode}
        onRetry={() => setStatus('idle')}
      />
    );
  }

  return (
    <VerifyStepForm
      isExistingUser={isExistingUser}
      displayName={displayName}
      setDisplayName={setDisplayName}
      code={code}
      setCode={setCode}
      onSubmit={handleManualSubmit}
    />
  );
}

export default function VerifyPage() {
  return (
    <div style={styles.container}>
      <Suspense fallback={<VerifySuspenseLoading />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
