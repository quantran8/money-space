#!/usr/bin/env node
/**
 * Guards the product's voice.
 *
 * Money Space is a shared financial picture for a couple, not a surveillance or
 * budgeting tool. The v3.1 spec (08-brand-copy-wireframes.md §3, design.md
 * §16.3/§17) bans a specific vocabulary because it reframes the product as
 * control, judgement, or blame — the exact failure mode that would make a
 * partner refuse to use it.
 *
 * This check greps the i18n resources, which is where every user-facing string
 * must live anyway. It runs as part of `npm run lint`.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const RESOURCES = join(root, 'src/i18n/resources.ts')

/**
 * Each entry is [banned phrase, why it is banned]. Matching is
 * case-insensitive and diacritic-sensitive (Vietnamese tone marks are
 * meaningful — "kiểm soát" is banned, "kiem soat" is not a real string).
 */
const BANNED = [
  ['kiểm soát', 'frames the product as control, not shared clarity'],
  ['theo dõi đối phương', 'surveillance framing'],
  ['truy vết', 'surveillance framing'],
  ['đáng ngờ', 'implies suspicion of the partner'],
  ['hoang phí', 'judgement of spending'],
  ['sai lầm', 'judgement of a past decision'],
  ['không được mua', 'the product never decides for the user'],
  ['bạn nên mua', 'the product never decides for the user'],
  ['bạn không nên mua', 'the product never decides for the user'],
  ['mua được', 'verdict framing — show consequence, not a verdict'],
  ['không mua được', 'verdict framing — show consequence, not a verdict'],
  ['cảnh báo nghiêm trọng', 'alarm framing; use calm attention copy'],
  ['vượt chi', 'budgeting/overspend framing — this is not a budget app'],
  ['ai tiêu khoản này', 'asks who spent, not who is responsible for holding it'],
  ['phân tích rủi ro', 'risk-analysis framing is not the product voice'],
  ['kiểm tra ngay', 'urgency/alarm framing'],
  ['theo dõi chi tiêu', 'expense-tracking framing — explicitly not the product'],
  ['ngân sách được phép tiêu', 'flexible money is not a spending allowance'],
  ['số tiền bạn nên tiêu', 'flexible money is not a spending recommendation'],
]

/**
 * "Cảnh báo" alone is banned as a label, but it legitimately appears inside
 * longer allowed phrases. Only flag it when it is not part of one of these.
 */
const CONTEXTUAL = [['cảnh báo', 'alarm framing; prefer "Cần cập nhật" / "Cần chú ý"']]

/**
 * Exact substrings where a banned word appears *being negated* — copy that
 * states the product does NOT do the banned thing. Each entry must be a long
 * enough span that it cannot accidentally cover a real violation.
 *
 * Keep this list short. If it grows, the rule is probably wrong.
 */
const ALLOWED = [
  // "…clear, but without creating a feeling of control."
  'không tạo cảm giác kiểm soát',
  // "Notifications should use a 'worth reviewing' tone rather than 'alert'."
  'thay vì "cảnh báo"',
]

let source
try {
  source = readFileSync(RESOURCES, 'utf8')
} catch {
  console.error(`check-copy: cannot read ${RESOURCES}`)
  process.exit(1)
}

const lines = source.split('\n')
const findings = []

for (const [phrase, reason] of [...BANNED, ...CONTEXTUAL]) {
  lines.forEach((line, index) => {
    const lower = line.toLowerCase()
    if (!lower.includes(phrase)) return
    // Skip lines whose only use of the word is an explicitly allowed negation.
    if (ALLOWED.some((allowed) => lower.includes(allowed))) return
    findings.push({ phrase, reason, line: index + 1, text: line.trim() })
  })
}

if (findings.length > 0) {
  console.error('\n✖ Banned copy found in src/i18n/resources.ts\n')
  for (const f of findings) {
    console.error(`  resources.ts:${f.line}  "${f.phrase}" — ${f.reason}`)
    console.error(`    ${f.text.slice(0, 120)}`)
  }
  console.error(
    '\nSee family-finance-v3.1/08-brand-copy-wireframes.md §3 and design.md §16 for the preferred vocabulary.\n',
  )
  process.exit(1)
}

console.log('✓ copy check passed — no banned vocabulary in i18n resources')
