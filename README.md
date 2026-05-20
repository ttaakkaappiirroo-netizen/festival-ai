# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

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
