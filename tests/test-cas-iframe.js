const { chromium } = require('playwright');

async function analyzeIframe() {
  console.log('=== 分析CAS页面iframe ===\n');

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

    // 查找iframe
    const iframes = await page.$$('iframe');
    console.log('找到', iframes.length, '个iframe\n');

    for (let i = 0; i < iframes.length; i++) {
      const frame = iframes[i];
      const src = await frame.getAttribute('src');
      console.log(`iframe[${i}] src:`, src);

      // 获取frame对象
      const frameObj = await frame.contentFrame();
      if (frameObj) {
        const frameUrl = frameObj.url();
        console.log(`iframe[${i}] URL:`, frameUrl);

        // 查找iframe内的输入框
        const inputs = await frameObj.$$('input');
        console.log(`iframe[${i}] 内有 ${inputs.length} 个input元素`);
      }
    }

    // 尝试直接使用placeholder定位输入框
    console.log('\n=== 测试输入框定位 ===');

    const usernameInput = await page.$('input[placeholder="请输入 NetID"]');
    console.log('用户名输入框:', usernameInput ? '找到' : '未找到');

    const passwordInput = await page.$('input[placeholder="请输入密码"]');
    console.log('密码输入框:', passwordInput ? '找到' : '未找到');

    const loginBtn = await page.$('button:has-text("登录")');
    console.log('登录按钮:', loginBtn ? '找到' : '未找到');

    // 尝试使用name=input定位
    const inputsByName = await page.$$('input[name="input"]');
    console.log('\n通过name="input"找到', inputsByName.length, '个输入框');

    // 测试输入
    if (usernameInput && passwordInput && loginBtn) {
      console.log('\n=== 测试输入操作 ===');

      await usernameInput.fill('test123');
      console.log('已输入用户名');

      await passwordInput.fill('testpass');
      console.log('已输入密码');

      await page.screenshot({ path: '/tmp/cas-filled.png' });
      console.log('截图已保存: /tmp/cas-filled.png');
    }

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
}

analyzeIframe();
