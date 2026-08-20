import { supabase } from '@/lib/supabase';

/**
 * ユーザーの有効期限ステータスをチェックする共通ヘルパー。
 * 全APIルートで共有するため、ここで一元管理する。
 * （posts/route.ts, upload/route.ts, reaction/route.ts から import して使用）
 */
export async function checkUserActive(userId: string): Promise<{ active: boolean; role?: string; error?: string }> {
  if (!userId) {
    return { active: false, error: 'ユーザーIDが指定されていません。' };
  }

  const { data, error } = await supabase
    .from('plugin_user_ext_status')
    .select('expires_at, role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      active: false,
      error: 'ユーザーの有効期限ステータスが存在しないか、アクセス権限がありません。',
    };
  }

  const expiresAt = new Date(data.expires_at);
  const now = new Date();

  if (expiresAt <= now) {
    return {
      active: false,
      error: 'アカウントの有効期限が切れています。アクセスできません。',
    };
  }

  return { active: true, role: data.role };
}
