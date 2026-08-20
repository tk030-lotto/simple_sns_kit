import { NextRequest, NextResponse } from 'next/server';
import { verifyAndExtendMembership } from '@/modules/note-auth/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let code = body.code || '';
    let userId = body.userId || '';
    let displayName = body.displayName || '';

    // トークンのトリミング
    if (typeof code === 'string') {
      code = code.trim();
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: '合言葉が指定されていません。' },
        { status: 400 }
      );
    }

    // ユーザーIDの特定
    if (!userId) {
      const cookieUser = request.cookies.get('sns_user_id')?.value;
      userId = cookieUser;
    }
    
    // 新規登録の場合、IDを生成
    if (!userId) {
      if (!displayName) {
        return NextResponse.json(
          { success: false, error: '新規登録時は表示名を入力してください。' },
          { status: 400 }
        );
      }
      userId = crypto.randomUUID();
    }

    console.log(`[api/verify] Verifying note membership code for user: ${userId}`);

    // noteメンバーシップ認証モジュールを呼び出して有効期限を更新
    const result = await verifyAndExtendMembership(userId, code, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '認証に失敗しました。' },
        { status: 400 }
      );
    }

    // 表示名が提供されている場合、プロフィールを更新
    if (displayName) {
      const { supabase } = await import('@/lib/supabase');
      // plugin_update_profile RPCを使用してプロフィールを更新（モックモードでも動作するようRPC経由）
      await supabase.rpc('plugin_update_profile', {
        p_user_id: userId,
        p_display_name: displayName,
        p_avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`
      });
    }

    // グループへの自動所属処理
    if (result.targetGroupId) {
      const { supabase } = await import('@/lib/supabase');
      // 既に所属している可能性も考慮して upsert (ON CONFLICT DO NOTHING を使用したいが Supabase の upsert で代用)
      await supabase.from('plugin_sns_group_members').upsert(
        { group_id: result.targetGroupId, user_id: userId },
        { onConflict: 'group_id,user_id' }
      );
    }

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt?.toISOString(),
      userId,
    });
  } catch (err) {
    console.error('[api/verify] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'サーバー内で予期せぬエラーが発生しました。' },
      { status: 500 }
    );
  }
}
