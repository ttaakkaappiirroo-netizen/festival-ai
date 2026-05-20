#!/usr/bin/env node
/**
 * Multi Agent System — エージェント実行ランナー
 *
 * 使い方:
 *   node scripts/agent-runner.js <agent> <task...> [--build]
 *
 *   <agent> : frontend | backend | debug | manager
 *   <task>  : タスク内容（自由記述）
 *   --build : npm run build を実行し、結果をログ・通知に含める
 *
 * agent 名と task を受け取り、logs/<agent>.log に実行ログを追記し、
 * Discord へ agent 名入りで通知します。
 */
import { execSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { COLORS, projectRoot, sendDiscord } from './lib/discord.js'

// エージェント定義
const AGENTS = {
  frontend: { emoji: '🎨', label: 'Frontend', color: COLORS.blurple },
  backend: { emoji: '🗄️', label: 'Backend', color: COLORS.green },
  debug: { emoji: '🐛', label: 'Debug', color: COLORS.red },
  manager: { emoji: '📋', label: 'Manager', color: COLORS.yellow },
}

const LOG_DIR = process.env.LOG_DIR || join(projectRoot, 'logs')
const AGENTS_DIR = join(projectRoot, 'agents')

function now() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  )
}

// agents/<agent>.md の「## 役割」セクションを抜き出す
function readRole(agent) {
  try {
    const md = readFileSync(join(AGENTS_DIR, `${agent}.md`), 'utf8')
    const m = md.match(/##\s*役割\s*\n+([\s\S]*?)(?:\n##\s|\s*$)/)
    return m ? m[1].trim().replace(/\s+/g, ' ') : ''
  } catch {
    return ''
  }
}

function appendLog(agent, text) {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true })
  appendFileSync(join(LOG_DIR, `${agent}.log`), text, 'utf8')
}

async function main() {
  const args = process.argv.slice(2)
  const doBuild = args.includes('--build')
  const [agent, ...taskParts] = args.filter((a) => a !== '--build')
  const task = taskParts.join(' ').trim()

  // --- 入力検証 ---
  if (!agent || !AGENTS[agent]) {
    console.error(
      '使い方: node scripts/agent-runner.js <agent> <task...> [--build]',
    )
    console.error(`  <agent> : ${Object.keys(AGENTS).join(' | ')}`)
    process.exitCode = 1
    return
  }
  if (!task) {
    console.error('⚠ タスク内容を指定してください。')
    process.exitCode = 1
    return
  }

  const meta = AGENTS[agent]
  const role = readRole(agent)
  const startedAt = now()

  console.log(`${meta.emoji} ${meta.label} Agent`)
  if (role) console.log(`  役割  : ${role}`)
  console.log(`  タスク: ${task}`)

  // --- build 確認（任意） ---
  let buildResult = null
  if (doBuild) {
    console.log('\n🔨 npm run build ...\n')
    try {
      execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })
      buildResult = '成功'
    } catch {
      buildResult = '失敗'
    }
  }

  // --- ログ保存（logs/<agent>.log へ追記） ---
  const failed = buildResult === '失敗'
  const block =
    `${'─'.repeat(52)}\n` +
    `[${startedAt}] ${meta.emoji} AGENT: ${agent}\n` +
    `TASK   : ${task}\n` +
    (buildResult ? `BUILD  : ${buildResult}\n` : '') +
    `RESULT : ${failed ? 'ビルド失敗' : '記録完了'}\n` +
    `END    : ${now()}\n`
  appendLog(agent, block)
  console.log(`\n📝 ログ保存: logs/${agent}.log`)

  // --- Discord 通知（agent 名を含める） ---
  await sendDiscord({
    title: `${meta.emoji} ${meta.label} Agent`,
    description: task,
    color: failed ? COLORS.red : meta.color,
    fields: [
      { name: 'エージェント', value: `\`${agent}\``, inline: true },
      ...(buildResult
        ? [{ name: 'ビルド', value: buildResult, inline: true }]
        : []),
      { name: 'ログ', value: `logs/${agent}.log`, inline: false },
    ],
    footer: { text: 'Multi Agent System / agent-runner' },
    timestamp: new Date().toISOString(),
  })

  if (failed) process.exitCode = 1
}

main().catch((err) => {
  console.error(`[agent-runner] エラー: ${err.message}`)
  process.exitCode = 1
})
