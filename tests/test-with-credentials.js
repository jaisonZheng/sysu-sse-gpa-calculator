const { chromium } = require('playwright');

const netid = 'zhengzsh5';
const password = 'Jason2024&Zzs';

async function testLogin() {
  console.log('=== 使用提供的账号测试登录 ===\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    proxy: { server: 'http://127.0.0.1:7890' }
  });

  const page = await context.newPage();

  try {
    console.log('步骤1: 访问教务系统登录页面...');
    await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    console.log('  ✓ 已加载登录页面');

    console.log('\n步骤2: 点击NetID登录按钮...');
    const loginButton = await page.$('button:has-text("登录")');
    if (!loginButton) {
      throw new Error('未找到登录按钮');
    }

    await Promise.all([
      page.waitForURL('https://cas.sysu.edu.cn/**', { timeout: 30000 }),
      loginButton.click()
    ]);
    console.log('  ✓ 已跳转到CAS页面');

    console.log('\n步骤3: 检查切换账号按钮...');
    const switchBtn = await page.$('text=切换账号');
    if (switchBtn) {
      await switchBtn.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ 已点击切换账号');
    } else {
      console.log('  - 无需切换账号');
    }

    console.log('\n步骤4: 输入用户名和密码...');
    await page.fill('input[placeholder="请输入 NetID"]', netid);
    await page.fill('input[placeholder="请输入密码"]', password);
    console.log('  ✓ 已输入凭证');

    await page.screenshot({ path: '/tmp/cas-filled.png' });

    console.log('\n步骤5: 点击CAS登录按钮...');
    const casLoginBtn = await page.$('button[class*="login"]');
    if (!casLoginBtn) {
      throw new Error('未找到CAS登录按钮');
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
      casLoginBtn.click()
    ]);

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('\n  当前URL:', currentUrl);

    if (currentUrl.includes('jwxt.sysu.edu.cn') && !currentUrl.includes('login')) {
      console.log('  ✓✓✓ 登录成功！');
      await page.screenshot({ path: '/tmp/login-success.png', fullPage: true });

      // 测试访问成绩页面
      console.log('\n步骤6: 访问成绩页面...');
      await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/student/grades', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(3000);

      await page.screenshot({ path: '/tmp/grades-page.png', fullPage: true });
      console.log('  ✓ 成绩页面截图已保存');

      // 详细分析页面结构
      console.log('\n=== 成绩页面详细分析 ===');

      // 获取所有select元素
      const selects = await page.$$('select');
      console.log(`\n找到 ${selects.length} 个select元素`);

      for (let i = 0; i < selects.length; i++) {
        const options = await selects[i].$$eval('option', opts =>
          opts.map(o => ({ value: o.value, text: o.textContent.trim() }))
        );
        console.log(`\nSelect[${i}]:`);
        options.forEach(opt => console.log(`  ${opt.value}: ${opt.text}`));
      }

      // 查找表格
      const tables = await page.$$('table');
      console.log(`\n找到 ${tables.length} 个table元素`);

      for (let i = 0; i < tables.length; i++) {
        const headers = await tables[i].$$eval('th', ths => ths.map(th => th.textContent.trim()));
        const rowCount = await tables[i].$$eval('tbody tr', rows => rows.length);
        console.log(`\nTable[${i}]:`);
        console.log('  表头:', headers);
        console.log('  数据行数:', rowCount);

        if (rowCount > 0) {
          const firstRow = await tables[i].$$eval('tbody tr:first-child td', tds =>
            tds.map(td => td.textContent.trim())
          );
          console.log('  第一行数据:', firstRow);
        }
      }

      // 尝试点击主修选项
      console.log('\n=== 测试选择主修 ===');
      if (selects.length > 0) {
        const options = await selects[0].$$eval('option', opts =>
          opts.map((o, i) => ({ index: i, value: o.value, text: o.textContent.trim() }))
        );

        const majorOption = options.find(o => o.text.includes('主修'));
        if (majorOption) {
          await selects[0].selectOption(majorOption.value);
          console.log(`选择了: ${majorOption.text}`);
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/tmp/grades-after-select.png', fullPage: true });
        }
      }

      console.log('\n测试完成，截图保存在 /tmp/');
      return { success: true };

    } else if (currentUrl.includes('cas.sysu.edu.cn')) {
      console.log('  ✗ 登录失败');
      const errorMsg = await page.$eval('.error, .alert-error, .message', el => el.textContent).catch(() => null);
      if (errorMsg) {
        console.log('  错误信息:', errorMsg.trim());
      }
      await page.screenshot({ path: '/tmp/login-failed.png' });
      return { success: false, message: errorMsg || '登录失败' };
    }

  } catch (error) {
    console.error('\n错误:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png' });
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

testLogin().then(result => {
  console.log('\n=== 测试结果 ===');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});
