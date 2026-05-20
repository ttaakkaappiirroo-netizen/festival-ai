#!/usr/bin/env node
/**
 * 育英祭OS — Discord Webhook 通知スクリプト
 *
 * 使い方:
 *   node scripts/notify-discord.js build  [追加メッセージ]
 *   node scripts/notify-discord.js commit [追加メッセージ]
 *
 * 仕組み:
 *   - .env の DISCORD_WEBHOOK_URL を読み取り Discord へ通知します。
 *   - URL 未設定・送信失敗でも exit 0（ビルドやコミットを失敗させません）。
 *   - Node.js 標準機能のみで動作（外部パッケージ不要）。
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

// --- .env を読み込む（依存パッケージなし） --------------------------------
function loadEnv() {
  const env = {}
  try {
    const raw = readFileSync(join(projectRoot, '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/)
      if (!m || line.trim().startsWith('#')) continue
      let value = m[2]
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      env[m[1]] = value
    }
  } catch {
    // .env が無ければ無視（process.env のみ使用）
  }
  return env
}

// --- git 情報を取得（失敗しても空文字） -----------------------------------
function git(args) {
  try {
    return execSync(`git ${args}`, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return ''
  }
}

// --- 通知ペイロードを組み立てる -------------------------------------------
function buildEmbed(type, extraMessage) {
  const branch = git('rev-parse --abbrev-ref HEAD') || '(unknown)'
  const hash = git('rev-parse --short HEAD') || '-'
  const subject = git('log -1 --pretty=%s') || '-'
  const author = git('log -1 --pretty=%an') || '-'

  const fields = [
    { name: 'ブランチ', value: `\`${branch}\``, inline: true },
    { name: 'コミット', value: `\`${hash}\``, inline: true },
  ]

  let title
  let color
  if (type === 'commit') {
    title = '📝 新しいコミット'
    color = 0x5865f2 // Discord blurple
    fields.push(
      { name: 'メッセージ', value: subject, inline: false },
      { name: '作成者', value: author, inline: true },
    )
  } else {
    title = '✅ ビルド成功'
    color = 0x57f287 // green
    fields.push({ name: '最新コミット', value: `${subject}`, inline: false })
  }

  return {
    title,
    color,
    description: extraMessage || '育英祭OS の作業が完了しました。',
    fields,
    footer: { text: 'festival-ai / notify-discord' },
    timestamp: new Date().toISOString(),
  }
}

// --- メイン ---------------------------------------------------------------
async function main() {
  const type = (process.argv[2] || 'build').toLowerCase()
  const extraMessage = process.argv.slice(3).join(' ').trim()

  // process.env を優先しつつ .env をマージ
  const env = { ...loadEnv(), ...process.env }
  const webhookUrl = env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.log(
      '[notify-discord] DISCORD_WEBHOOK_URL が未設定のため通知をスキップしました。',
    )
    return
  }

  const payload = {
    username: '育英祭OS Bot',
    embeds: [buildEmbed(type, extraMessage)],
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(`[notify-discord] 送信失敗: HTTP ${res.status}`)
      return
    }
    console.log(`[notify-discord] Discord へ通知しました（${type}）。`)
  } catch (err) {
    console.error(`[notify-discord] 送信エラー: ${err.message}`)
  }
}

// 通知の失敗でビルド・コミットを止めないよう、常に exit 0
main().finally(() => process.exit(0))
