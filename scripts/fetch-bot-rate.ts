import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'cheerio'

const SOURCE_URL = 'https://rate.bot.com.tw/xrt/quote/day/CNY'
const SOURCE_NAME = 'Bank of Taiwan'
const OUTPUT_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'rate.json')

interface ParsedRate {
  cashBuying: number | null
  cashSelling: number | null
  spotBuying: number
  spotSelling: number
  dateText: string
}

function toRateValue(raw: string): number | null {
  const value = raw.trim().replaceAll(',', '')
  if (!value || value === '-') {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`無法解析數字：${raw}`)
  }

  return parsed
}

function toFixed4(value: number): number {
  return Number(value.toFixed(4))
}

function parseLatestRate(html: string): ParsedRate {
  const $ = load(html)
  const rows = $('table tbody tr').toArray()

  for (const row of rows) {
    const cells = $(row)
      .find('td')
      .toArray()
      .map((cell) => $(cell).text().replace(/\s+/g, ' ').trim())

    if (cells.length < 6) {
      continue
    }

    const cashBuying = toRateValue(cells[2] ?? '')
    const cashSelling = toRateValue(cells[3] ?? '')
    const spotBuying = toRateValue(cells[4] ?? '')
    const spotSelling = toRateValue(cells[5] ?? '')

    if (spotBuying === null || spotSelling === null) {
      continue
    }

    return {
      cashBuying,
      cashSelling,
      spotBuying,
      spotSelling,
      dateText: cells[0] ?? '',
    }
  }

  throw new Error('找不到有效的 CNY 即期買入/賣出資料，可能是頁面結構已變更')
}

function toTaipeiIso(dateText: string): string {
  const normalized = dateText.trim()
  const dateMatch = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const lookup = (type: string): string => parts.find((part) => part.type === type)?.value ?? '00'
  const year = dateMatch ? dateMatch[1] : lookup('year')
  const month = dateMatch ? dateMatch[2].padStart(2, '0') : lookup('month')
  const day = dateMatch ? dateMatch[3].padStart(2, '0') : lookup('day')
  const hour = lookup('hour')
  const minute = lookup('minute')
  const second = lookup('second')

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; exchange-rate-bot/1.0)',
    },
  })

  if (!response.ok) {
    throw new Error(`讀取臺灣銀行頁面失敗（HTTP ${response.status}）`)
  }

  const html = await response.text()
  const parsed = parseLatestRate(html)
  const midRate = toFixed4((parsed.spotBuying + parsed.spotSelling) / 2)

  const ratePayload = {
    source: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    currency: 'CNY' as const,
    base: 'TWD' as const,
    cashBuying: parsed.cashBuying === null ? null : toFixed4(parsed.cashBuying),
    cashSelling: parsed.cashSelling === null ? null : toFixed4(parsed.cashSelling),
    spotBuying: toFixed4(parsed.spotBuying),
    spotSelling: toFixed4(parsed.spotSelling),
    midRate,
    updatedAt: toTaipeiIso(parsed.dateText),
  }

  await mkdir(dirname(OUTPUT_FILE), { recursive: true })
  await writeFile(OUTPUT_FILE, `${JSON.stringify(ratePayload, null, 2)}\n`, 'utf-8')

  console.log(`已更新 ${OUTPUT_FILE}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`更新匯率失敗：${message}`)
  process.exit(1)
})
