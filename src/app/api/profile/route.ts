import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkUserActive } from '@/lib/auth';

/**
 * プロフィール情報取得 (GET)
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: '認証情報 (x-user-id) が必要です。' },
      { status: 401 }
    );
  }

  // 1. 有効期限チェック
  const activeCheck = await checkUserActive(userId);
  if (!activeCheck.active) {
    return NextResponse.json(
      { success: false, error: activeCheck.error, code: 'USER_INACTIVE' },
      { status: 403 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('plugin_sns_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Failed to fetch profile:', error);
      return NextResponse.json(
        { success: false, error: 'プロフィールの取得に失敗しました。' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      profile: data || null,
      role: activeCheck.role
    });
  } catch (err) {
    console.error('Unexpected error in GET profile:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました。' },
      { status: 500 }
    );
  }
}

/**
 * プロフィール情報更新 (POST)
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: '認証情報 (x-user-id) が必要です。' },
      { status: 401 }
    );
  }

  // 1. 有効期限チェック
  const activeCheck = await checkUserActive(userId);
  if (!activeCheck.active) {
    return NextResponse.json(
      { success: false, error: activeCheck.error, code: 'USER_INACTIVE' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { displayName, avatarUrl } = body;

    if (!displayName || displayName.trim() === '') {
      return NextResponse.json(
        { success: false, error: '表示名は必須です。' },
        { status: 400 }
      );
    }

    if (avatarUrl) {
      try {
        const url = new URL(avatarUrl);
        if (url.protocol !== 'https:') throw new Error();
      } catch {
        return NextResponse.json({ success: false, error: '無効なアバターURLです。' }, { status: 400 });
      }
    }

    // 2. セッション変数をセットしてRLSを通過させるために upsert する
    // Supabase JSクライアントでは、DB関数を呼ばずに直接 upsert 可能（RLSは匿名キー経由だと機能しないため注意が必要）
    // 現在の設計では、APIルート側でサーバー用Anonキーを使っているので、RLSは本来なら無視できないが、
    // anonキーを使っている場合は RLS ポリシーで `current_setting('app.current_user_id')` が評価されるため、
    // ここでも rpc 経由で行うか、事前に set_config を呼ぶ必要がある。
    // しかし、Supabase REST API では set_config は各リクエストの最初には呼ばれないので、
    // rpc 経由で更新する方が安全。
    
    // plugin_update_profile RPC を作成して呼び出す方が確実。
    // 今回は Supabase の rpc を呼んで更新する。
    
    const { error } = await supabase.rpc('plugin_update_profile', {
      p_user_id: userId,
      p_display_name: displayName,
      p_avatar_url: avatarUrl || null
    });

    if (error) {
      console.error('Failed to update profile via RPC:', error);
      return NextResponse.json(
        { success: false, error: 'プロフィールの更新に失敗しました。' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in POST profile:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました。' },
      { status: 500 }
    );
  }
}
