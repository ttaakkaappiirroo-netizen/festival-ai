#!/usr/bin/env node
/**
 * AI Worker — 自動 PR 作成フロー
 *
 * 現在の変更内容から feature ブランチを作成し、ビルド成功時のみ
 * commit / push して GitHub CLI (gh) で Pull Request を作成、
 * 結果を Discord へ通知します。
 *
 * 使い方:
 *   node scripts/auto-pr.js ["コミット/PRメッセージ"]
 *   node scripts/auto-pr.js --dry-run        実行せず計画のみ表示
 *
 * 流れ:
 *   1. 変更を確認（無ければ終了）
 *   2. feature ブランチ作成（auto-pr/<timestamp>）
 *   3. npm run build
 *   4. 成功 → git add / commit / push
 *   5. gh で PR 作成 → PR URL を Discord 通知
 *   6. いずれかで失敗 → Discord に失敗通知
 */
import { execFileSync, execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { COLORS, projectRoot, sendDiscord } from './lib/discord.js'

const BASE = process.env.PR_BASE || 'main'

// --- 引数 ----------------------------------------------------------------
const rawArgs = process.argv.slice(2)
const dryRun = rawArgs.includes('--dry-run')
const message =
  rawArgs.filter((a) => a !== '--dry-run').join(' ').trim() ||
  'AI Worker: 自動更新'

// --- ユーティリティ ------------------------------------------------------
// 末尾のみトリム（status --porcelain の行頭スペースを保持するため）
function git(args) {
  return execSync(`git ${args}`, {
    cwd: projectRoot,
    encoding: 'utf8',
  }).trimEnd()
}

function timestamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  )
}

// gh の場所を解決（PATH → ~/.local/bin/gh）
function resolveGh() {
  try {
    execSync('gh --version', { stdio: 'ignore' })
    return 'gh'
  } catch {
    const local = join(homedir(), '.local', 'bin', 'gh')
    return existsSync(local) ? local : null
  }
}

function prBody(files) {
  return [
    '## AI Worker 自動 PR',
    '',
    message,
    '',
    '### 変更ファイル',
    ...files.map((f) => `- \`${f}\``),
    '',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  ].join('\n')
}

async function notifyFailure(step, err) {
  await sendDiscord({
    title: '❌ 自動PR 失敗',
    description: `ステップ「${step}」で失敗しました。\n\`\`\`\n${err.message}\n\`\`\``,
    color: COLORS.red,
    footer: { text: 'AI Worker / auto-pr' },
    timestamp: new Date().toISOString(),
  })
}

// --- メイン --------------------------------------------------------------
async function main() {
  // 1. 変更確認
  const status = git('status --porcelain')
  if (!status) {
    console.log('変更がありません。auto-pr を終了します。')
    return
  }
  const files = status
    .split('\n')
    .map((l) => l.slice(3).trim())
    .filter(Boolean)
  const originalBranch = git('rev-parse --abbrev-ref HEAD')
  const branch = `auto-pr/${timestamp()}`

  // 2. dry-run（副作用なし）
  if (dryRun) {
    console.log('=== DRY RUN（実行しません）===')
    console.log(`元ブランチ   : ${originalBranch}`)
    console.log(`作成ブランチ : ${branch}`)
    console.log(`PR ベース    : ${BASE}`)
    console.log(`メッセージ   : ${message}`)
    console.log(`変更ファイル (${files.length}):`)
    files.forEach((f) => console.log(`  - ${f}`))
    console.log(`gh CLI       : ${resolveGh() || '見つかりません'}`)
    return
  }

  const gh = resolveGh()
  let step = '初期化'
  let committed = false
  try {
    // 3. ブランチ作成
    step = 'ブランチ作成'
    git(`checkout -b ${branch}`)
    console.log(`▶ ブランチ作成: ${branch}`)

    // 4. ビルド
    step = 'ビルド'
    console.log('🔨 npm run build ...\n')
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })

    // 5. add / commit / push
    step = 'コミット'
    git('add -A')
    execFileSync('git', ['commit', '-F', '-'], {
      cwd: projectRoot,
      input: `${message}\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>\n`,
    })
    committed = true
    console.log('▶ コミット完了')

    step = 'プッシュ'
    git(`push -u origin ${branch}`)
    console.log(`▶ push 完了: origin/${branch}`)

    // 6. PR 作成
    step = 'PR 作成'
    if (!gh) throw new Error('gh CLI が見つかりません（~/.local/bin/gh も無し）')
    const prUrl = execFileSync(
      gh,
      [
        'pr',
        'create',
        '--base',
        BASE,
        '--head',
        branch,
        '--title',
        message,
        '--body-file',
        '-',
      ],
      { cwd: projectRoot, input: prBody(files), encoding: 'utf8' },
    ).trim()
    console.log(`▶ PR 作成: ${prUrl}`)

    // 7. Discord 通知（成功）
    step = 'Discord 通知'
    await sendDiscord({
      title: '🚀 自動PR を作成しました',
      url: prUrl,
      description: message,
      color: COLORS.green,
      fields: [
        { name: 'ブランチ', value: `\`${branch}\``, inline: true },
        { name: 'ベース', value: `\`${BASE}\``, inline: true },
        { name: 'PR', value: prUrl, inline: false },
      ],
      footer: { text: 'AI Worker / auto-pr' },
      timestamp: new Date().toISOString(),
    })

    console.log(`\n✅ 完了。現在のブランチ: ${branch}`)
    console.log(`   元のブランチに戻る: git checkout ${originalBranch}`)
  } catch (err) {
    console.error(`\n❌ 「${step}」で失敗: ${err.message}`)
    await notifyFailure(step, err)
    // 後始末：コミット前なら元ブランチへ戻し、空ブランチを削除
    if (!committed) {
      try {
        git(`checkout ${originalBranch}`)
        git(`branch -D ${branch}`)
        console.error(`（${branch} を破棄し ${originalBranch} へ戻しました）`)
      } catch {
        /* 後始末失敗は無視 */
      }
    }
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(`[auto-pr] エラー: ${err.message}`)
  process.exitCode = 1
})
