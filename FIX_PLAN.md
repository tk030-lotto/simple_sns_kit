# BizSNS Kit — 本番リリース修正計画

**作成日**: 2026年7月7日  
**ベース**: AUDIT_REPORT.md（全8フェーズ監査結果）  
**方針**: 🔴（現状バグ）→ 🟠（本番移行前要修正）→ 🟡（改善推奨）の順で対応

> **インフラ前提**: Supabase・Vercel・APIキーは実運用者が新規設定するため、本計画の修正対象はコード・スキーマのみです。

---

## フェーズ構成

| フェーズ | テーマ | 件数 | 優先度 |
| --- | --- | --- | --- |
| Phase A | データベースセキュリティ修正 | 5件 | 🔴🔴🔴 最優先 |
| Phase B | APIセキュリティ修正 | 8件 | 🔴🔴 高 |
| Phase C | テストコード除去・コード整理 | 8件 | 🟠🔴 高 |
| Phase D | PWA・アイコン修正 | 6件 | 🔴🟡 中 |
| Phase E | フロントエンド品質改善 | 6件 | 🟡 中 |
| Phase F | 保守性・依存関係整理 | 6件 | 🟡 低 |

---

## Phase A — データベースセキュリティ修正（最優先）

**目的**: `schema.sql` のRLSポリシー欠落を解消し、実運用者がDBを構築した瞬間から安全な状態にする。

### A-1: `plugin_user_ext_status` へのRLSポリシー追加

**対象**: `schema.sql`  
**監査ID**: DB-1

```sql
-- 追加すべきSQL
CREATE POLICY "users_read_own_status" ON plugin_user_ext_status
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "service_role_all" ON plugin_user_ext_status
  FOR ALL USING (auth.role() = 'service_role');
```

### A-2: `plugin_note_auth_config` へのRLSポリシー追加

**対象**: `schema.sql`  
**監査ID**: DB-2

```sql
-- 追加すべきSQL（認証コードはサービスロールのみ読み書き可）
CREATE POLICY "service_role_only" ON plugin_note_auth_config
  FOR ALL USING (auth.role() = 'service_role');
```

### A-3: `plugin_audit_logs` へのRLSポリシー追加

**対象**: `schema.sql`  
**監査ID**: DB-3

```sql
-- 追加すべきSQL（監査ログはadminが参照・サービスロールが書き込み）
CREATE POLICY "admin_read_logs" ON plugin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plugin_user_ext_status
      WHERE user_id = current_setting('app.current_user_id', true)
        AND role = 'admin'
    )
  );

CREATE POLICY "service_role_insert_logs" ON plugin_audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

### A-4: テスト用トークンの削除

**対象**: `schema.sql` 末尾のINSERT文  
**監査ID**: DB-5  
**対処**: `schema.sql` 末尾の `INSERT INTO plugin_note_auth_config` ブロックを削除または別ファイル（`seed_test_data.sql`）に分離する

### A-5: `plugin_sns_profiles` へのDELETEポリシー追加

**対象**: `schema.sql`  
**監査ID**: DB-4

```sql
-- 自分のプロフィールのみ削除可（admin は全削除可）
CREATE POLICY "users_delete_own_profile" ON plugin_sns_profiles
  FOR DELETE USING (
    user_id = current_setting('app.current_user_id', true)
    OR EXISTS (
      SELECT 1 FROM plugin_user_ext_status
      WHERE user_id = current_setting('app.current_user_id', true)
        AND role = 'admin'
    )
  );
```

---

## Phase B — APIセキュリティ修正

**目的**: エラー情報の漏洩を防ぎ、入力値を適切に検証する。

### B-1: エラーレスポンスからDB詳細を除去

**対象**: `src/app/api/posts/route.ts`・`profile/route.ts`・`upload/route.ts`・`groups/route.ts`  
**監査ID**: P3-1, P2-E

```typescript
// 修正パターン（全APIルートに適用）
} catch (error) {
  console.error('[API] Error:', error);  // サーバーログにのみ詳細を記録
  return NextResponse.json(
    { error: '内部エラーが発生しました。時間をおいて再試行してください。' },
    { status: 500 }
  );
}
```

### B-2: 投稿コンテンツの文字数上限を追加

**対象**: `src/app/api/posts/route.ts`  
**監査ID**: P3-2

```typescript
// POSTハンドラーの入力検証部分に追加
const MAX_CONTENT_LENGTH = 2000;
if (body.content && body.content.length > MAX_CONTENT_LENGTH) {
  return NextResponse.json(
    { error: `投稿内容は${MAX_CONTENT_LENGTH}文字以内で入力してください。` },
    { status: 400 }
  );
}
```

### B-3: ファイルアップロードのMIMEタイプ検証を追加

**対象**: `src/app/api/upload/route.ts`  
**監査ID**: P3-3

```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
];
if (!ALLOWED_MIME_TYPES.includes(file.type)) {
  return NextResponse.json(
    { error: '許可されていないファイル形式です。' },
    { status: 400 }
  );
}
```

### B-4: avatarUrlのURL形式検証を追加

**対象**: `src/app/api/profile/route.ts`  
**監査ID**: P3-4

```typescript
// URLとして有効かつhttps://で始まることを検証
if (avatarUrl) {
  try {
    const url = new URL(avatarUrl);
    if (url.protocol !== 'https:') throw new Error();
  } catch {
    return NextResponse.json({ error: '無効なアバターURLです。' }, { status: 400 });
  }
}
```

### B-5: webpush APIに有効期限チェックを追加

**対象**: `src/app/api/webpush/route.ts`  
**監査ID**: P2-F

```typescript
// 既存の checkUserActive と同様の検証を追加
const activeCheck = await checkUserActive(userId);
if (!activeCheck.active) {
  return NextResponse.json({ error: 'USER_INACTIVE' }, { status: 403 });
}
```

### B-6: ライセンスクッキー名の修正

**対象**: `src/middleware.ts` L55・`src/app/login/page.tsx` L21  
**監査ID**: AI-1  
**⚠️ 必ず両ファイル同時に変更**

```typescript
// 変更前
const cookieName = `crm_license_accepted_v${version}`;
// 変更後
const cookieName = `sns_license_accepted_v${version}`;
```

---

## Phase C — テストコード除去・コード整理

**目的**: 本番環境で不要なテスト用コード・デバッグコードを除去または環境変数で制御する。

### C-1: `alert()` を全て除去

**対象**: `src/app/page.tsx`（約28箇所）  
**監査ID**: FE-1  
**対処方針**:

- Push通知の `alert()` 13箇所 → `console.log()` または UI内ステータス表示に置換
- 操作系エラーの `alert()` → `setError()` / トースト通知に置換
- 「ファイルは最大4個まで」の `alert()` → UIインラインメッセージに置換

### C-2: ユーザーシミュレーターを環境変数で制御

**対象**: `src/app/page.tsx` L655–710  
**監査ID**: AI-3

```typescript
// 変更前
const renderSimulator = () => { ... }

// 変更後
const showSimulator = process.env.NEXT_PUBLIC_SHOW_SIMULATOR === 'true';
const renderSimulator = () => {
  if (!showSimulator) return null;
  ...
}
```

`.env.example` に追記:

```text
# テスト用ユーザーシミュレーター（本番環境では false または未設定にする）
NEXT_PUBLIC_SHOW_SIMULATOR=false
```

### C-3: テストユーザー自動シーディングを無効化

**対象**: `src/app/api/posts/route.ts` L13–46  
**監査ID**: P2-C  
**対処**: `seedTestUsersIfEmpty()` 関数と呼び出し（L46）をコメントアウトまたは削除

### C-4: URLパラメータでのユーザーID注入を削除

**対象**: `src/app/page.tsx` L81–103  
**監査ID**: FE-2  
**対処**: `paramId`・`paramName`・`paramRole`・`paramAvatar` の注入ブロックを削除

### C-5: `getCookie()` の共通化

**対象**: `src/app/page.tsx` L8–13・`src/app/verify/page.tsx` L7–13  
**監査ID**: AI-2

```typescript
// 新規作成: src/lib/cookies.ts
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}
```

### C-6: インメモリモックの本番誤動作防止

**対象**: `src/lib/supabase.ts`  
**監査ID**: P2-D  
**対処**: 本番環境（`NODE_ENV === 'production'`）でモックに切り替わった場合は `console.error` でアラートを出力し、起動を停止するガード処理を追加

---

## Phase D — PWA・アイコン修正

**目的**: PWAとして正しく動作するアイコンを用意し、通知が正常に表示されるようにする。

### D-1: アイコン実ファイルの用意と manifest.json 更新

**対象**: `public/manifest.json`・`public/push-sw.js`  
**監査ID**: PWA-1, PWA-2

1. アイコン画像（PNG）を用意して `public/` に配置
   - `icon-192.png`（192×192px）
   - `icon-512.png`（512×512px、maskable対応）
2. `manifest.json` を更新:

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

1. `push-sw.js` の参照を更新:

```javascript
icon: '/icon-192.png',
badge: '/icon-192.png'
```

### D-2: VAPIDコンタクトメールの環境変数化

**対象**: `src/app/api/posts/route.ts` L7  
**監査ID**: M-2

```typescript
// 変更前
webpush.setVapidDetails('mailto:dummy@example.com', ...)

// 変更後
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || 'admin@example.com'}`,
  ...
)
```

`.env.example` に追記:

```text
# Push通知：障害時の連絡先メール（必ず実際のアドレスに変更してください）
VAPID_CONTACT_EMAIL=your-email@example.com
```

### D-3: Push通知有効化でsw.jsが消える問題の修正

**対象**: `src/app/page.tsx` L332–338  
**監査ID**: PWA-4  
**対処**: sw.js をアンレジスタする処理を削除し、push-sw.js の機能を sw.js に統合する（または push-sw.js のみを登録してsw.jsを温存する）

---

## Phase E — フロントエンド品質改善

**目的**: ユーザビリティと堅牢性を向上させる改善を実施する。

### E-1: アバター画像のフォールバック処理

**対象**: `src/app/layout.tsx`  
**監査ID**: FE-3

### E-2: アップロード失敗時のファイル選択リセット

**対象**: `src/app/page.tsx`  
**監査ID**: FE-4

### E-3: `posts`・`groups` の型定義

**対象**: `src/app/page.tsx` L48, L66  
**監査ID**: AI-5

```typescript
// 新規定義を追加
interface Post {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  avatar_url?: string;
  media_urls?: string[];
  created_at: string;
  reactions_count: number;
  my_reaction: boolean;
}

interface Group {
  id: string;
  name: string;
  members: string[];
}

// useState の型を更新
const [posts, setPosts] = useState<Post[]>([]);
const [groups, setGroups] = useState<Group[]>([]);
```

### E-4: themeColor を viewport export に移動

**対象**: `src/app/layout.tsx`  
**監査ID**: FE-6, P1-2

```typescript
export const viewport = {
  themeColor: '#0070f3',
};
```

### E-5: verifyページのユーザーID入力欄を自動取得のみに変更

**対象**: `src/app/verify/page.tsx`  
**監査ID**: FE-7

### E-6: モバイルブレークポイントの拡充

**対象**: `src/app/globals.css`  
**監査ID**: FE-5

現在 `@media (max-width: 640px)` のみ。360px・390px の小型端末向けを追加:

```css
/* 小型スマートフォン対応（360px以下） */
@media (max-width: 360px) {
  .post-form-card {
    padding: 16px;
  }
  .timeline-layout {
    gap: 16px;
  }
}
```

---

## Phase F — 保守性・依存関係整理

**目的**: 不要なコードと依存関係を整理し、保守コストを下げる。

### F-1: 未使用パッケージ `pg` の削除

**対象**: `package.json`  
**監査ID**: M-1  
**コマンド**: `npm uninstall pg`

### F-2: npm脆弱性の解消

**対象**: `package.json`  
**監査ID**: P1-1  
**コマンド**: `npm audit fix` を実行し、対応できない場合は `next` のバージョンを更新

### F-3: PROJECT_PLAN.md のフォルダ構成図を最新化

**対象**: `PROJECT_PLAN.md`  
**監査ID**: M-4  
**対処**: 実際のAPIルート構成（`profile`・`upload`・`groups`・`verify`・`webpush`・`posts/reaction`）を図に追記

### F-4: セキュリティヘッダーの追加

**対象**: `next.config.js`  
**監査ID**: PWA-7

```javascript
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

### F-5: `globals.css` のセクション分割

**対象**: `src/app/globals.css`（1000行）  
**監査ID**: M-5  
**対処**: 以下のように別ファイルに分割してimportする（機能変更なし）

```text
src/app/
├── globals.css          # CSS変数・リセット・共通
├── timeline.css         # タイムライン・カード
├── modal.css            # モーダル・シミュレーター
└── animations.css       # アニメーション定義
```

### F-6: 主要ロジックへのユニットテスト追加

**対象**: `src/modules/note-auth/auth-service.ts`・`src/lib/auth.ts`  
**監査ID**: M-6  
**優先テスト対象**:

- `calculateNextMonthExpiryJST()` — 月末・年末のエッジケース
- `checkUserActive()` — 有効期限の境界値（期限当日・翌日）
- `verifyAndExtendMembership()` — 無効トークン・期限切れトークンの挙動

```bash
# テストフレームワークの追加
npm install -D vitest @vitest/coverage-v8
```

---

## 修正作業チェックリスト（全45項目）

### Phase A — データベースセキュリティ修正（最優先）

- [x] A-1: `plugin_user_ext_status` RLSポリシー追加
- [x] A-2: `plugin_note_auth_config` RLSポリシー追加
- [x] A-3: `plugin_audit_logs` RLSポリシー追加
- [x] A-4: テスト用トークンINSERT文を削除または分離
- [x] A-5: `plugin_sns_profiles` DELETEポリシー追加

### Phase B — APIセキュリティ修正

- [x] B-1: エラーレスポンスからDB詳細を除去（4ルート）
- [x] B-2: 投稿コンテンツ文字数上限を追加
- [x] B-3: ファイルMIMEタイプ検証を追加
- [x] B-4: avatarUrl URL形式検証を追加
- [x] B-5: webpush APIに有効期限チェックを追加
- [x] B-6: ライセンスクッキー名を `crm_` → `sns_` に変更（**2ファイル同時**）
- [x] B-7: レート制限の実装（Vercel Edge Config または middleware で対応）
- [x] B-8: `NOTE_AUTH_SECRET` の強度要件をREADMEに明記（32文字以上推奨）

### Phase C — テストコード除去・コード整理

- [x] C-1: `alert()` 28箇所をUIメッセージに置換
- [x] C-2: ユーザーシミュレーターを `NEXT_PUBLIC_SHOW_SIMULATOR` で制御
- [x] C-3: テストユーザー自動シーディングを削除
- [x] C-4: URLパラメータでのユーザーID注入を削除
- [x] C-5: `getCookie()` を `src/lib/cookies.ts` に共通化
- [x] C-6: インメモリモックに本番誤動作防止ガードを追加
- [x] C-7: `PluginBus` を削除またはコメントで「将来拡張用・現在未使用」と明示
- [x] C-8: Cookie encode/decode フローをユーティリティ関数に整理

### Phase D — PWA・アイコン修正

- [x] D-1: アイコン実ファイルを用意してmanifest.jsonとpush-sw.jsを更新
- [x] D-2: VAPIDコンタクトメールを環境変数化
- [x] D-3: Push通知有効化でsw.jsが消える問題を修正
- [x] D-4: APIルートを SW のキャッシュ対象から除外（NetworkOnly化）
- [x] D-5: `manifest.json` に `scope` フィールドを追加
- [x] D-6: `sw.js` を `.gitignore` に追加してビルド成果物管理を整理

### Phase E — フロントエンド品質改善

- [x] E-1: アバター画像のフォールバック処理
- [x] E-2: アップロード失敗時のファイル選択リセット
- [x] E-3: `posts`・`groups` の型定義（`Post`・`Group` インターフェース）
- [x] E-4: themeColor を viewport export に移動
- [x] E-5: verifyページのユーザーID入力欄を自動取得のみに変更
- [x] E-6: モバイルブレークポイントの拡充（360px以下対応追加）

### Phase F — 保守性・依存関係整理

- [x] F-1: 未使用パッケージ `pg` の削除
- [x] F-2: npm脆弱性の解消
- [x] F-3: PROJECT_PLAN.md フォルダ構成図の最新化
- [x] F-4: next.config.js にセキュリティヘッダーを追加
- [x] F-5: `globals.css` のセクション分割（timeline.css・modal.css・animations.css）
- [x] F-6: 主要ロジックへのユニットテスト追加（vitest 導入）

### Phase G — 最終検証（リリース前最終確認）

- [x] G-1: MarkdownファイルのLint警告解消（`.markdownlint.json` の導入および書式修正）
- [x] G-2: 環境変数が未設定時の `webpush.setVapidDetails` エラー（ビルドクラッシュ）の解消
- [x] G-3: 本番用ビルドテスト (`npm run build`) での正常終了確認
