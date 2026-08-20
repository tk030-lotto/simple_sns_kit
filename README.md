# 業務用SNSシステム（シンプル配布パッケージ版）

> 社内・チーム・小規模グループ向けのプライベートSNSシステムです。  
> クローズドな組織での利用に最適化されています。

---

## 1. システム概要と特徴

本システムは、社内・グループ内での安全なコミュニケーション基盤を提供する業務用SNSシステムです。

### 主な機能

- **タイムライン（投稿・削除・リアクション）**
  - テキスト投稿、画像・ファイルの添付機能（Supabase Storage）
  - いいね・解除のトグル式リアクション機能
  - Supabase Realtime によるリアルタイムタイムライン同期

- **アクセス制御（共通ゲートキーパー）**
  - `expires_at` フィールドを用いたアクセス制御（Supabase RLS連携）
  - 有効期限切れユーザーのアクセスをDBレベルで完全遮断

- **トークグループ機能**
  - グループの作成・メンバー管理・退出
  - 合言葉（招待コード）によるグループ参加
  - グループ別タイムライン切り替え表示

- **免責ライセンスゲート**
  - 起動時に免責条項への同意を要求するゲート画面（`/login`）

- **100%自動操作ログ（監査ログ）**
  - 全操作ログを `plugin_audit_logs` に自動記録

- **Web Push通知**
  - ブラウザプッシュ通知によるアイコンバッジ通知

- **管理者ダッシュボード（`/admin`）**
  - メンバー一覧表示・権限変更・強制削除
  - 合言葉（招待コード）の発行・削除
  - 監査ログの閲覧

---

## 2. セットアップ手順（利用者が設定する項目）

本システムは、**実利用者（導入者）が自身の Supabase データベースおよび Vercel サーバーを新規作成・設定して運用する設計**となっています。開発者側のキーやアカウントは引き継がれません。

### 2.1. 利用者が用意・設定する必須項目一覧

| # | 項目 | 設定場所 | 内容 |
|---|---|---|---|
| 1 | Supabaseプロジェクトの作成 | [supabase.com](https://supabase.com) | 無料アカウントで新規プロジェクトを作成 |
| 2 | DBスキーマの適用 | Supabase SQL Editor | 同梱の `schema.sql` を貼り付けて実行 |
| 3 | Vercelへのデプロイ | [vercel.com](https://vercel.com) | 自身のVercelアカウントに本コードを連携してデプロイ |
| 4 | 環境変数の設定 | Vercel環境変数 | 自身のSupabase URL/APIキーおよび管理者パスワードを設定 |

### 2.2. 環境変数の設定

`.env.example` を参考に、Vercelの環境変数管理画面（またはローカルテスト用の `.env.local`）に以下の環境変数を設定してください。

```bash
# Supabase接続設定 (自身のSupabaseプロジェクト Settings > API から取得)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 免責同意ゲート
NEXT_PUBLIC_REQUIRE_LICENSE_AGREEMENT="true"
NEXT_PUBLIC_LICENSE_AGREEMENT_VERSION="1.0.0"

# 管理者パスワード (任意の強いパスワードに設定してください)
ADMIN_PASSWORD="your-strong-admin-password"
```

### 2.3. データベースのセットアップ

1. [Supabase](https://supabase.com) の **SQL Editor** を開きます
2. 同梱されている `schema.sql` の内容をすべてコピーして貼り付け、**「Run」** を実行します
3. **Storage** メニューで `sns-media` バケットが作成され、Public設定になっていることを確認します

---

## 3. ライセンス

本プロジェクトは **MITライセンス** の下で公開されています。
詳細は [LICENSE](./LICENSE) をご参照ください。
