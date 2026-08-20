// クッキー取得の共通ヘルパー
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// クッキー設定の共通ヘルパー (1年間の有効期限)
export function setCookie(name: string, value: string, maxAgeSeconds: number = 31536000) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

// クッキー削除の共通ヘルパー
export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}
