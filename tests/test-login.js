const { chromium } = require('playwright');

async function testLogin() {
  console.log('=== 测试教务系统登录流程 ===\n');

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

  // 监听所有请求和响应
  page.on('request', request => {
    console.log('>> Request:', request.method(), request.url());
  });

  page.on('response', response => {
    console.log('<< Response:', response.status(), response.url());
  });

  try {
    // 步骤1: 访问登录页面
    console.log('步骤1: 访问登录页面...');
    await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('  当前URL:', page.url());
    console.log('  页面标题:', await page.title());

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 截图保存
    await page.screenshot({ path: '/tmp/01-login-page.png' });
    console.log('  截图已保存: /tmp/01-login-page.png\n');

    // 步骤2: 查找并点击"统一身份认证登录"按钮
    console.log('步骤2: 查找登录按钮...');

    // 尝试多种选择器
    const selectors = [
      'text=统一身份认证登录',
      'text=统一身份认证',
      '.login-btn',
      '.sso-login',
      '[data-testid="sso-login"]',
      'button:has-text("登录")',
      'a:has-text("统一")',
      '.ant-btn'
    ];

    let loginButton = null;
    let foundSelector = '';
    for (const selector of selectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          const text = await btn.textContent();
          console.log('  找到按钮 [' + selector + ']: ' + (text || '').substring(0, 50));
          loginButton = btn;
          foundSelector = selector;
          break;
        }
      } catch (e) {}
    }

    if (!loginButton) {
      // 输出页面HTML以便调试
      const html = await page.content();
      console.log('  未找到登录按钮，页面HTML片段:');
      console.log(html.substring(0, 2000));
    } else {
      console.log('  使用选择器 [' + foundSelector + '] 点击按钮');
      await loginButton.click();

      // 等待跳转
      console.log('\n步骤3: 等待跳转到CAS页面...');
      await page.waitForTimeout(3000);
      console.log('  当前URL:', page.url());

      await page.screenshot({ path: '/tmp/02-cas-page.png' });
      console.log('  截图已保存: /tmp/02-cas-page.png\n');

      // 检查是否有切换账号按钮
      console.log('步骤4: 检查切换账号按钮...');
      const switchBtn = await page.$('text=切换账号');
      if (switchBtn) {
        console.log('  找到切换账号按钮，点击...');
        await switchBtn.click();
        await page.waitForTimeout(1000);
      } else {
        console.log('  未找到切换账号按钮');
      }

      // 输出CAS页面的表单信息
      const usernameInput = await page.$('input[name="username"], input[id="username"]');
      const passwordInput = await page.$('input[name="password"], input[id="password"]');
      const submitBtn = await page.$('button[type="submit"], input[type="submit"]');

      console.log('\n步骤5: 检查登录表单元素:');
      console.log('  用户名输入框:', usernameInput ? '找到' : '未找到');
      console.log('  密码输入框:', passwordInput ? '找到' : '未找到');
      console.log('  提交按钮:', submitBtn ? '找到' : '未找到');
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
    console.log('错误截图已保存: /tmp/error-screenshot.png');
  } finally {
    await browser.close();
  }
}

testLogin();
