const { chromium } = require('playwright');

const netid = 'zhengzsh5';
const password = 'Jason2024&Zzs';

async function testGrades() {
  console.log('=== 详细测试成绩页面 ===\n');

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

    // 在学生主页，查找"我的成绩"链接或按钮
    console.log('\n步骤2: 在学生主页查找成绩入口...');
    await page.screenshot({ path: '/tmp/student-home.png', fullPage: true });
    console.log('  主页截图已保存');

    // 查找包含"成绩"的链接或按钮
    const gradeLinks = await page.$$('a:has-text("成绩"), button:has-text("成绩"), .menu-item:has-text("成绩"), [title*="成绩"]');
    console.log(`  找到 ${gradeLinks.length} 个成绩相关元素`);

    // 尝试点击第一个成绩链接
    if (gradeLinks.length > 0) {
      console.log('  点击成绩链接...');
      await gradeLinks[0].click();
      await page.waitForTimeout(5000);
    } else {
      // 直接访问成绩页面URL
      console.log('  直接访问成绩页面URL...');
      await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/student/grades', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(5000);
    }

    console.log('  当前URL:', page.url());
    await page.screenshot({ path: '/tmp/grades-detailed.png', fullPage: true });
    console.log('  成绩页面截图已保存');

    // 详细分析页面
    console.log('\n=== 页面结构分析 ===');

    // 获取页面标题
    const title = await page.title();
    console.log('页面标题:', title);

    // 检查是否有iframe
    const frames = page.frames();
    console.log(`\n找到 ${frames.length} 个frame`);
    for (let i = 0; i < frames.length; i++) {
      const frameUrl = frames[i].url();
      console.log(`  Frame[${i}]: ${frameUrl}`);
    }

    // 获取所有可见文本
    console.log('\n=== 页面可见文本（前20个）===');
    const texts = await page.$$eval('*', elements =>
      elements
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 0 && text.length < 100)
        .slice(0, 20)
    );
    texts.forEach((t, i) => console.log(`  ${i}: ${t}`));

    // 查找所有按钮
    console.log('\n=== 所有按钮 ===');
    const buttons = await page.$$('button');
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`  [${i}] ${text?.trim()}`);
    }

    // 查找所有链接
    console.log('\n=== 所有链接（前10个）===');
    const links = await page.$$('a');
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const text = await links[i].textContent();
      const href = await links[i].getAttribute('href');
      console.log(`  [${i}] ${text?.trim()} -> ${href}`);
    }

    // 尝试查找任何包含数据的元素
    console.log('\n=== 尝试查找成绩数据 ===');

    // 方法1: 查找特定class
    const classPatterns = ['.ant-table', '.el-table', '.grade', '.score', '.course', '[class*="table"]', '[class*="grade"]', '[class*="score"]', '.vxe-table'];
    for (const pattern of classPatterns) {
      const elements = await page.$$(pattern);
      if (elements.length > 0) {
        console.log(`  找到 ${elements.length} 个 ${pattern} 元素`);
      }
    }

    // 方法2: 尝试获取页面HTML
    console.log('\n=== 页面HTML片段（前3000字符）===');
    const html = await page.content();
    console.log(html.substring(0, 3000));

    // 方法3: 检查是否有自定义组件
    console.log('\n=== 检查自定义标签 ===');
    const allTags = await page.evaluate(() => {
      const tags = new Set();
      document.querySelectorAll('*').forEach(el => tags.add(el.tagName.toLowerCase()));
      return Array.from(tags).filter(t => t.includes('-')).slice(0, 20);
    });
    console.log('自定义标签:', allTags);

    console.log('\n测试完成');

  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png' });
  } finally {
    await browser.close();
  }
}

testGrades();
