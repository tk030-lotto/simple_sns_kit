import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 管理者パスワードの検証
function checkAdminPassword(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envPassword) {
    return { valid: false, error: 'サーバー側で管理者パスワードが設定されていません。' };
  }

  if (password !== envPassword) {
    return { valid: false, error: '管理者パスワードが正しくありません。' };
  }

  return { valid: true };
}

export async function GET(request: NextRequest) {
  const auth = checkAdminPassword(request);
  if (!auth.valid) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'members') {
    // メンバー一覧取得
    const { data: statusData, error: statusError } = await supabase
      .from('plugin_user_ext_status')
      .select('*')
      .order('updated_at', { ascending: false });

    if (statusError) return NextResponse.json({ success: false, error: statusError.message }, { status: 500 });

    const { data: profileData } = await supabase
      .from('plugin_sns_profiles')
      .select('*');

    // 全グループ情報を取得
    const { data: allGroups } = await supabase
      .from('plugin_sns_groups')
      .select('id, name, created_by');

    // 全所属情報を取得
    const { data: allMemberships } = await supabase
      .from('plugin_sns_group_members')
      .select('user_id, group_id');

    const members = (statusData || []).map((status: any) => {
      const profile = (profileData || []).find((p: any) => p.user_id === status.user_id);
      
      // ユーザーの所属コミュニティ名を抽出（created_by === 'admin' などの大枠を主眼とするが、ここでは全グループ名を返す）
      const userGroupIds = (allMemberships || []).filter((m: any) => m.user_id === status.user_id).map((m: any) => m.group_id);
      const userGroups = (allGroups || [])
        .filter((g: any) => userGroupIds.includes(g.id))
        .map((g: any) => ({ id: g.id, name: g.name, is_community: g.created_by === 'admin' || !g.created_by }));
        
      return {
        ...status,
        display_name: profile?.display_name || '名称未設定',
        joined_groups: userGroups
      };
    });

    return NextResponse.json({ success: true, members });
  }

  if (action === 'passphrases') {
    // 合言葉一覧取得
    const { data, error } = await supabase
      .from('plugin_note_auth_config')
      .select('*')
      .order('valid_until', { ascending: false });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, passphrases: data });
  }

  if (action === 'audit_logs') {
    // 監査ログ一覧取得
    const { data, error } = await supabase
      .from('plugin_audit_logs')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, logs: data });
  }

  return NextResponse.json({ success: false, error: '無効なアクションです' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const auth = checkAdminPassword(request);
  if (!auth.valid) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'passphrases') {
    const { code_token, validity, group_name } = await request.json(); // validity: 'month' | 'year'

    if (!code_token || !validity) {
      return NextResponse.json({ success: false, error: '必要なデータが不足しています' }, { status: 400 });
    }

    const now = new Date();
    if (validity === 'year') {
      now.setFullYear(now.getFullYear() + 1);
    } else {
      now.setMonth(now.getMonth() + 1);
    }

    let target_group_id = null;

    // グループ名が指定されている場合、先にグループを作成
    if (group_name && group_name.trim() !== '') {
      const { data: groupData, error: groupError } = await supabase
        .from('plugin_sns_groups')
        .insert([{ name: group_name.trim(), created_by: 'system' }])
        .select();
      
      if (groupError) {
        return NextResponse.json({ success: false, error: 'グループの作成に失敗しました: ' + groupError.message }, { status: 500 });
      }
      target_group_id = groupData[0].id;
    }

    const { data, error } = await supabase
      .from('plugin_note_auth_config')
      .insert([
        {
          code_token,
          target_month: validity === 'year' ? 'yearly' : 'monthly',
          valid_until: now.toISOString(),
          target_group_id
        }
      ])
      .select();

    if (error) {
      // 一意制約違反等の場合
      if (error.code === '23505') {
         return NextResponse.json({ success: false, error: 'この合言葉は既に存在します' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, passphrase: data[0] });
  }

  return NextResponse.json({ success: false, error: '無効なアクションです' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const auth = checkAdminPassword(request);
  if (!auth.valid) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'members') {
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'IDが必要です' }, { status: 400 });

    const { error } = await supabase
      .from('plugin_user_ext_status')
      .delete()
      .eq('user_id', id);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'passphrases') {
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ success: false, error: 'コードが必要です' }, { status: 400 });

    const { error } = await supabase
      .from('plugin_note_auth_config')
      .delete()
      .eq('code_token', code);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: '無効なアクションです' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const auth = checkAdminPassword(request);
  if (!auth.valid) return NextResponse.json({ success: false, error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'members') {
    const { id, role } = await request.json();
    
    if (!id || !role) {
      return NextResponse.json({ success: false, error: 'IDと新しい権限(role)が必要です' }, { status: 400 });
    }

    const { error } = await supabase
      .from('plugin_user_ext_status')
      .update({ role })
      .eq('user_id', id);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: '無効なアクションです' }, { status: 400 });
}
