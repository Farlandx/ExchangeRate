import { useEffect, useMemo, useState } from 'react'
import type { ExchangeRate } from './types'

type ConvertDirection = 'CNY_TO_TWD' | 'TWD_TO_CNY'

interface ExchangeRatePayload {
  source: unknown
  sourceUrl: unknown
  currency: unknown
  base: unknown
  cashBuying: unknown
  cashSelling: unknown
  spotBuying: unknown
  spotSelling: unknown
  midRate: unknown
  updatedAt: unknown
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || typeof value === 'number'
}

function isExchangeRate(payload: unknown): payload is ExchangeRate {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }

  const data = payload as ExchangeRatePayload
  return (
    typeof data.source === 'string' &&
    typeof data.sourceUrl === 'string' &&
    data.currency === 'CNY' &&
    data.base === 'TWD' &&
    isNumberOrNull(data.cashBuying) &&
    isNumberOrNull(data.cashSelling) &&
    typeof data.spotBuying === 'number' &&
    typeof data.spotSelling === 'number' &&
    typeof data.midRate === 'number' &&
    typeof data.updatedAt === 'string'
  )
}

function formatUpdatedAt(updatedAt: string): string {
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) {
    return updatedAt
  }

  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatAmount(value: number): string {
  return value.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function App() {
  const [rate, setRate] = useState<ExchangeRate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [inputAmount, setInputAmount] = useState('1000')
  const [direction, setDirection] = useState<ConvertDirection>('CNY_TO_TWD')

  useEffect(() => {
    const controller = new AbortController()

    async function loadRate() {
      try {
        const response = await fetch('./rate.json', { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`讀取 rate.json 失敗（HTTP ${response.status}）`)
        }

        const payload: unknown = await response.json()
        if (!isExchangeRate(payload)) {
          throw new Error('匯率資料格式不正確或缺少必要欄位')
        }

        setRate(payload)
        setError(null)
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : '目前無法取得匯率資料，請稍後再試。'
        setError(message)
        setRate(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadRate()
    return () => controller.abort()
  }, [])

  const convertedAmount = useMemo(() => {
    if (!rate) {
      return null
    }

    const amount = Number(inputAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      return null
    }

    return direction === 'CNY_TO_TWD' ? amount * rate.midRate : amount / rate.midRate
  }, [direction, inputAmount, rate])

  return (
    <main className="page">
      <section className="rate-card">
        <h1>新台幣 TWD / 人民幣 CNY 即期匯率</h1>

        {loading && <p className="status">資料載入中...</p>}
        {!loading && error && <p className="status error">目前無法取得匯率資料，請稍後再試。</p>}

        {!loading && rate && !error && (
          <>
            <p className="mid-label">即期中間價</p>
            <p className="mid-rate">{rate.midRate.toFixed(4)}</p>

            <div className="spot-grid">
              <div>
                <p className="spot-title">即期買入</p>
                <p className="spot-value">{rate.spotBuying.toFixed(4)}</p>
              </div>
              <div>
                <p className="spot-title">即期賣出</p>
                <p className="spot-value">{rate.spotSelling.toFixed(4)}</p>
              </div>
            </div>

            <section className="converter">
              <h2>匯率換算器</h2>
              <div className="converter-controls">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inputAmount}
                  onChange={(event) => setInputAmount(event.target.value)}
                  aria-label="換算金額"
                />
                <select
                  value={direction}
                  onChange={(event) => setDirection(event.target.value as ConvertDirection)}
                  aria-label="換算方向"
                >
                  <option value="TWD_TO_CNY">TWD → CNY</option>
                  <option value="CNY_TO_TWD">CNY → TWD</option>
                </select>
              </div>

              <p className="converter-result">
                {convertedAmount === null
                  ? '請輸入有效金額'
                  : direction === 'CNY_TO_TWD'
                    ? `${formatAmount(Number(inputAmount))} CNY ≈ ${formatAmount(convertedAmount)} TWD`
                    : `${formatAmount(Number(inputAmount))} TWD ≈ ${formatAmount(convertedAmount)} CNY`}
              </p>
              <p className="converter-note">換算使用即期中間價（midRate）計算。</p>
            </section>

            <p className="meta">更新時間：{formatUpdatedAt(rate.updatedAt)}</p>
            <p className="meta">
              資料來源：
              <a href={rate.sourceUrl} target="_blank" rel="noreferrer">
                {rate.source}
              </a>
            </p>
          </>
        )}
      </section>
    </main>
  )
}

export default App
