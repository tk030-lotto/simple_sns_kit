import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkUserActive } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeCheck = await checkUserActive(userId);
    if (!activeCheck.active) {
      return NextResponse.json({ error: 'USER_INACTIVE' }, { status: 403 });
    }

    const { subscription } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('plugin_sns_push_subscriptions')
      .upsert(
        [{ user_id: userId, subscription: subscription }],
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error saving subscription:', err);
    return NextResponse.json({ error: '内部エラーが発生しました。時間をおいて再試行してください。' }, { status: 500 });
  }
}
