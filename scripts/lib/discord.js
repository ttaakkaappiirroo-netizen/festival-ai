/**
 * Discord Webhook 送信の共通モジュール（依存パッケージなし）
 * notify-discord.js と manager.js から利用します。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// scripts/lib/ から見たプロジェクトルート
export const projectRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
)

// Discord Embed の色
export const COLORS = {
  green: 0x57f287,
  blurple: 0x5865f2,
  yellow: 0xfee75c,
  red: 0xed4245,
}

// .env を読み込む（外部パッケージ不使用）
export function loadEnv() {
  const env = {}
  try {
    const raw = readFileSync(join(projectRoot, '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      if (line.trim().startsWith('#')) continue
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/)
      if (!m) continue
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

/**
 * Discord へ Embed を送信する。
 * URL 未設定・送信失敗でも例外は投げず false を返す（ビルド等を止めない）。
 */
export async function sendDiscord(embed, { username = '育英祭OS Bot' } = {}) {
  const env = { ...loadEnv(), ...process.env }
  const url = env.DISCORD_WEBHOOK_URL

  if (!url) {
    console.log(
      '[discord] DISCORD_WEBHOOK_URL が未設定のため通知をスキップしました。',
    )
    return false
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, embeds: [embed] }),
    })
    if (!res.ok) {
      console.error(`[discord] 送信失敗: HTTP ${res.status}`)
      return false
    }
    return true
  } catch (err) {
    console.error(`[discord] 送信エラー: ${err.message}`)
    return false
  }
}
