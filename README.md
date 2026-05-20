# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

> 🛠️ **別の PC でゼロから環境を構築する場合は [SETUP.md](./SETUP.md) を参照してください。**
> WSL・Node.js・clone・`.env`・Supabase・Discord 設定をコピペ手順でまとめています。

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## AI Manager

`ai-tasks/tasks.md` のタスクを **Current / Doing / Done** の3セクションで管理するツールです。
タスクの編集は markdown parser（[remark](https://github.com/remarkjs/remark)）で AST を経由して行うため、
見出しや他セクション（Rules など）が壊れません。

### コマンド

| npm script | 動作 |
| --- | --- |
| `npm run task:list` | タスクボード（Current / Doing / Done）を表示 |
| `npm run task:start` | タスクを **Doing** へ移動（作業開始） |
| `npm run task:done` | `npm run build` を実行し、**成功時のみ** Doing のタスクを **Done** へ移動 |

### 使い方

```sh
# 1. 現在のタスクを確認
npm run task:list

# 2. 作業開始：先頭の Current タスクを Doing へ
npm run task:start

#    番号や部分一致でタスクを指定することも可能（-- の後に引数）
npm run task:start -- 2
npm run task:start -- "デプロイ"

# 3. 作業完了：ビルドが成功したら Doing → Done へ自動移動
npm run task:done
```

- `task:done` はビルドが**失敗した場合タスクを Doing のまま**残し、Discord に失敗を通知します。
- 新しいタスクは `ai-tasks/tasks.md` の `## Current Tasks` に箇条書きで追記してください。

### Discord 進捗通知

`.env` に `DISCORD_WEBHOOK_URL` を設定すると、各操作時に Discord へ通知します
（未設定でもツールは通常どおり動作します）。

| タイミング | 通知内容 |
| --- | --- |
| `task:start` | ▶ 作業開始（Current → Doing） |
| `task:done`（成功） | ✅ タスク完了（Doing → Done） |
| `task:done`（失敗） | ❌ ビルド失敗（Doing のまま） |
| `npm run build` 成功 | ✅ ビルド成功（`postbuild` フック） |
| `git commit` | 📝 新しいコミット（`post-commit` フック） |

`.env` の設定例は `.env.example` を参照してください。

---

## AI Worker（自動 PR 作成）

現在の変更内容から feature ブランチを作成し、**ビルド成功時のみ** commit / push して
GitHub CLI (`gh`) で Pull Request を作成、結果を Discord へ通知するフローです。

### コマンド

| npm script | 動作 |
| --- | --- |
| `npm run pr:auto` | 変更から自動で PR を作成 |
| `npm run pr:auto -- --dry-run` | 実行せず計画のみ表示 |
| `npm run pr:auto -- "メッセージ"` | コミット/PR タイトルを指定 |

### 流れ

1. 変更を確認（無ければ終了）
2. feature ブランチ `auto-pr/<timestamp>` を作成
3. `npm run build` を実行
4. **成功** → `git add -A` → commit → push
5. `gh pr create` で Pull Request を作成
6. PR URL を Discord へ通知（`🚀 自動PR`）
7. いずれかで**失敗** → Discord へ失敗通知（`❌ 自動PR 失敗`）。
   コミット前の失敗なら作成したブランチを破棄して元ブランチへ戻します。

### 前提

- `gh` が認証済みであること（`gh auth login`）。`PATH` に無い場合は `~/.local/bin/gh` を自動探索します。
- PR のベースブランチは既定で `main`（環境変数 `PR_BASE` で変更可）。

```sh
# まず計画を確認してから実行するのが安全
npm run pr:auto -- --dry-run
npm run pr:auto -- "AI Worker: 出店データを更新"
```

---

## Multi Agent System

役割ごとに分かれた 4 つのエージェントで開発を分担する構成です。
各エージェントの定義（役割・禁止事項・作業範囲・build確認ルール・Git運用ルール）は
`agents/*.md` に記載しています。

### 構成図

```
                       ┌──────────────────┐
                       │   📋 Manager      │
                       │  タスク管理・割当  │
                       │  PR レビュー判断   │
                       └────────┬─────────┘
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │  🎨 Frontend   │ │  🗄️ Backend    │ │   🐛 Debug     │
     │  UI / CSS /    │ │  Supabase /    │ │  バグ修正 /    │
     │  コンポーネント │ │  API / データ  │ │  ビルド修復    │
     └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
             └─────────────────┼──────────────────┘
                               ▼
                  scripts/agent-runner.js
                               ▼
             logs/<agent>.log  +  Discord 通知
```

### エージェント定義

| エージェント | 定義ファイル | 主な担当 |
| --- | --- | --- |
| 🎨 Frontend | `agents/frontend.md` | React UI・CSS・レスポンシブ |
| 🗄️ Backend | `agents/backend.md` | Supabase・API・データ層 |
| 🐛 Debug | `agents/debug.md` | バグ修正・ビルド/lint エラー解消 |
| 📋 Manager | `agents/manager.md` | タスク管理・割り当て・PR 判断 |

### 実行

```sh
# agent 名 + task を渡して実行（ログ記録 + Discord 通知）
npm run agent -- frontend "ヘッダーのレスポンシブ調整"

# build 確認込みで実行
npm run agent -- debug "ビルドエラーの修正" --build
```

- 実行ログは `logs/<agent>.log` に追記されます（`logs/*.log` は Git 管理対象外）。
- Discord 通知にはエージェント名が含まれます。
