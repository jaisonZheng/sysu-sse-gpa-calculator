const { chromium } = require('playwright');

// 从命令行参数获取用户名和密码
const netid = process.argv[2];
const password = process.argv[3];

if (!netid || !password) {
  console.log('用法: node test-full-login.js <netid> <password>');
  console.log('例如: node test-full-login.js testuser testpass');
  process.exit(1);
}

async function testFullLogin() {
  console.log('=== 测试完整登录流程 ===\n');

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
    // 步骤1: 访问登录页面
    console.log('步骤1: 访问教务系统登录页面...');
    await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    console.log('  ✓ 已加载登录页面');

    // 步骤2: 点击NetID登录
    console.log('\n步骤2: 点击NetID登录按钮...');
    const loginButton = await page.$('button:has-text("登录")');
    if (!loginButton) {
      throw new Error('未找到登录按钮');
    }
    await loginButton.click();
    console.log('  ✓ 已点击登录按钮');

    // 步骤3: 等待跳转到CAS
    console.log('\n步骤3: 等待跳转到CAS页面...');
    await page.waitForURL('https://cas.sysu.edu.cn/**', { timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('  ✓ 已跳转到CAS页面');
    console.log('  当前URL:', page.url());

    // 步骤4: 检查切换账号按钮
    console.log('\n步骤4: 检查切换账号按钮...');
    const switchBtn = await page.$('text=切换账号');
    if (switchBtn) {
      await switchBtn.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ 已点击切换账号按钮');
    } else {
      console.log('  - 无需切换账号');
    }

    // 步骤5: 输入用户名和密码
    console.log('\n步骤5: 输入用户名和密码...');
    await page.fill('input[placeholder="请输入 NetID"]', netid);
    await page.fill('input[placeholder="请输入密码"]', password);
    console.log('  ✓ 已输入用户名和密码');

    await page.screenshot({ path: '/tmp/03-cas-filled.png' });
    console.log('  截图已保存: /tmp/03-cas-filled.png');

    // 步骤6: 点击登录按钮
    console.log('\n步骤6: 点击CAS登录按钮...');
    await page.click('button[class*="login"]');
    console.log('  ✓ 已点击登录按钮');

    // 步骤7: 等待跳转
    console.log('\n步骤7: 等待登录结果...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('  当前URL:', currentUrl);

    // 检查登录结果
    if (currentUrl.includes('jwxt.sysu.edu.cn') && !currentUrl.includes('login')) {
      console.log('  ✓✓✓ 登录成功！');

      await page.screenshot({ path: '/tmp/04-login-success.png' });
      console.log('  截图已保存: /tmp/04-login-success.png');

      // 尝试访问成绩页面
      console.log('\n步骤8: 访问成绩页面...');
      await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/student/grades', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(3000);

      await page.screenshot({ path: '/tmp/05-grades-page.png' });
      console.log('  截图已保存: /tmp/05-grades-page.png');

      // 分析成绩页面
      console.log('\n=== 成绩页面分析 ===');
      console.log('当前URL:', page.url());
      console.log('页面标题:', await page.title());

      // 查找下拉菜单
      const selects = await page.$$('select');
      console.log(`\n找到 ${selects.length} 个select元素`);

      // 查找培养类别选择器
      const categorySelect = await page.$('select');
      if (categorySelect) {
        const options = await categorySelect.$$eval('option', opts =>
          opts.map(o => ({ value: o.value, text: o.textContent }))
        );
        console.log('\n培养类别选项:');
        options.forEach(opt => console.log(`  ${opt.value}: ${opt.text}`));
      }

      // 查找学年选择器
      const yearSelects = await page.$$('select');
      if (yearSelects.length >= 2) {
        const yearOptions = await yearSelects[1].$$eval('option', opts =>
          opts.map(o => ({ value: o.value, text: o.textContent }))
        );
        console.log('\n学年选项:');
        yearOptions.forEach(opt => console.log(`  ${opt.value}: ${opt.text}`));
      }

      // 查找表格
      const tables = await page.$$('table');
      console.log(`\n找到 ${tables.length} 个table元素`);

      if (tables.length > 0) {
        const headers = await tables[0].$$eval('th', ths =>
          ths.map(th => th.textContent.trim())
        );
        console.log('表头:', headers);
      }

      return { success: true };
    } else if (currentUrl.includes('cas.sysu.edu.cn')) {
      console.log('  ✗ 登录失败，仍在CAS页面');

      // 尝试获取错误信息
      const errorMsg = await page.$eval('.error, .alert, .message', el => el.textContent).catch(() => null);
      if (errorMsg) {
        console.log('  错误信息:', errorMsg);
      }

      await page.screenshot({ path: '/tmp/04-login-failed.png' });
      console.log('  截图已保存: /tmp/04-login-failed.png');

      return { success: false, message: errorMsg || '登录失败' };
    } else {
      console.log('  ? 未知状态');
      await page.screenshot({ path: '/tmp/04-unknown.png' });
      return { success: false, message: '未知状态' };
    }

  } catch (error) {
    console.error('\n错误:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
    console.log('错误截图已保存: /tmp/error-screenshot.png');
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

testFullLogin().then(result => {
  console.log('\n=== 测试结果 ===');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});
