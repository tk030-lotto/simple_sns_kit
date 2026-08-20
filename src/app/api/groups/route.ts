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

  try {
    if (activeCheck.role === 'admin') {
      const { data: allGroups, error: allGroupsError } = await supabase
        .from('plugin_sns_groups')
        .select('*');
      if (allGroupsError) throw allGroupsError;
      const uniqueGroups = Array.from(new Map((allGroups || []).map((g: any) => [g.id, g])).values());
      return NextResponse.json({ success: true, groups: uniqueGroups });
    }

    // 自分が所属しているグループのIDを取得
    const { data: memberData, error: memberError } = await supabase
      .from('plugin_sns_group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    if (!memberData || memberData.length === 0) {
      return NextResponse.json({ success: true, groups: [] });
    }

    const groupIds = memberData.map((m: any) => m.group_id);

    // そのグループの情報を取得
    const { data: groups, error: groupsError } = await supabase
      .from('plugin_sns_groups')
      .select('*')
      .in('id', groupIds);

    if (groupsError) throw groupsError;

    // 重複を排除 (念のため)
    const uniqueGroups = Array.from(new Map((groups || []).map((g: any) => [g.id, g])).values());

    return NextResponse.json({ success: true, groups: uniqueGroups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ success: false, error: 'グループの取得に失敗しました。' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: '認証情報が必要です。' }, { status: 401 });
  }

  const activeCheck = await checkUserActive(userId);
  if (!activeCheck.active) {
    return NextResponse.json({ success: false, error: activeCheck.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, members } = body;

    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ success: false, error: 'グループ名とメンバーが必要です。' }, { status: 400 });
    }

    const { data: newGroup, error: groupError } = await supabase.rpc('plugin_create_group', {
      p_user_id: userId,
      p_name: name,
      p_members: members
    });

    if (groupError) {
      console.error('RPC Error:', groupError);
      throw groupError;
    }

    return NextResponse.json({ success: true, group: newGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ success: false, error: 'グループの作成に失敗しました。' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  const action = searchParams.get('action');

  if (!userId || !groupId) {
    return NextResponse.json({ success: false, error: '認証情報またはグループIDが必要です。' }, { status: 400 });
  }

  const activeCheck = await checkUserActive(userId);
  if (!activeCheck.active) {
    return NextResponse.json({ success: false, error: activeCheck.error }, { status: 403 });
  }

  try {
    if (action === 'leave') {
      const { error } = await supabase
        .from('plugin_sns_group_members')
        .delete()
        .match({ group_id: groupId, user_id: userId });

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'グループから退出しました。' });
    }

    const { data: success, error } = await supabase.rpc('plugin_delete_group', {
      p_user_id: userId,
      p_group_id: groupId
    });

    if (error) throw error;
    if (!success) {
      return NextResponse.json({ success: false, error: 'グループが見つからないか削除権限がありません。' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting/leaving group:', error);
    return NextResponse.json({ success: false, error: 'グループの処理に失敗しました。' }, { status: 500 });
  }
}
