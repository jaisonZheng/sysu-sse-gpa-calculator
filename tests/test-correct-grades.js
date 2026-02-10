const { chromium } = require('playwright');

const netid = 'zhengzsh5';
const password = 'Jason2024&Zzs';

async function testCorrectGrades() {
  console.log('=== 测试正确的成绩页面 ===\n');

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
    // 登录
    console.log('步骤1: 登录...');
    await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    const loginButton = await page.$('button:has-text("登录")');
    await Promise.all([
      page.waitForURL('https://cas.sysu.edu.cn/**', { timeout: 30000 }),
      loginButton.click()
    ]);

    await page.fill('input[placeholder="请输入 NetID"]', netid);
    await page.fill('input[placeholder="请输入密码"]', password);

    const casLoginBtn = await page.$('button[class*="login"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
      casLoginBtn.click()
    ]);

    await page.waitForTimeout(3000);
    console.log('  ✓ 登录成功');

    // 访问正确的成绩页面URL
    console.log('\n步骤2: 访问成绩页面...');
    const gradesUrl = 'https://jwxt.sysu.edu.cn/jwxt/mk/studentWeb/#/stuAchievementView?code=jwxsd_wdcj&resourceName=%E6%88%91%E7%9A%84%E6%88%90%E7%BB%A9';
    await page.goto(gradesUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);

    console.log('  当前URL:', page.url());
    await page.screenshot({ path: '/tmp/grades-correct.png', fullPage: true });
    console.log('  ✓ 截图已保存');

    // 分析页面结构
    console.log('\n=== 成绩页面分析 ===');

    // 查找所有select元素
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

    // 查找ant-table
    const antTables = await page.$$('.ant-table');
    console.log(`找到 ${antTables.length} 个.ant-table元素`);

    if (antTables.length > 0) {
      // 获取第一个ant-table的表头
      const headers = await antTables[0].$$eval('.ant-table-thead th', ths =>
        ths.map(th => th.textContent.trim())
      );
      console.log('\nAnt-Table 表头:', headers);

      // 获取数据行
      const rows = await antTables[0].$$eval('.ant-table-tbody tr', rows =>
        rows.map(row => {
          const cells = row.querySelectorAll('td');
          return Array.from(cells).map(td => td.textContent.trim());
        })
      );
      console.log(`\n数据行数: ${rows.length}`);

      if (rows.length > 0) {
        console.log('\n前3行数据:');
        rows.slice(0, 3).forEach((row, i) => {
          console.log(`  行${i + 1}:`, row);
        });
      }
    }

    // 尝试选择主修
    console.log('\n=== 测试选择主修 ===');
    if (selects.length > 0) {
      // 查找包含"主修"的选项
      for (let i = 0; i < selects.length; i++) {
        const options = await selects[i].$$eval('option', opts =>
          opts.map(o => ({ value: o.value, text: o.textContent.trim() }))
        );

        const majorOption = options.find(o => o.text.includes('主修'));
        if (majorOption) {
          console.log(`在Select[${i}]找到主修选项: ${majorOption.text}`);
          await selects[i].selectOption(majorOption.value);
          console.log('  已选择主修');
          await page.waitForTimeout(3000);
          await page.screenshot({ path: '/tmp/grades-major.png', fullPage: true });

          // 重新获取表格数据
          const antTablesAfter = await page.$$('.ant-table');
          if (antTablesAfter.length > 0) {
            const rows = await antTablesAfter[0].$$eval('.ant-table-tbody tr', rows =>
              rows.map(row => {
                const cells = row.querySelectorAll('td');
                return Array.from(cells).map(td => td.textContent.trim());
              })
            );
            console.log(`  选择主修后数据行数: ${rows.length}`);
          }
          break;
        }
      }
    }

    // 查找学年选择器
    console.log('\n=== 查找学年选择器 ===');
    for (let i = 0; i < selects.length; i++) {
      const options = await selects[i].$$eval('option', opts =>
        opts.map(o => ({ value: o.value, text: o.textContent.trim() }))
      );

      const yearOptions = options.filter(o => o.text.includes('学年') || o.text.match(/20\d{2}/));
      if (yearOptions.length > 0) {
        console.log(`\nSelect[${i}] 学年选项:`);
        yearOptions.forEach(opt => console.log(`  ${opt.value}: ${opt.text}`));

        // 尝试切换学年
        if (yearOptions.length > 1) {
          console.log(`\n  切换到: ${yearOptions[1].text}`);
          await selects[i].selectOption(yearOptions[1].value);
          await page.waitForTimeout(3000);
          await page.screenshot({ path: '/tmp/grades-year2.png', fullPage: true });

          // 获取数据
          const antTablesAfter = await page.$$('.ant-table');
          if (antTablesAfter.length > 0) {
            const rows = await antTablesAfter[0].$$eval('.ant-table-tbody tr', rows =>
              rows.map(row => {
                const cells = row.querySelectorAll('td');
                return Array.from(cells).map(td => td.textContent.trim());
              })
            );
            console.log(`  切换学年后数据行数: ${rows.length}`);
            if (rows.length > 0) {
              console.log('  第一行:', rows[0]);
            }
          }
        }
      }
    }

    console.log('\n=== 测试完成 ===');
    return { success: true };

  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png' });
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

testCorrectGrades().then(result => {
  console.log('\n结果:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});
