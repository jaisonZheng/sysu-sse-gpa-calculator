const { chromium } = require('playwright');

async function analyzeCASPage() {
  console.log('=== 分析CAS登录页面结构 ===\n');

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
    // 直接访问CAS页面
    console.log('访问CAS登录页面...');
    await page.goto('https://cas.sysu.edu.cn/esc-sso/login/page', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log('当前URL:', page.url());
    console.log('页面标题:', await page.title());

    // 截图
    await page.screenshot({ path: '/tmp/cas-full.png' });
    console.log('截图已保存: /tmp/cas-full.png\n');

    // 获取页面HTML
    const html = await page.content();
    console.log('=== 页面HTML（前5000字符）===');
    console.log(html.substring(0, 5000));
    console.log('...\n');

    // 查找所有输入框
    console.log('=== 查找所有输入框 ===');
    const inputs = await page.$$('input');
    console.log('找到', inputs.length, '个input元素');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`  [${i}] type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
    }

    // 查找所有按钮
    console.log('\n=== 查找所有按钮 ===');
    const buttons = await page.$$('button');
    console.log('找到', buttons.length, '个button元素');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const text = await btn.textContent();
      const type = await btn.getAttribute('type');
      console.log(`  [${i}] type=${type}, text=${(text || '').trim()}`);
    }

    // 查找iframe
    console.log('\n=== 查找iframe ===');
    const iframes = await page.$$('iframe');
    console.log('找到', iframes.length, '个iframe元素');

    // 检查是否有shadow DOM
    console.log('\n=== 检查Shadow DOM ===');
    const hasShadow = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        if (el.shadowRoot) return true;
      }
      return false;
    });
    console.log('页面是否有Shadow DOM:', hasShadow);

    // 查找包含"账号"或"密码"文本的元素
    console.log('\n=== 查找包含"账号/密码/登录"文本的元素 ===');
    const elements = await page.$$('*:has-text("账号"), *:has-text("密码"), *:has-text("登录")');
    console.log('找到', elements.length, '个相关元素');

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
}

analyzeCASPage();
