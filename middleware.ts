import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // 環境変数からID/Passを取得するか、デフォルト値を使用
  const USER = process.env.BASIC_AUTH_USER || 'admin';
  const PASS = process.env.BASIC_AUTH_PASS || '1234';

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === USER && pwd === PASS) {
      return NextResponse.next();
    }
  }

  // 認証失敗時または未認証時にポップアップを表示
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"'
    }
  });
}

// サイト全体に適用する
export const config = {
  matcher: '/:path*',
};
