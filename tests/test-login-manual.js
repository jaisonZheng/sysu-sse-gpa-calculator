#!/usr/bin/env node
const { chromium } = require('playwright');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
}

async function testLogin() {
  console.log('=== 中山大学教务系统登录测试 ===\n');

  const netid = await ask('请输入NetID: ');
  const password = await ask('请输入密码: ');

  console.log('\n开始测试登录流程...\n');

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

    await Promise.all([
      page.waitForURL('https://cas.sysu.edu.cn/**', { timeout: 30000 }),
      loginButton.click()
    ]);
    console.log('  ✓ 已跳转到CAS页面');

    // 步骤3: 检查切换账号
    console.log('\n步骤3: 检查切换账号按钮...');
    const switchBtn = await page.$('text=切换账号');
    if (switchBtn) {
      await switchBtn.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ 已点击切换账号');
    } else {
      console.log('  - 无需切换账号');
    }

    // 步骤4: 输入凭证
    console.log('\n步骤4: 输入用户名和密码...');
    await page.fill('input[placeholder="请输入 NetID"]', netid);
    await page.fill('input[placeholder="请输入密码"]', password);
    console.log('  ✓ 已输入凭证');

    // 截图记录
    await page.screenshot({ path: '/tmp/cas-before-login.png' });

    // 步骤5: 点击登录
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

    // 检查结果
    const currentUrl = page.url();
    console.log('\n  当前URL:', currentUrl);

    if (currentUrl.includes('jwxt.sysu.edu.cn') && !currentUrl.includes('login')) {
      console.log('  ✓✓✓ 登录成功！');
      await page.screenshot({ path: '/tmp/login-success.png' });

      // 测试访问成绩页面
      console.log('\n步骤6: 访问成绩页面...');
      await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/student/grades', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(3000);

      await page.screenshot({ path: '/tmp/grades-page.png' });
      console.log('  ✓ 成绩页面截图已保存: /tmp/grades-page.png');

      // 分析页面结构
      console.log('\n=== 成绩页面分析 ===');
      const selects = await page.$$('select');
      console.log(`找到 ${selects.length} 个下拉菜单`);

      for (let i = 0; i < selects.length; i++) {
        const options = await selects[i].$$eval('option', opts =>
          opts.map(o => ({ value: o.value, text: o.textContent.trim() }))
        );
        console.log(`\n下拉菜单[${i}]:`);
        options.forEach(opt => console.log(`  ${opt.value}: ${opt.text}`));
      }

      const tables = await page.$$('table');
      console.log(`\n找到 ${tables.length} 个表格`);

      if (tables.length > 0) {
        const headers = await tables[0].$$eval('th', ths => ths.map(th => th.textContent.trim()));
        console.log('表头:', headers);

        const rows = await tables[0].$$('tbody tr');
        console.log(`数据行数: ${rows.length}`);

        if (rows.length > 0) {
          const firstRow = await rows[0].$$eval('td', tds => tds.map(td => td.textContent.trim()));
          console.log('第一行数据:', firstRow);
        }
      }

    } else if (currentUrl.includes('cas.sysu.edu.cn')) {
      console.log('  ✗ 登录失败');
      const errorMsg = await page.$eval('.error, .alert-error, .message', el => el.textContent).catch(() => null);
      if (errorMsg) {
        console.log('  错误信息:', errorMsg.trim());
      }
      await page.screenshot({ path: '/tmp/login-failed.png' });
    }

    console.log('\n=== 测试完成 ===');
    console.log('截图文件位置:');
    console.log('  - /tmp/cas-before-login.png');
    console.log('  - /tmp/login-success.png 或 /tmp/login-failed.png');
    console.log('  - /tmp/grades-page.png');

  } catch (error) {
    console.error('\n错误:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png' });
    console.log('错误截图已保存: /tmp/test-error.png');
  } finally {
    await browser.close();
    rl.close();
  }
}

testLogin();
