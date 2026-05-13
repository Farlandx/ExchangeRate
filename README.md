# TWD / CNY Spot Rate

顯示新台幣（TWD）與人民幣（CNY）即期匯率的靜態網站 Side Project，預計部署在 GitHub Pages，並透過 GitHub Actions 定時更新 `public/rate.json`。

## Demo URL

`https://<your-github-username>.github.io/twd-cny-spot-rate/`

## 技術棧

- Vite
- React
- TypeScript
- GitHub Pages
- GitHub Actions
- Node.js script（抓取與產生匯率 JSON）

## 資料來源

- 臺灣銀行牌告匯率（人民幣）：  
  `https://rate.bot.com.tw/xrt/quote/day/CNY`

## 本地開發

```bash
npm install
npm run dev
```

## 手動更新匯率

```bash
npm run fetch:rate
```

執行後應更新 `public/rate.json`。

## GitHub Pages 部署

1. 在 repository 啟用 GitHub Pages（Source: GitHub Actions）。
2. 確保 `.github/workflows/deploy.yml` 存在並可在 `main` push 時觸發。
3. 首次 push 後，等待 workflow 完成部署。

## 免責聲明

本專案僅供個人 Side Project 與匯率資訊展示用途，不構成任何金融、投資、換匯或交易建議。實際匯率與交易條件請以銀行或交易機構公告為準。
