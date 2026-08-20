# コミュニティ向けSNS ベースキット

本システムは、Next.js と Supabase を用いて構築された
クローズドコミュニティ向けの SNS アプリケーションです。
小規模なコミュニティやチーム内のコミュニケーションツールとして、
手軽にデプロイして使用することができます。

---

## 1. 主な機能

初心者でも簡単に使えるように、コミュニケーションに必須の機能を
コンパクトにまとめています。

* **タイムライン投稿機能**
  * テキストだけでなく、画像の添付も可能です。
  * 投稿に対する「いいね」リアクション機能がついています。
* **トークグループ（コミュニティ）の作成**
  * ユーザー同士で任意のグループを作成し、チャットのように利用できます。
* **サイト全体の Basic 認証（オプション）**
  * 外部からのアクセスを完全に遮断したい場合、Basic認証をかけられます。
* **簡易管理画面**
  * 管理者権限を持つユーザーは、参加用合言葉の発行などが可能です。

---

## 2. 環境構築とセットアップ

環境構築やデプロイの手順については、同梱されている
`AI_SETUP_GUIDE.md` をご参照ください。
AI アシスタント（ChatGPT 等）を使いながら、
ステップバイステップで簡単にセットアップを進めることができます。

### 動作要件

* **Node.js**: 20 LTS
* **データベース**: Supabase (PostgreSQL)
* **デプロイ先**: Vercel (推奨)

---

## 3. 高度な応用機能（開発者向け）

本システムには、より高度な運用を行うためのオプション機能が含まれています。
必要に応じて有効化してご利用ください。

### 3.1. 免責ライセンスゲート（利用規約同意）機能

ユーザーが初めてログインした際に、利用規約や免責事項への同意を求める
ゲート画面を表示できます。
環境変数 `NEXT_PUBLIC_REQUIRE_LICENSE_AGREEMENT="true"` を設定すると
有効になります。

### 3.2. 外部連携と自動期限管理

* **Webhook 連携**: 外部からの通知を受け取り自動投稿を代行できます。
* **note マンスリー認証**: 月次でのユーザー有効期限管理の仕組みを同梱しています。
* **100% 自動監査ログ**: 全ての操作ログを DB トリガーで自動記録します。

---

## 4. ソフトウェア利用に関する承諾事項と免責事項

本ソフトウェアを業務等で第三者に提供・運用する場合は、
以下の承諾書の内容を参考に、法的リスクを回避してください。

### 【ソフトウェア利用に関する承諾書】

```plaintext
【ソフトウェア利用に関する承諾書】

本ソフトウェア（以下「本システム」という）は、クライアントごとの個別要件に最適化して提供される、MITライセンスベースの個別システムです。

（無保証） 利用者は、本システムに不具合やバグが存在する可能性があることを理解し、現状有姿で利用するものとします。
（免責） 制作者は、本システムの利用、または利用不能によって生じた損害（データの消失、業務の中断、営業利益の損失などを含むがこれらに限定されない）について、一切の法的責任および賠償責任を負わないものとします。
（ライセンス） 本システムの著作権は制作者に帰属し、MITライセンスに基づいて提供されます。

署名日：2026年 ＿月 ＿日
利用者氏名（サイン）：＿＿＿＿＿＿＿＿＿＿＿
```

---

## 5. ライセンス (MIT License)

本プロジェクトは **MIT ライセンス** の下で公開されています。
詳細は以下の通りです。

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
