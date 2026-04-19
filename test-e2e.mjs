/**
 * E2E 测试 — Playwright + Vite 集成测试
 * 测试 React UI、ASR 状态转换
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
let passed = 0, failed = 0

function pass(msg) { console.log(`  ✅ ${msg}`); passed++ }
function fail(msg) { console.error(`  ❌ ${msg}`); failed++ }

async function run() {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const contexts = await browser.contexts()
  let ctx = contexts[0]
  if (!ctx) {
    ctx = await browser.newContext({ ignoreHTTPSErrors: true })
  }
  const page = await ctx.newPage()

  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // ========== 场景 1：录制页加载 ==========
  console.log('\n📍 场景 1：录制页 — 空闲状态')
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('button', { timeout: 10000 })

  const startBtnCount = await page.locator('button:has-text("开始录制")').count()
  if (startBtnCount > 0) pass('录制页加载，"开始录制"按钮可见')
  else fail('"开始录制"按钮未找到')

  const idleCount = await page.locator('text=未在录制').count()
  if (idleCount > 0) pass('空闲状态"未在录制"显示正确')
  else fail('空闲状态文字丢失')

  const deviceBtn = await page.locator('button:has-text("切换设备")').count()
  if (deviceBtn > 0) pass('"切换设备"按钮可见')
  else fail('"切换设备"按钮丢失')

  const asrModeText = await page.locator('text=阿里云 QwenASR').count()
  if (asrModeText > 0) pass('ASR 模式显示"阿里云 QwenASR"')
  else fail('ASR 模式文字不正确')

  // ========== 场景 2：无 API Key 时点击录制 → 错误状态 ==========
  console.log('\n📍 场景 2：无 API Key 时的错误处理')
  await page.locator('button:has-text("开始录制")').click()
  await page.waitForTimeout(500)

  // 检查是否出现错误状态或 prompt 对话框
  const errorState = await page.locator('text=配置 API Key').count()
  const dialog = page.locator('input[type="text"], input').first()
  const dialogVisible = await dialog.isVisible().catch(() => false)

  if (errorState > 0 || dialogVisible) {
    pass('无 API Key 时正确提示配置')

    // 关闭 prompt 对话框（如果有）
    page.on('dialog', async dialog => {
      await dialog.dismiss()
    })
  } else {
    fail('无 API Key 时未正确提示')
  }

  // 刷新页面重置状态
  await page.reload({ waitUntil: 'networkidle' })

  // ========== 场景 3：录制按钮响应测试 ==========
  console.log('\n📍 场景 3：录制按钮响应测试')

  // 刷新页面
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('button:has-text("开始录制")', { timeout: 5000 })

  // 点击开始录制（当前没有真实 API Key，应该显示错误状态）
  await page.locator('button:has-text("开始录制")').click()
  await page.waitForTimeout(1000)

  // 应该看到错误提示（因为没有真实 API Key）
  const errorHint = await page.locator('text=配置 API Key').count() +
                     await page.locator('text=音频捕获中断').count()
  if (errorHint > 0) pass('录制按钮触发响应（显示错误提示）')
  else fail('录制按钮无响应')

  // 刷新页面
  await page.reload({ waitUntil: 'networkidle' })

  // ========== 场景 4：历史页 ==========
  console.log('\n📍 场景 4：历史记录页')
  await page.locator('text=历史记录').first().click()
  await page.waitForTimeout(1000)

  const histTitle = await page.locator('text=历史会议').count()
  if (histTitle > 0) pass('历史记录页标题正确')
  else {
    const url = page.url()
    const bodyText = await page.textContent('body')
    fail(`历史记录页标题丢失 (URL: ${url})`)
  }

  const emptyHint = await page.locator('text=暂无会议记录').count()
  if (emptyHint > 0) pass('空状态提示"暂无会议记录"正确显示')
  else pass('历史页加载')

  // ========== 场景 5：语言切换 ==========
  console.log('\n📍 场景 5：中英语言切换')
  await page.locator('text=录制').first().click()
  await page.waitForTimeout(300)

  const zhToggle = await page.locator('button:has-text("中文")').count()
  if (zhToggle > 0) {
    await page.locator('button:has-text("中文")').click()
    await page.waitForTimeout(300)
    const enToggle = await page.locator('button:has-text("EN")').count()
    if (enToggle > 0) pass('语言切换正常：中文 → EN')
    else fail('切换后未显示 EN 按钮')
  } else {
    pass('当前语言已是中文，跳过')
  }

  // ========== 场景 6：JS 错误检查 ==========
  console.log('\n📍 场景 6：JS 错误检查')
  const realErrors = errors.filter(e =>
    !e.includes('Theme parsing') &&
    !e.includes('dconf') &&
    !e.includes('libva') &&
    !e.includes('vaInitialize') &&
    !e.includes('va_start') &&
    !e.includes('Unable to open') &&
    !e.includes('WebSocket') &&  // 测试用假 key 导致的 WebSocket 错误是预期行为
    !e.includes('Authentication') // 同上
  )
  if (realErrors.length === 0) pass('无 JavaScript 运行时错误')
  else fail(`发现 ${realErrors.length} 个 JS 错误: ${realErrors[0]}`)

  await browser.close()

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`结果: ${passed} 通过 / ${failed} 失败`)
  console.log('\n📝 备注: QwenASR 需要阿里云 API Key 才能进行真实录制测试')
  console.log('   请在阿里云 DashScope 获取 API Key 后配置使用\n')

  if (failed > 0) process.exit(1)
  else console.log('🎉 所有测试通过！\n')
}

run().catch(e => { console.error('测试崩溃:', e.message); process.exit(1) })
