import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkUserActive } from '@/lib/auth';



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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: '投稿ID (postId) は必須です。' },
        { status: 400 }
      );
    }

    // 2. RPC plugin_toggle_reaction を呼び出してリアクション状態をトグル
    const { data: myReaction, error: toggleError } = await supabase.rpc('plugin_toggle_reaction', {
      p_user_id: userId,
      p_post_id: postId,
    });

    if (toggleError) {
      console.error('Failed to toggle reaction via RPC:', toggleError);
      return NextResponse.json(
        { success: false, error: 'リアクションの処理に失敗しました。' },
        { status: 500 }
      );
    }

    // 3. 最新のリアクション数を取得
    const { count, error: countError } = await supabase
      .from('plugin_sns_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const reactionsCount = countError ? 0 : (count || 0);

    // 4. Supabase Realtime (Broadcast) でリアクション状態の変更をブロードキャスト
    try {
      const channel = supabase.channel('timeline-changes');
      await channel.send({
        type: 'broadcast',
        event: 'reaction-changed',
        payload: { postId, reactionsCount },
      });
      supabase.removeChannel(channel); // BUG-03: チャンネルを明示的に解放
    } catch (realtimeErr) {
      console.error('Failed to broadcast reaction event:', realtimeErr);
    }

    return NextResponse.json({ success: true, myReaction, reactionsCount });
  } catch (err) {
    console.error('Unexpected error in POST reaction:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました。' },
      { status: 500 }
    );
  }
}
