// 完整流程测试 - 使用原生http
const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3002;
const netid = 'zhengzsh5';
const password = 'Jason2024&Zzs';

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testCompleteFlow() {
  console.log('=== 测试完整自动模式流程 ===\n');

  let sessionId = null;

  try {
    // 步骤1: 登录
    console.log('步骤1: 登录...');
    const loginRes = await makeRequest('/api/auto/login', { netid, password });

    console.log('登录响应:', JSON.stringify(loginRes, null, 2));

    if (!loginRes.success) {
      console.error('登录失败:', loginRes.message);
      return;
    }

    sessionId = loginRes.sessionId;
    console.log('  ✓ 登录成功，sessionId:', sessionId);

    // 步骤2: 获取成绩
    console.log('\n步骤2: 获取成绩...');
    console.log('  请求中，请等待...');

    const gradesRes = await makeRequest('/api/auto/fetch-grades', { sessionId });

    console.log('获取成绩响应:', JSON.stringify(gradesRes, null, 2));

    if (gradesRes.success) {
      console.log('\n  ✓ 成功获取成绩');
      console.log(`  - 课程数量: ${gradesRes.courses?.length || 0}`);
      console.log(`  - 最终GPA: ${gradesRes.gpaResult?.finalGpa}`);

      // 显示前5门课程
      if (gradesRes.courses?.length > 0) {
        console.log('\n  前5门课程:');
        gradesRes.courses.slice(0, 5).forEach((course, i) => {
          console.log(`    ${i + 1}. ${course.courseName} (${course.category}) - 成绩:${course.score} 绩点:${course.gpa}`);
        });
      }
    } else {
      console.error('  ✗ 获取成绩失败:', gradesRes.message);
    }

    // 步骤3: 登出
    console.log('\n步骤3: 登出...');
    const logoutRes = await makeRequest('/api/auto/logout', { sessionId });
    console.log('登出响应:', JSON.stringify(logoutRes, null, 2));

  } catch (error) {
    console.error('错误:', error.message);
  }
}

testCompleteFlow();
