#!/usr/bin/env node
/**
 * 育英祭OS — Discord Webhook 通知スクリプト
 *
 * 使い方:
 *   node scripts/notify-discord.js build  [追加メッセージ]
 *   node scripts/notify-discord.js commit [追加メッセージ]
 *
 * .env の DISCORD_WEBHOOK_URL を読み取り通知します。
 * URL 未設定・送信失敗でも exit 0（ビルドやコミットを失敗させません）。
 */
import { execSync } from 'node:child_process'
import { COLORS, projectRoot, sendDiscord } from './lib/discord.js'

// git 情報を取得（失敗しても空文字）
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
    color = COLORS.blurple
    fields.push(
      { name: 'メッセージ', value: subject, inline: false },
      { name: '作成者', value: author, inline: true },
    )
  } else {
    title = '✅ ビルド成功'
    color = COLORS.green
    fields.push({ name: '最新コミット', value: subject, inline: false })
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

async function main() {
  const type = (process.argv[2] || 'build').toLowerCase()
  const extraMessage = process.argv.slice(3).join(' ').trim()
  const ok = await sendDiscord(buildEmbed(type, extraMessage))
  if (ok) console.log(`[notify-discord] Discord へ通知しました（${type}）。`)
}

// 通知の失敗でビルド・コミットを止めないよう、常に exit 0
main().finally(() => process.exit(0))
