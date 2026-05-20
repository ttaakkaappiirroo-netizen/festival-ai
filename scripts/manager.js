#!/usr/bin/env node
/**
 * AI Manager — ai-tasks/tasks.md を Current / Doing / Done で管理するツール
 *
 * 使い方:
 *   node scripts/manager.js list            タスクボードを表示
 *   node scripts/manager.js start [指定]    タスクを Doing へ移動（作業開始）
 *   node scripts/manager.js done            build 実行 → 成功で Doing を Done へ
 *
 * [指定] は番号（1始まり）または部分一致する文字列。省略時は先頭のタスク。
 *
 * tasks.md は markdown parser (remark) で AST 経由で編集するため、
 * 見出しや他セクションを壊しません。
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { remark } from 'remark'
import { COLORS, projectRoot, sendDiscord } from './lib/discord.js'

// テスト用に TASKS_FILE で差し替え可能
const TASKS_PATH =
  process.env.TASKS_FILE || join(projectRoot, 'ai-tasks', 'tasks.md')

const SECTION = {
  current: 'Current Tasks',
  doing: 'Doing',
  done: 'Done',
}

// remark プロセッサ（箇条書きは "-" に統一）
const md = remark()
md.data('settings', { bullet: '-', listItemIndent: 'one' })

// --- tasks.md 入出力 ------------------------------------------------------
function readTree() {
  return md.parse(readFileSync(TASKS_PATH, 'utf8'))
}

function writeTree(tree) {
  writeFileSync(TASKS_PATH, md.stringify(tree), 'utf8')
}

// --- mdast ヘルパ ---------------------------------------------------------
// ノード以下のテキストを連結
function nodeText(node) {
  if (typeof node.value === 'string') return node.value
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('')
  return ''
}

// 見出しテキストから tree.children 内のインデックスを取得
function findHeadingIndex(tree, title) {
  return tree.children.findIndex(
    (n) => n.type === 'heading' && nodeText(n).trim() === title,
  )
}

// 見出しに属する list ノードを取得（{ hIdx, list }、無ければ list: null）
function findSection(tree, title) {
  const hIdx = findHeadingIndex(tree, title)
  if (hIdx === -1) return { hIdx: -1, list: null }
  for (let i = hIdx + 1; i < tree.children.length; i++) {
    const n = tree.children[i]
    if (n.type === 'heading') break // 次セクションに到達
    if (n.type === 'list') return { hIdx, list: n }
  }
  return { hIdx, list: null }
}

// セクションのタスク（listItem）配列
function getItems(tree, title) {
  const { list } = findSection(tree, title)
  return list ? [...list.children] : []
}

// 見出しが無ければ afterTitle セクションの直後に作成
function ensureSection(tree, title, afterTitle) {
  if (findHeadingIndex(tree, title) !== -1) return
  let insertAt = tree.children.length
  const afterIdx = findHeadingIndex(tree, afterTitle)
  if (afterIdx !== -1) {
    insertAt = afterIdx + 1
    while (
      insertAt < tree.children.length &&
      tree.children[insertAt].type !== 'heading'
    ) {
      insertAt++
    }
  }
  tree.children.splice(insertAt, 0, {
    type: 'heading',
    depth: 2,
    children: [{ type: 'text', value: title }],
  })
}

// listItem を fromTitle から toTitle へ移動（見出し・他セクションは保持）
function moveItem(tree, fromTitle, toTitle, item) {
  const from = findSection(tree, fromTitle)
  if (from.list) {
    const i = from.list.children.indexOf(item)
    if (i !== -1) from.list.children.splice(i, 1)
    if (from.list.children.length === 0) {
      const listIdx = tree.children.indexOf(from.list)
      if (listIdx !== -1) tree.children.splice(listIdx, 1)
    }
  }
  let to = findSection(tree, toTitle)
  if (!to.list) {
    tree.children.splice(to.hIdx + 1, 0, {
      type: 'list',
      ordered: false,
      spread: false,
      children: [],
    })
    to = findSection(tree, toTitle)
  }
  to.list.children.push(item)
}

// 番号 or 部分一致でタスクを選択
function pickItem(items, arg) {
  if (!arg) return items[0]
  const n = Number(arg)
  if (Number.isInteger(n) && n >= 1 && n <= items.length) return items[n - 1]
  return items.find((it) => nodeText(it).includes(arg)) || null
}

// --- コマンド ------------------------------------------------------------
function cmdList() {
  const tree = readTree()
  console.log(`\n📋 タスクボード（${TASKS_PATH}）`)
  for (const key of ['current', 'doing', 'done']) {
    const title = SECTION[key]
    const items = getItems(tree, title)
    console.log(`\n## ${title} (${items.length})`)
    if (items.length === 0) {
      console.log('  （なし）')
    } else {
      items.forEach((it, i) =>
        console.log(`  ${i + 1}. ${nodeText(it).trim()}`),
      )
    }
  }
  console.log()
}

async function cmdStart(arg) {
  const tree = readTree()
  ensureSection(tree, SECTION.doing, SECTION.current)

  const items = getItems(tree, SECTION.current)
  if (items.length === 0) {
    console.log('⚠ Current Tasks が空です。tasks.md にタスクを追加してください。')
    return
  }
  const item = pickItem(items, arg)
  if (!item) {
    console.log(`⚠ 指定タスク「${arg}」が Current Tasks に見つかりません。`)
    process.exitCode = 1
    return
  }

  const text = nodeText(item).trim()
  moveItem(tree, SECTION.current, SECTION.doing, item)
  writeTree(tree)
  console.log(`▶ Doing へ移動しました: ${text}`)

  await sendDiscord({
    title: '▶ 作業開始',
    description: text,
    color: COLORS.yellow,
    fields: [{ name: 'ステータス', value: 'Current → Doing', inline: true }],
    footer: { text: 'AI Manager' },
    timestamp: new Date().toISOString(),
  })
}

async function cmdDone() {
  // 1. ビルド実行
  console.log('🔨 npm run build を実行します...\n')
  let buildOk = true
  try {
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })
  } catch {
    buildOk = false
  }

  if (!buildOk) {
    console.error('\n❌ ビルド失敗。Done への移動を中止しました。')
    await sendDiscord({
      title: '❌ ビルド失敗',
      description: 'ビルドが失敗したため、タスクは Doing のままです。',
      color: COLORS.red,
      footer: { text: 'AI Manager' },
      timestamp: new Date().toISOString(),
    })
    process.exitCode = 1
    return
  }

  // 2. Doing → Done へ移動
  const tree = readTree()
  ensureSection(tree, SECTION.done, SECTION.doing)
  const items = getItems(tree, SECTION.doing)
  if (items.length === 0) {
    console.log('\n✅ ビルド成功。ただし Doing にタスクがありません。')
    return
  }

  const texts = items.map((it) => nodeText(it).trim())
  for (const item of items) {
    moveItem(tree, SECTION.doing, SECTION.done, item)
  }
  writeTree(tree)
  console.log(`\n✅ ビルド成功。Done へ移動しました:`)
  texts.forEach((t) => console.log(`   • ${t}`))

  await sendDiscord({
    title: '✅ タスク完了',
    description: texts.map((t) => `• ${t}`).join('\n'),
    color: COLORS.green,
    fields: [{ name: 'ビルド', value: '成功', inline: true }],
    footer: { text: 'AI Manager' },
    timestamp: new Date().toISOString(),
  })
}

function usage() {
  console.log(`AI Manager — tasks.md 管理ツール

  node scripts/manager.js list           タスクボードを表示
  node scripts/manager.js start [指定]   タスクを Doing へ移動
  node scripts/manager.js done           build 成功で Doing → Done

  [指定] = 番号 または 部分一致文字列（省略時は先頭）`)
}

async function main() {
  const [command, ...rest] = process.argv.slice(2)
  switch (command) {
    case 'list':
      cmdList()
      break
    case 'start':
      await cmdStart(rest.join(' ').trim())
      break
    case 'done':
      await cmdDone()
      break
    default:
      usage()
      if (command) process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(`[manager] エラー: ${err.message}`)
  process.exitCode = 1
})
