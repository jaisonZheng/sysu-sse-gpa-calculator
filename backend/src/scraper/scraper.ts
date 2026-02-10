import { chromium, Browser, Page } from 'playwright';
import type { ScraperSession, UserGrade, CourseCategory, AcademicYear } from '../types';
import { v4 as uuidv4 } from 'uuid';

// In-memory session storage
const sessions = new Map<string, ScraperSession>();

// Cleanup old sessions periodically
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of sessions.entries()) {
    // Clean up sessions older than 30 minutes
    if (now.getTime() - session.lastUsed.getTime() > 30 * 60 * 1000) {
      session.browser?.close().catch(console.error);
      sessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Grade row structure from the ant-table
interface GradeRowData {
  index: string;
  category: string;
  courseName: string;
  teacher: string;
  academicYear: string;
  semester: string;
  credits: string;
  rawScore: string;
  finalScore: string;
  specialReason: string;
  gpa: string;
  examType: string;
  passed: string;
  classRank: string;
}

export class ScraperService {
  async login(netid: string, password: string): Promise<{ success: boolean; sessionId?: string; message?: string }> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
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

      // Navigate to login page
      await page.goto('https://jwxt.sysu.edu.cn/jwxt/#/login', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for the page to load
      await page.waitForTimeout(2000);

      // Click on "登录" button and wait for navigation to CAS
      const loginButton = await page.$('button:has-text("登录")');
      if (!loginButton) {
        throw new Error('未找到登录按钮');
      }

      // Click and wait for navigation simultaneously
      await Promise.all([
        page.waitForURL('https://cas.sysu.edu.cn/**', { timeout: 30000 }),
        loginButton.click()
      ]);

      // Wait for CAS page to fully load
      await page.waitForTimeout(2000);

      // Check for "切换账号" (Switch Account) button
      const switchAccountButton = await page.$('text=切换账号');
      if (switchAccountButton) {
        await switchAccountButton.click();
        await page.waitForTimeout(1000);
      }

      // Fill in netid and password
      await page.fill('input[placeholder="请输入 NetID"]', netid);
      await page.fill('input[placeholder="请输入密码"]', password);

      // Click login button and wait for navigation
      const casLoginBtn = await page.$('button[class*="login"]');
      if (!casLoginBtn) {
        throw new Error('未找到CAS登录按钮');
      }

      // Click and wait for navigation to complete
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
        casLoginBtn.click()
      ]);

      // Wait a bit more for the page to fully load
      await page.waitForTimeout(2000);

      // Check if login was successful
      const currentUrl = page.url();

      if (currentUrl.includes('jwxt.sysu.edu.cn') && !currentUrl.includes('login')) {
        // Login successful
        const sessionId = uuidv4();
        const session: ScraperSession = {
          sessionId,
          netid,
          browser,
          page,
          createdAt: new Date(),
          lastUsed: new Date()
        };
        sessions.set(sessionId, session);

        return { success: true, sessionId };
      } else if (currentUrl.includes('cas.sysu.edu.cn')) {
        // Still on CAS page, check for error message
        const errorMessage = await page.$eval('.error, .alert, .message', el => el.textContent).catch(() => null);
        await browser.close();
        return { success: false, message: errorMessage || '登录失败，请检查学号和密码' };
      } else {
        await browser.close();
        return { success: false, message: '登录失败，请稍后重试' };
      }
    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      console.error('Login error:', error);
      return { success: false, message: '登录过程中发生错误：' + (error as Error).message };
    }
  }

  async fetchGrades(sessionId: string): Promise<UserGrade[]> {
    const session = sessions.get(sessionId);
    if (!session || !session.page) {
      throw new Error('Session not found');
    }

    const { page } = session;
    session.lastUsed = new Date();

    try {
      // Navigate to the correct grades page URL
      const gradesUrl = 'https://jwxt.sysu.edu.cn/jwxt/mk/studentWeb/#/stuAchievementView?code=jwxsd_wdcj&resourceName=%E6%88%91%E7%9A%84%E6%88%90%E7%BB%A9';
      await page.goto(gradesUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for the page to load
      await page.waitForTimeout(5000);

      // Wait for ant-table to be present
      await page.waitForSelector('.ant-table', { timeout: 10000 });

      // First, try to determine enrollment year from student ID
      let enrollmentYear = 0;
      const pageContent = await page.content();
      const studentIdMatches = pageContent.match(/(\d{2})\d{6}/g);
      if (studentIdMatches && studentIdMatches.length > 0) {
        const yearCounts = new Map<string, number>();
        for (const match of studentIdMatches) {
          const year = match.substring(0, 2);
          yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
        }
        let maxCount = 0;
        let mostLikelyYear = '';
        for (const [year, count] of yearCounts.entries()) {
          if (count > maxCount) {
            maxCount = count;
            mostLikelyYear = year;
          }
        }
        if (mostLikelyYear) {
          enrollmentYear = 2000 + parseInt(mostLikelyYear);
          console.log(`Detected enrollment year from student ID: ${enrollmentYear}`);
        }
      }

      // Get all available academic year options from the dropdown
      // The year selector is the second ant-select (index 1 in the list)
      const yearOptions: string[] = [];

      // Define type for the filter function
      type FilterFn = (text: string | undefined) => text is string;

      // Click on the year dropdown to open it
      // Look for the ant-select that shows a year like "2025-2026"
      const yearSelect = await page.$('.ant-select-selection-selected-value[title*="20"]');
      if (yearSelect) {
        await yearSelect.click();
        await page.waitForTimeout(1000);

        // Get all options from the dropdown
        const options: string[] = await page.$$eval('.ant-select-dropdown-menu-item', (items: Element[]) => {
          return items
            .map((item: Element) => item.textContent?.trim())
            .filter((text): text is string => !!text && text.includes('20'));
        });

        // Remove duplicates and sort
        const uniqueOptions: string[] = [...new Set(options)];
        console.log('Available year options:', uniqueOptions);

        // Close the dropdown by pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        yearOptions.push(...uniqueOptions);
      }

      // If no options found, try to get current year from the page
      if (yearOptions.length === 0) {
        const currentYearText = await page.$eval('.ant-select-selection-selected-value[title*="20"]', (el: Element) => el.getAttribute('title'));
        if (currentYearText) {
          yearOptions.push(currentYearText.trim());
        }
      }

      console.log(`Will fetch grades for ${yearOptions.length} academic years:`, yearOptions);

      // Collect grades from all years
      const allGrades: UserGrade[] = [];

      for (const yearOption of yearOptions) {
        console.log(`\nFetching grades for: ${yearOption}`);

        // Click on the year dropdown
        const yearSelect = await page.$('.ant-select-selection-selected-value[title*="20"]');
        if (yearSelect) {
          await yearSelect.click();
          await page.waitForTimeout(1000);

          // Click on the specific year option
          const option = await page.$(`.ant-select-dropdown-menu-item:has-text("${yearOption}")`);
          if (option) {
            await option.click();
            await page.waitForTimeout(1000);
          } else {
            console.log(`Option ${yearOption} not found, skipping`);
            await page.keyboard.press('Escape');
            continue;
          }
        }

        // Click the "查询" (Query) button to refresh the table
        // Note: The button text has a space: "查 询"
        const queryButton = await page.$('button.ant-btn-primary');
        if (queryButton) {
          const btnText = await queryButton.textContent();
          if (btnText && btnText.includes('查')) {
            console.log('Clicking query button...');
            await queryButton.click();
            // Wait for API call to complete and table to reload
            await page.waitForTimeout(4000);
          } else {
            console.log('Query button text mismatch:', btnText);
            await page.waitForTimeout(3000);
          }
        } else {
          console.log('Query button not found, waiting...');
          await page.waitForTimeout(3000);
        }

        // Wait for table to load
        await page.waitForSelector('.ant-table-tbody tr', { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Extract grades from the table
        const gradeRows = await page.$$eval('.ant-table-tbody tr', (rows: Element[]) => {
          return rows.map((row) => {
            const cells = row.querySelectorAll('td');
            return {
              index: cells[0]?.textContent?.trim() || '',
              category: cells[1]?.textContent?.trim() || '',
              courseName: cells[2]?.textContent?.trim() || '',
              teacher: cells[3]?.textContent?.trim() || '',
              academicYear: cells[4]?.textContent?.trim() || '',
              semester: cells[5]?.textContent?.trim() || '',
              credits: cells[6]?.textContent?.trim() || '',
              rawScore: cells[7]?.textContent?.trim() || '',
              finalScore: cells[8]?.textContent?.trim() || '',
              specialReason: cells[9]?.textContent?.trim() || '',
              gpa: cells[10]?.textContent?.trim() || '',
              examType: cells[11]?.textContent?.trim() || '',
              passed: cells[12]?.textContent?.trim() || '',
              classRank: cells[13]?.textContent?.trim() || ''
            };
          });
        });

        console.log(`Found ${gradeRows.length} rows for ${yearOption}`);

        // Parse year from the option (e.g., "2025-2026" -> 2025)
        const yearMatch = yearOption.match(/(\d{4})-\d{4}/);
        const tableYearStart = yearMatch ? parseInt(yearMatch[1]) : 2024;

        // Determine academic year number (1, 2, or 3) based on enrollment year
        let academicYearNumber: 1 | 2 | 3 = 1;
        if (enrollmentYear > 0) {
          const yearDiff = tableYearStart - enrollmentYear + 1;
          if (yearDiff >= 1 && yearDiff <= 3) {
            academicYearNumber = yearDiff as 1 | 2 | 3;
          } else if (yearDiff > 3) {
            academicYearNumber = 3;
          }
        } else {
          // Fallback: use the order of years
          const yearIndex = yearOptions.indexOf(yearOption);
          academicYearNumber = Math.min(yearIndex + 1, 3) as 1 | 2 | 3;
        }

        // Process each row
        for (const row of gradeRows) {
          if (!row.courseName || row.courseName === '课程') continue;

          const credits = parseFloat(row.credits) || 0;
          const score = parseFloat(row.finalScore) || 0;
          const gpa = parseFloat(row.gpa) || this.scoreToGpa(score);

          // Map category
          let category: CourseCategory = 'general_elective';
          if (row.category.includes('公必')) {
            category = 'public_required';
          } else if (row.category.includes('专必')) {
            category = 'major_required';
          } else if (row.category.includes('专选')) {
            category = 'major_elective';
          }

          // Parse semester
          let semester: 1 | 2 = 1;
          if (row.semester.includes('第二') || row.semester.includes('2')) {
            semester = 2;
          }

          allGrades.push({
            sessionId,
            courseCode: '',
            courseName: row.courseName,
            credits,
            score,
            gpa,
            category,
            academicYear: academicYearNumber,
            semester
          });
        }
      }

      console.log(`\nTotal grades collected: ${allGrades.length}`);
      return allGrades;
    } catch (error) {
      console.error('Fetch grades error:', error);
      throw error;
    }
  }

  async logout(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      if (session.browser) {
        await session.browser.close().catch(console.error);
      }
      sessions.delete(sessionId);
    }
  }

  getSession(sessionId: string): ScraperSession | undefined {
    const session = sessions.get(sessionId);
    if (session) {
      session.lastUsed = new Date();
    }
    return session;
  }

  private scoreToGpa(score: number): number {
    if (score >= 90) return 5.0;
    if (score >= 85) return 4.7;
    if (score >= 80) return 4.2;
    if (score >= 75) return 3.7;
    if (score >= 70) return 3.2;
    if (score >= 65) return 2.7;
    if (score >= 60) return 2.2;
    return 0;
  }
}
