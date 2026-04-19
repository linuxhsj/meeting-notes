import { chromium } from 'playwright'

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

// 截图录制页空闲状态
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'images/record-page-idle.png' })
console.log('Saved: images/record-page-idle.png')

// 截图历史页
await page.goto('http://localhost:5173/history', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'images/history-page.png' })
console.log('Saved: images/history-page.png')

await browser.close()
console.log('Done!')
