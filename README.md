# TWD / CNY 即期匯率

這是一個部署在 GitHub Pages 的靜態網站，用來顯示新台幣（TWD）/ 人民幣（CNY）即期匯率，並透過 GitHub Actions 定時更新資料。

## Demo URL

`https://<your-github-username>.github.io/twd-cny-spot-rate/`

## 技術棧

- Vite
- React
- TypeScript
- GitHub Pages
- GitHub Actions
- Node.js + cheerio（抓取與產生匯率 JSON）

## 資料來源

臺灣銀行牌告匯率（CNY）：
`https://rate.bot.com.tw/xrt/quote/day/CNY`

## 本地開發

```bash
pnpm install
pnpm dev
```

## 手動更新匯率

```bash
pnpm run fetch:rate
```

執行後會更新 `public/rate.json`。

## 自動更新匯率

GitHub Actions 會在平日 09:07、09:37 到 17:07、17:37（Asia/Taipei，UTC+8）自動執行更新流程（workflow: `.github/workflows/update-rate.yml`）。

## GitHub Pages 部署說明

1. 在 GitHub repository 的 **Settings → Pages** 中，Source 選擇 **GitHub Actions**。
2. 推送 `master` 後會觸發 `.github/workflows/deploy.yml`。
3. 部署完成後可用 Pages 網址查看頁面。

## 免責聲明

本專案僅供個人 Side Project 與匯率資訊展示用途，不構成任何金融、投資、換匯或交易建議。實際匯率與交易條件請以銀行或交易機構公告為準。
