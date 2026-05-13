export interface ExchangeRate {
  source: string
  sourceUrl: string
  currency: 'CNY'
  base: 'TWD'
  cashBuying: number | null
  cashSelling: number | null
  spotBuying: number
  spotSelling: number
  midRate: number
  updatedAt: string
}
