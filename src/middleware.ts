import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 簡易 In-Memory レートリミッター (1分間にIPあたり100リクエストまで)
// ⚠️ Vercel のサーバーレス環境ではインスタンス間で状態を共有しないため、
//    実際の制限はインスタンス単位となる（100名規模の閉じた運用では実害なし）。
//    大規模利用や DDoS 対策が必要な場合は Upstash Redis 等への移行を検討してください。
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 100;

  // メモリリーク防止：期限切れエントリの定期掃除
  if (rateLimitMap.size > 200) {
    rateLimitMap.forEach((v, k) => {
      if (v.resetTime < now) {
        rateLimitMap.delete(k);
      }
    });
  }

  let record = rateLimitMap.get(ip);
  if (!record || record.resetTime < now) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(ip, record);
    return true;
  }

  record.count += 1;
  return record.count <= maxRequests;
}

export function middleware(request: NextRequest) {
  // ==============================================================================
  // 0. レート制限
  // ==============================================================================
  const rawIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const ip = rawIp.split(',')[0].trim();
  if (!checkRateLimit(ip)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Too Many Requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  // ==============================================================================
  // 1. Basic認証 (サイト全体へのカギ)
  // ==============================================================================
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

  if (basicAuthUser && basicAuthPassword && !request.nextUrl.pathname.startsWith('/api/')) {
    const basicAuthHeader = request.headers.get('authorization');
    if (basicAuthHeader && basicAuthHeader.startsWith('Basic ')) {
      try {
        const authValue = basicAuthHeader.split(' ')[1] || '';
        const decoded = atob(authValue);
        const colonIndex = decoded.indexOf(':');
        const user = decoded.substring(0, colonIndex);
        const pwd = decoded.substring(colonIndex + 1);
        if (user !== basicAuthUser || pwd !== basicAuthPassword) {
          return new NextResponse('認証エラー: パスワードが違います', { 
            status: 401, 
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } 
          });
        }
      } catch (err) {
        return new NextResponse('認証エラー: 不正なヘッダー形式です', { 
          status: 401, 
          headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } 
        });
      }
    } else {
      return new NextResponse('認証が必要です', { 
        status: 401, 
        headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' } 
      });
    }
  }

  // ==============================================================================
  // 2. 免責ゲートチェック (NEXT_PUBLIC_REQUIRE_LICENSE_AGREEMENT=true の場合のみ)
  // ==============================================================================
  const requireAgreement = process.env.NEXT_PUBLIC_REQUIRE_LICENSE_AGREEMENT === 'true';
  if (!requireAgreement) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // 除外パス（ログイン画面、note検証画面、外部Webhook、静的アセット）の判定
  if (
    pathname === '/login' ||
    pathname === '/verify' ||
    pathname === '/api/verify' ||
    pathname === '/api/webhook' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|webmanifest)$/)
  ) {
    return NextResponse.next();
  }

  // クッキーの存在・有効性検証
  const version = process.env.NEXT_PUBLIC_LICENSE_AGREEMENT_VERSION || '1.0.0';
  const cookieName = `sns_license_accepted_v${version}`;
  const acceptedCookie = request.cookies.get(cookieName);
  const isAccepted = acceptedCookie?.value === 'true';

  if (!isAccepted) {
    if (pathname.startsWith('/api')) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: '免責条項への同意が必要です。システム画面から同意してください。',
          code: 'LICENSE_AGREEMENT_REQUIRED',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
