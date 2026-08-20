# 業務用SNSシステム（ブラウザ完結版 / Zero-Network）

> 社内・チーム・小規模グループ向けのプライベートSNSシステムです。  
> 外部サーバーやデータベース構築が一切不要で、ブラウザのローカルストレージ（`localStorage`）のみで完全に動作します。

---

## 1. システム概要と特徴

本システムは、外部へのネットワーク通信を完全に遮断（Zero-Network）し、ブラウザ完結で安全・高速に動作する業務用SNSシステムです。

### 🌟 主な特徴
- **0円運用・サーバー不要**: 外部データベース（PostgreSQLやSupabase等）の契約・構築が一切不要です。
- **外部通信完全遮断（Zero-Network）**: 機密情報や業務連絡が外部サーバーへ送信されるリスクがありません。
- **即時稼働**: `npm install` して `npm run dev`（または静的配信）を行うだけですぐに利用可能です。
- **データ永続化とバックアップ**: ブラウザの `localStorage` でデータを管理し、ワンクリックで JSON 形式のエクスポート（バックアップ）およびインポート（復元）が可能です。

---

## 2. 提供機能一覧

### 2.1. タイムライン・投稿機能
- **メッセージ投稿**: 最大1,000文字の本文入力、リアルタイム文字数カウンター
- **ファイル・画像添付**: 最大4ファイル（各5MBまで）を Base64 Data URL としてローカル保存・プレビュー表示（`JPEG, PNG, GIF, WEBP, PDF, TXT` 対応）
- **いいね！リアクション**: トグル式のいいね登録・解除、リアクション総数表示
- **投稿削除**: 投稿者本人または管理者による安全な削除

### 2.2. トークグループ管理
- **グループ作成**: 任意のグループ名とメンバーを指定して専用トークルームを作成
- **グループ別タイムライン**: 全体連絡と各グループのタブ切り替え表示
- **グループ退出・削除**: 作成者または管理者による管理機能

### 2.3. 合言葉（招待コード）認証
- **合言葉での参加**: 管理者が発行した合言葉を入力することで、グループへの参加やアクセス権の有効期限延長が可能
- **有効期限管理**: アカウントごとの利用期限（`expires_at`）によるアクセス制御

### 2.4. 簡易管理ダッシュボード（`/admin`）
- **メンバー管理**: 参加ユーザーの一覧確認、権限（Admin / Member）の変更、ユーザー削除
- **合言葉発行**: 有効期限（1日・1週間・1ヶ月・1年）および参加対象グループを指定した合言葉の発行・削除
- **監査ログ閲覧**: プロフィール更新、グループ作成、権限変更等の操作履歴をローカルに自動記録

### 2.5. データ管理・シミュレーター
- **JSONバックアップ＆復元**: 全データを 1 つの JSON ファイルとしてエクスポートおよびインポート
- **デモ初期データリセット**: 初期データ（デモ用ユーザー・投稿・グループ）へワンクリックでリセット
- **検証用ユーザーシミュレーター**: 管理者・一般ユーザー・期限切れユーザー等の視点を即座に切り替えて動作確認が可能

---

## 3. セットアップと起動手順

### 3.1. 動作環境
- **Node.js**: v18 以上 (Node.js 20 LTS 推奨)
- **ブラウザ**: Google Chrome, Microsoft Edge, Safari, Firefox 等

### 3.2. 起動コマンド

```bash
# 1. 依存パッケージのインストール
npm install

# 2. 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` を開くと、すぐにシステムがご利用いただけます。

### 3.3. ビルドと静的運用

```bash
# プロダクションビルド
npm run build

# 本番起動
npm run start
```

---

## 4. デモ用初期アカウント・合言葉

初期起動時に以下のデータが自動シードされます：

| ユーザー名 | ユーザーID | 権限 | 備考 |
|---|---|---|---|
| システム管理者 (佐藤) | `admin_user` | ADMIN | 管理ダッシュボードの利用が可能 |
| 一般ユーザー (山田) | `member_user` | MEMBER | 標準ユーザー |
| Aさん 〜 Hさん | `user_a` 〜 `user_h` | MEMBER | グループチャット検証用 |
| 期限切れユーザー (田中) | `expired_user` | MEMBER | アクセス失効画面の確認用 |

- **管理ダッシュボード（`/admin`）の初期パスワード**: `admin`
- **初期登録済みの合言葉**: `note123`（一般参加）, `vip2026`（プロジェクト開発班）

---

## 5. 免責事項・承諾書

本ソフトウェアは現状有姿（AS IS）で提供され、動作の完全性および特定目的への適合性を保証するものではありません。機密データや業務データの運用にあたっては、定期的な JSON バックアップの実施を推奨いたします。

---

## 6. ライセンス (MIT License)

本プロジェクトは **MITライセンス** の下で公開されています。

```plaintext
MIT License

Copyright (c) 2026 tk030-lotto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
