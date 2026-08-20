import { supabase } from '@/lib/supabase';

export interface VerificationResult {
  success: boolean;
  expiresAt?: Date;
  targetGroupId?: string;
  error?: string;
}

/**
 * 日本時間 (JST, UTC+9) 基準で、翌月末の 23:59:59.999 の Date オブジェクトと ISO 文字列を算出します。
 * サーバーの環境タイムゾーン (UTCなど) に依存しない安全な設計。
 */
export function calculateNextMonthExpiryJST(baseDate: Date = new Date()): { expiresAt: Date; expiresAtStr: string } {
  // JST (UTC+9) の日時を安全に取得するため、タイムゾーンオフセット（9時間分）を加えて計算
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(baseDate.getTime() + jstOffset);
  
  const year = jstNow.getUTCFullYear();
  const month = jstNow.getUTCMonth(); // 0-11
  
  // 翌月の末日 (翌々月の0日を指定することで、翌月の末日が得られる)
  const nextMonthLastDay = new Date(Date.UTC(year, month + 2, 0));
  const yyyy = nextMonthLastDay.getUTCFullYear();
  const mm = String(nextMonthLastDay.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nextMonthLastDay.getUTCDate()).padStart(2, '0');
  
  // 日本時間の 23:59:59.999 相当 of ISO 文字列を生成
  const expiresAtStr = `${yyyy}-${mm}-${dd}T23:59:59.999+09:00`;
  const expiresAt = new Date(expiresAtStr);
  
  return { expiresAt, expiresAtStr };
}

/**
 * noteメンバーシップマンスリーコードを検証し、該当ユーザーの有効期限を更新します。
 * 
 * @param userId 対象のユーザーID
 * @param codeToken 入力された暗号トークンコード
 * @param operator ログ記録用の操作者ID (指定がない場合は userId 自体を設定)
 */
export async function verifyAndExtendMembership(
  userId: string,
  codeToken: string,
  operator?: string
): Promise<VerificationResult> {
  try {
    if (!userId || !codeToken) {
      return { success: false, error: 'ユーザーIDおよび認証コードは必須です。' };
    }

    let isTokenValid = false;
    let validityType = 'monthly'; // default
    let targetGroupId: string | undefined = undefined;
    const now = new Date();

    // 1. 環境変数フォールバックの検証
    // NOTE_AUTH_SECRET が設定されており、入力されたトークンと完全一致する場合
    const secretToken = process.env.NOTE_AUTH_SECRET;
    if (secretToken && codeToken === secretToken) {
      isTokenValid = true;
    } else {
      // 2. データベースの認証コードテーブルを検索
      const { data: dbToken, error: dbError } = await supabase
        .from('plugin_note_auth_config')
        .select('*')
        .eq('code_token', codeToken)
        .maybeSingle();

      if (dbError) {
        console.error('[note-auth] Database query error:', dbError);
        return { success: false, error: 'データベース接続エラーが発生しました。' };
      }

      if (dbToken) {
        const validUntil = new Date(dbToken.valid_until);
        if (validUntil > now) {
          isTokenValid = true;
          validityType = dbToken.target_month; // 'monthly' or 'yearly'
          targetGroupId = dbToken.target_group_id;
        } else {
          return { success: false, error: 'この合言葉の登録可能期限が切れています。' };
        }
      }
    }

    if (!isTokenValid) {
      return { success: false, error: '無効な合言葉です。正しい合言葉を入力してください。' };
    }

    // 3. 有効期限を計算
    let expiresAt: Date;
    let expiresAtStr: string;
    
    if (validityType === 'yearly') {
      const oneYear = new Date(now);
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      expiresAt = oneYear;
      expiresAtStr = oneYear.toISOString();
    } else {
      const { expiresAt: ex, expiresAtStr: exStr } = calculateNextMonthExpiryJST(now);
      expiresAt = ex;
      expiresAtStr = exStr;
    }

    // 4. RPC 経由でアトミックに有効期限を更新 (監査ログ用の操作者セッションを伝播)
    const op = operator || userId;
    const { data: updateSuccess, error: updateError } = await supabase.rpc(
      'plugin_update_user_expiry',
      {
        p_user_id: userId,
        p_expires_at: expiresAtStr,
        p_operator: op,
      }
    );

    if (updateError) {
      console.error('[note-auth] RPC update failed:', updateError);
      return { success: false, error: '有効期限の更新処理に失敗しました。' };
    }

    return {
      success: true,
      expiresAt,
      targetGroupId,
    };
  } catch (err) {
    console.error('[note-auth] Unexpected error during verification:', err);
    return { success: false, error: 'システム内で予期せぬエラーが発生しました。' };
  }
}
