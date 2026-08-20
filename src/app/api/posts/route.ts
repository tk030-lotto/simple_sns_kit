import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkUserActive } from '@/lib/auth';
import webpush from 'web-push';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:dummy@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (e) {
    console.warn('[WebPush] Failed to set VAPID details:', e);
  }
}

// テストユーザーの自動シーディングはPhase Cタスクで削除されました



/**
 * タイムライン投稿一覧取得 (GET)
 */
export async function GET(request: NextRequest) {
  // DBが空なら検証用テストユーザーを自動シード (Phase Cで削除)

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

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId') || null;

  try {
    // 2. セッション変数 app.current_user_id をセットして投稿一覧を取得する RPC を呼び出し
    const { data, error } = await supabase.rpc('plugin_get_posts', {
      p_user_id: userId,
      p_group_id: groupId
    });

    if (error) {
      console.error('Failed to fetch posts via RPC:', error);
      return NextResponse.json(
        { success: false, error: '投稿一覧の取得に失敗しました。' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, posts: data });
  } catch (err) {
    console.error('Unexpected error in GET posts:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました。' },
      { status: 500 }
    );
  }
}

/**
 * タイムライン新規投稿作成 (POST)
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userNameRaw = request.headers.get('x-user-name');
  const avatarUrlRaw = request.headers.get('x-avatar-url');

  // マルチバイト文字（日本語名など）のヘッダー受け渡しに対応するためデコード
  const userName = userNameRaw ? decodeURIComponent(userNameRaw) : null;
  const avatarUrl = avatarUrlRaw ? decodeURIComponent(avatarUrlRaw) : null;

  if (!userId || !userName) {
    return NextResponse.json(
      { success: false, error: '認証情報 (x-user-id, x-user-name) が必要です。' },
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
    const { content, media_urls, target_user_id, target_group_id } = body;

    // メディアURLの配列バリデーション (JSONBバインド対応) ← バリデーション前に宣言
    const mediaUrlsArray = Array.isArray(media_urls) ? media_urls : [];

    const MAX_CONTENT_LENGTH = 1000;
    if (content && content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `投稿内容は${MAX_CONTENT_LENGTH}文字以内で入力してください。` },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      // QOL-01: コンテンツが空でもメディアURLがある場合（ファイルのみ投稿）は許可する
      if (mediaUrlsArray.length === 0) {
        return NextResponse.json(
          { success: false, error: '投稿内容またはファイル添付は必須です。' },
          { status: 400 }
        );
      }
    }



    // 2. セッション変数 app.current_user_id をセットして投稿を作成する RPC を呼び出し
    // これにより自動監査ログトリガーが動作し、操作者IDが記録されます
    const { data, error } = await supabase.rpc('plugin_create_post', {
      p_user_id: userId,
      p_user_name: userName,
      p_avatar_url: avatarUrl || null,
      p_content: content,
      p_media_urls: mediaUrlsArray,
      p_target_user_id: target_user_id || null,
      p_target_group_id: target_group_id || null,
    });

    if (error) {
      console.error('Failed to create post via RPC:', error);
      return NextResponse.json(
        { success: false, error: '投稿の作成に失敗しました。' },
        { status: 500 }
      );
    }

    // Supabase Realtime (Broadcast) を利用して、新投稿を他のクライアントへ通知
    try {
      const channel = supabase.channel('timeline-changes');
      await channel.send({
        type: 'broadcast',
        event: 'new-post',
        payload: data,
      });
      supabase.removeChannel(channel); // BUG-03: チャンネルを明示的に解放
    } catch (realtimeErr) {
      console.error('Failed to broadcast new post event:', realtimeErr);
    }

    // Web Push 送信処理 (アプリアイコンバッジ用)
    try {
      const { data: subs } = await supabase.from('plugin_sns_push_subscriptions').select('*');
      
      if (subs && subs.length > 0) {
        let eligibleUserIds = new Set<string>();
        if (target_user_id) {
          eligibleUserIds.add(target_user_id);
        } else if (target_group_id) {
          const { data: groupMembers } = await supabase
            .from('plugin_sns_group_members')
            .select('user_id')
            .eq('group_id', target_group_id);
          if (groupMembers) groupMembers.forEach((m: any) => eligibleUserIds.add(m.user_id));
        }

        const payload = JSON.stringify({ 
          type: 'NEW_POST',
          title: 'BizSNS - 新着投稿',
          body: (content || '画像が投稿されました').substring(0, 40) + ((content || '').length > 40 ? '...' : '')
        });
        
        for (const sub of subs) {
          if (sub.user_id === userId) continue; // 自分には送らない
          
          if (target_user_id || target_group_id) {
            if (!eligibleUserIds.has(sub.user_id)) continue; // 宛先指定がある場合は対象者のみ
          }

          try {
            await webpush.sendNotification(sub.subscription, payload);
          } catch (pushErr: any) {
            // 期限切れや無効なサブスクリプションは削除
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              await supabase.from('plugin_sns_push_subscriptions').delete().eq('id', sub.id);
            }
          }
        }
      }
    } catch (pushGeneralErr) {
      console.error('Failed to send push notifications:', pushGeneralErr);
    }

    return NextResponse.json({ success: true, post: data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error in POST posts:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました。' },
      { status: 500 }
    );
  }
}

/**
 * タイムライン投稿削除 (DELETE)
 */
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  if (!userId || !postId) {
    return NextResponse.json(
      { success: false, error: '認証情報 (x-user-id) および削除対象の投稿ID (postId) が必要です。' },
      { status: 400 }
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
    // 2. plugin_delete_post RPC を呼び出して安全に削除 (内部で権限チェックと監査ログセッション設定が行われる)
    const { data: success, error } = await supabase.rpc('plugin_delete_post', {
      p_user_id: userId,
      p_post_id: postId,
    });

    if (error) {
      console.error('Failed to delete post via RPC:', error);
      const errMsg = '投稿の削除に失敗しました。';
      const status = error.code === '42501' ? 403 : 500;
      return NextResponse.json(
        { success: false, error: errMsg },
        { status }
      );
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: '対象の投稿が見つからないか、すでに削除されています。' },
        { status: 404 }
      );
    }

    // 3. Supabase Realtime (Broadcast) を利用して、投稿削除イベントを他のクライアントへ通知
    try {
      const channel = supabase.channel('timeline-changes');
      await channel.send({
        type: 'broadcast',
        event: 'delete-post',
        payload: { id: postId },
      });
      supabase.removeChannel(channel); // BUG-03: チャンネルを明示的に解放
    } catch (realtimeErr) {
      console.error('Failed to broadcast delete post event:', realtimeErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in DELETE posts:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました。' },
      { status: 500 }
    );
  }
}

