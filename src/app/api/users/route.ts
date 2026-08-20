import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkUserActive } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: '認証情報が必要です。' }, { status: 401 });
  }

  const activeCheck = await checkUserActive(userId);
  if (!activeCheck.active) {
    return NextResponse.json({ success: false, error: activeCheck.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const communityId = searchParams.get('communityId');

  try {
    let targetGroupIds: string[] = [];

    if (communityId && communityId !== 'ALL') {
      targetGroupIds = [communityId];
    } else {
      // ALL の場合は、自分が所属している全グループIDを取得
      const { data: myGroups } = await supabase
        .from('plugin_sns_group_members')
        .select('group_id')
        .eq('user_id', userId);
      
      if (myGroups) {
        targetGroupIds = myGroups.map((m: any) => m.group_id);
      }
    }

    if (targetGroupIds.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // 対象グループのメンバーを取得
    const { data: members, error: membersError } = await supabase
      .from('plugin_sns_group_members')
      .select('user_id')
      .in('group_id', targetGroupIds);

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // 重複する user_id を排除
    const userIds = Array.from(new Set(members.map((m: any) => m.user_id)));

    // プロフィール情報を一括取得 (N+1問題の解消)
    const { data: profiles } = await supabase
      .from('plugin_sns_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const users = userIds.map((id) => {
      const profile = profileMap.get(id) as { display_name?: string; avatar_url?: string } | undefined;
      return {
        id,
        name: profile?.display_name || id,
        avatarUrl: profile?.avatar_url || null,
      };
    });

    // 自分自身を除外
    const filteredUsers = users.filter(u => u.id !== userId);

    return NextResponse.json({ success: true, users: filteredUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'ユーザー一覧の取得に失敗しました。' }, { status: 500 });
  }
}
