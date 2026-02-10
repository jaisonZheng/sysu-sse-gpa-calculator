const { chromium } = require('playwright');

async function testLoginButton() {
  console.log('=== 测试登录按钮定位 ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    proxy: {
      server: 'http://127.0.0.1:7890'
    }
  });

  const page = await context.newPage();

  try {
    await page.goto('https://cas.sysu.edu.cn/esc-sso/login/page', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // 尝试各种登录按钮选择器
    console.log('尝试不同选择器定位登录按钮:\n');

    const selectors = [
      'button:has-text("登录")',
      'button:has-text("登")',
      'button:has-text("录")',
      'button[type="submit"]',
      'button.btn-primary',
      'button.primary',
      '.para-widget-actions button',
      '.login-btn',
      '.ant-btn-primary',
      'button[class*="login"]',
      'button[class*="primary"]'
    ];

    for (const selector of selectors) {
      const btn = await page.$(selector);
      if (btn) {
        const text = await btn.textContent();
        const className = await btn.getAttribute('class');
        console.log(`找到按钮!`);
        console.log(`  选择器: ${selector}`);
        console.log(`  文本: ${text}`);
        console.log(`  class: ${className}`);
        console.log();
      } else {
        console.log(`未找到: ${selector}`);
      }
    }

    // 获取所有按钮的完整信息
    console.log('\n=== 所有按钮详情 ===');
    const buttons = await page.$$('button');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const text = await btn.textContent();
      const className = await btn.getAttribute('class');
      const type = await btn.getAttribute('type');
      console.log(`\n按钮[${i}]:`);
      console.log(`  text: "${text}"`);
      console.log(`  class: ${className}`);
      console.log(`  type: ${type}`);

      // 尝试获取父元素信息
      const parentClass = await btn.evaluate(el => el.parentElement?.className);
      console.log(`  parent class: ${parentClass}`);
    }

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
}

testLoginButton();
