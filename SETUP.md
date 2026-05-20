# 育英祭OS — セットアップガイド

別の PC で開発環境をゼロから復元するための手順です。
**Windows + WSL（Ubuntu）** を前提に、コピペで進められるようにまとめています。

> 💡 上から順に実行すれば動く状態になります。各ブロックの `$` は付けずにコマンドだけコピーしてください。

---

## 0. 全体の流れ

```
WSL → Node.js → Claude Code → git clone → npm install → .env 設定 → npm run dev
```

所要時間の目安：30〜60分（ダウンロード時間含む）

---

## 1. WSL のインストール（Windows）

WSL は Windows 上で Linux を動かす仕組みです。

1. スタートメニューで **PowerShell** を右クリック →「**管理者として実行**」
2. 次を実行：

```powershell
wsl --install
```

3. **PC を再起動**
4. 再起動後に Ubuntu が自動で起動します。**ユーザー名**と**パスワード**を設定してください
   （パスワードは入力中に画面に表示されませんが、入力されています）

確認：

```bash
wsl --version
```

> 💡 以降のコマンドはすべて **Ubuntu（WSL）のターミナル**で実行します。
> スタートメニューの「**Ubuntu**」から開けます。

---

## 2. Node.js のインストール（WSL 内）

このプロジェクトは **Node.js 22 以上**が必要です。`nvm` で入れるのが安全です。

```bash
# nvm（Node バージョン管理ツール）をインストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# シェルを再読み込み
source ~/.bashrc

# Node.js 22（LTS）をインストール
nvm install 22
nvm use 22
nvm alias default 22
```

確認：

```bash
node -v   # v22.x.x と表示されればOK
npm -v
```

---

## 3. Claude Code のインストール

AI 開発アシスタント（このプロジェクトの開発に使用）。

```bash
npm install -g @anthropic-ai/claude-code
```

確認と起動：

```bash
claude --version
claude              # 初回はブラウザでログインを求められます
```

---

## 4. Git の準備と GitHub から clone

```bash
# Git の名前とメールを設定（初回のみ）
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメール@example.com"

# ホームディレクトリへ移動して clone
cd ~
git clone https://github.com/ttaakkaappiirroo-netizen/festival-ai.git
cd festival-ai
```

> ⚠️ **作業は WSL 内（`~/festival-ai`）で行ってください。**
> `/mnt/c/...`（Windows 側）に置くと動作が非常に遅くなります。

### GitHub への push が必要な場合（GitHub CLI）

```bash
# GitHub CLI をインストール
sudo apt update && sudo apt install gh -y

# GitHub にログイン（ブラウザ認証）
gh auth login --hostname github.com --git-protocol https --web
```

> `gh` が見つからない場合は <https://cli.github.com> の手順を参照してください。

---

## 5. 依存パッケージのインストール

```bash
cd ~/festival-ai
npm install
```

---

## 6. .env の設定

`.env` は API キーなどを入れるファイルです（Git には登録されません）。
**未設定でもアプリは「デモモード」で動作します**（サンプルデータ表示）。

```bash
cp .env.example .env
nano .env      # 編集（保存: Ctrl+O → Enter、終了: Ctrl+X）
```

### 必要項目

| 変数 | 用途 | 必須 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL | 任意（本番データを使う場合） |
| `VITE_SUPABASE_ANON_KEY` | Supabase 公開キー | 任意（同上） |
| `DISCORD_WEBHOOK_URL` | Discord 通知用 Webhook URL | 任意（通知を使う場合） |

`.env` の例：

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxx/xxxx
```

---

## 7. Supabase 接続方法

出店・お知らせのデータをクラウド DB で管理します（任意）。

1. <https://supabase.com> でアカウント作成 → **New project** を作成
2. 左メニュー **SQL Editor** を開く
3. プロジェクト内の `supabase/schema.sql` の中身を全部コピーして貼り付け → **Run**
   （テーブル作成＋サンプルデータ投入。何度実行しても安全です）
4. 左下 **Project Settings → API** を開き、次をコピー：
   - **Project URL** → `.env` の `VITE_SUPABASE_URL`
   - **anon public** キー → `.env` の `VITE_SUPABASE_ANON_KEY`
5. `npm run dev` で再起動すると、デモバナーが消え本番データに切り替わります

> 接続できない場合はサンプルデータに自動フォールバックします（デモバナー表示）。

---

## 8. Discord Webhook の設定

ビルド・コミット・タスク進捗を Discord に通知します（任意）。

1. Discord で通知したい**サーバー**を開く
2. **サーバー設定 → 連携サービス → ウェブフック → 新しいウェブフック**
3. 通知先チャンネルを選び、**ウェブフック URL をコピー**
4. `.env` の `DISCORD_WEBHOOK_URL` に貼り付け

テスト送信：

```bash
npm run notify build "セットアップ完了テスト"
```

> ⚠️ Webhook URL は秘密情報です。他人に共有しないでください（`.env` は Git 管理外です）。

---

## 9. Cloudflare Pages（公開・概要）

作成したサイトをインターネットに公開する場合の概要です。

1. <https://dash.cloudflare.com> → **Workers & Pages → Create → Pages**
2. **GitHub リポジトリ `festival-ai` を接続**
3. ビルド設定：

| 項目 | 値 |
| --- | --- |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |

4. 環境変数に `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を登録（Supabase を使う場合）
5. `main` ブランチへ push するたびに自動デプロイされます

> ⚠️ React Router（`BrowserRouter`）使用のため、`/shops` などを直接開くと 404 になります。
> `public/_redirects` に `/*  /index.html  200` を追加すると解消できます。

---

## 10. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで <http://localhost:5173> を開くと育英祭OS が表示されます。
停止は `Ctrl + C`。

---

## 11. よく使うコマンド一覧

```bash
# --- 開発 ---
npm run dev          # 開発サーバー起動（localhost:5173）
npm run build        # 本番ビルド（成功時 Discord 通知）
npm run preview      # ビルド結果をプレビュー
npm run lint         # ESLint チェック

# --- AI Manager（タスク管理）---
npm run task:list                # タスクボード表示
npm run task:start               # 先頭タスクを Doing へ
npm run task:start -- "キーワード" # 指定タスクを Doing へ
npm run task:done                # build成功で Doing→Done

# --- AI Worker（自動PR）---
npm run pr:auto -- --dry-run        # 計画のみ表示（安全確認）
npm run pr:auto -- "メッセージ"      # 自動でPR作成

# --- Multi Agent System ---
npm run agent -- frontend "タスク内容"          # エージェント実行＋ログ
npm run agent -- debug "タスク内容" --build      # build確認込み

# --- Discord 通知 ---
npm run notify build "メッセージ"   # 手動通知

# --- Git ---
git status           # 変更確認
git pull             # 最新を取得
git add -A && git commit -m "メッセージ"
git push
```

---

## 12. トラブルシューティング

### `node: command not found` / バージョンが古い
```bash
source ~/.bashrc
nvm use 22
node -v
```

### `npm install` が失敗する
```bash
rm -rf node_modules package-lock.json
npm install
```

### ポート 5173 が使用中（`Port 5173 is in use`）
```bash
# 既存のプロセスを停止
pkill -f vite
# または別ポートで起動
npm run dev -- --port 5174
```

### `.env` が反映されない
- `.env` がプロジェクト直下（`~/festival-ai/.env`）にあるか確認
- 変数名が `VITE_` で始まっているか確認（フロント用）
- `npm run dev` を**再起動**する

### ビルドが失敗する
```bash
npm run lint        # まず lint エラーを確認・修正
npm run build
```

### `git push` で認証エラー
```bash
gh auth login --hostname github.com --git-protocol https --web
gh auth status      # ログイン状態を確認
```

### 動作が極端に遅い
プロジェクトが `/mnt/c/...`（Windows 側）に無いか確認。
WSL 内（`~/festival-ai`）に置き直してください。

### WSL が起動しない / 古い
PowerShell（管理者）で：
```powershell
wsl --update
wsl --shutdown
```

---

## 関連ドキュメント

- [`README.md`](./README.md) — AI Manager / AI Worker / Multi Agent System の詳細
- `agents/*.md` — 各エージェントの役割定義
- `supabase/schema.sql` — データベース定義
- `.env.example` — 環境変数のテンプレート
