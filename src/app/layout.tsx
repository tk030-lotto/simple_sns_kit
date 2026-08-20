import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizSNS Kit - 業務用独自SNSシステム',
  description: '個人事業主・中小企業向けの社内専用クローズドSNSシステム（免責ライセンスゲート・期限制限付き）',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BizSNS',
  },
};

export const viewport: Viewport = {
  themeColor: '#0070f3',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userNameRaw = cookieStore.get('sns_user_name')?.value;
  // デコードして日本語を正しく処理する
  const userName = userNameRaw ? decodeURIComponent(userNameRaw) : 'ゲストユーザー';
  const userRole = cookieStore.get('sns_user_role')?.value || 'member';
  const roleDisplay = userRole.toLowerCase() === 'admin' ? 'Admin' : 'Member';
  const userAvatarRaw = cookieStore.get('sns_avatar_url')?.value;
  const proto = 'https' + '://';
  const userAvatar = userAvatarRaw ? decodeURIComponent(userAvatarRaw) : `${proto}api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName.split(' ')[0])}`;

  return (
    <html lang="ja">
      <body>
        <div className="layout-wrapper">
          <header className="main-header glass-panel">
            <div className="header-container container">
              <div className="logo-section">
                <span className="logo-icon">🌐</span>
                <span className="logo-text">BizSNS <span className="logo-subtext">Kit</span></span>
              </div>
              <nav className="header-nav">
                <a href="/" className="nav-item active">タイムライン</a>
              </nav>
              <div className="user-profile-section">
                <div className="user-info" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={userAvatar} 
                    alt="User Avatar" 
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="user-name" style={{ lineHeight: '1.2' }}>{userName}</span>
                    <span className="user-role-badge">{roleDisplay}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          
          <main className="main-content container">
            {children}
          </main>
          
          <footer className="main-footer">
            <div className="container footer-container">
              <p>&copy; 2026 BizSNS Kit. All rights reserved.</p>
              <p className="footer-meta">免責同意ゲート＆操作ログ監査システム稼働中</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

