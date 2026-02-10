/**
 * GPA Calculation Test Script
 * 验证手动模式和自动模式的GPA计算逻辑一致
 */

const { calculateGpaFromGrades, scoreToGpa, shouldIncludeInCalculation } = require('../backend/dist/utils/gpa');

// 测试数据：模拟一个学生的成绩
const testGrades = [
  // 大一上 - 公必
  { courseName: '高等数学I', credits: 4, score: 85, gpa: 4.7, category: 'public_required', academicYear: 1, semester: 1, status: 'normal' },
  { courseName: '大学英语I', credits: 2, score: 90, gpa: 5.0, category: 'public_required', academicYear: 1, semester: 1, status: 'normal' },
  { courseName: '体育I', credits: 1, score: 80, gpa: 4.2, category: 'public_required', academicYear: 1, semester: 1, status: 'normal' },
  // 大一下 - 公必
  { courseName: '高等数学II', credits: 4, score: 88, gpa: 4.7, category: 'public_required', academicYear: 1, semester: 2, status: 'normal' },
  { courseName: '大学英语II', credits: 2, score: 85, gpa: 4.7, category: 'public_required', academicYear: 1, semester: 2, status: 'normal' },
  // 大一上 - 专必
  { courseName: '程序设计基础', credits: 3, score: 92, gpa: 5.0, category: 'major_required', academicYear: 1, semester: 1, status: 'normal' },
  // 大一下 - 专必
  { courseName: '数据结构', credits: 3, score: 87, gpa: 4.7, category: 'major_required', academicYear: 1, semester: 2, status: 'normal' },
  // 大二上 - 专必
  { courseName: '算法设计与分析', credits: 3, score: 82, gpa: 4.2, category: 'major_required', academicYear: 2, semester: 1, status: 'normal' },
  { courseName: '计算机组成原理', credits: 3, score: 78, gpa: 3.7, category: 'major_required', academicYear: 2, semester: 1, status: 'normal' },
  // 大二下 - 专必
  { courseName: '操作系统', credits: 3, score: 85, gpa: 4.7, category: 'major_required', academicYear: 2, semester: 2, status: 'normal' },
  // 大三上 - 专必
  { courseName: '计算机网络', credits: 3, score: 88, gpa: 4.7, category: 'major_required', academicYear: 3, semester: 1, status: 'normal' },
  // 大三下 - 专必（缓考）- 不应纳入计算
  { courseName: '软件工程', credits: 3, score: 0, gpa: 0, category: 'major_required', academicYear: 3, semester: 2, status: 'deferred', displayScore: '缓考' },
  // P/NP课程 - 不应纳入计算
  { courseName: '大学生心理健康', credits: 1, score: 0, gpa: 0, category: 'public_required', academicYear: 1, semester: 1, status: 'pass', displayScore: 'P' },
];

console.log('=== GPA Calculation Test ===\n');

// 测试 scoreToGpa
console.log('1. Testing scoreToGpa function:');
const scoreTests = [95, 87, 82, 76, 71, 66, 61, 55];
scoreTests.forEach(score => {
  console.log(`   Score ${score} -> GPA ${scoreToGpa(score)}`);
});

// 测试 shouldIncludeInCalculation
console.log('\n2. Testing shouldIncludeInCalculation:');
testGrades.forEach(grade => {
  const include = shouldIncludeInCalculation(grade);
  const status = grade.status || 'normal';
  console.log(`   ${grade.courseName} (${status}): ${include ? 'INCLUDE' : 'EXCLUDE'}`);
});

// 测试 calculateGpaFromGrades
console.log('\n3. Testing calculateGpaFromGrades:');
const result = calculateGpaFromGrades(testGrades);

console.log('   Input courses:');
testGrades.forEach(g => {
  const include = shouldIncludeInCalculation(g);
  console.log(`     - ${g.courseName}: ${g.displayScore || g.score}分, ${g.credits}学分, ${g.category}, 大一${g.academicYear === 1 ? '一' : g.academicYear === 2 ? '二' : '三'} [${include ? '计入' : '不计入'}]`);
});

console.log('\n   Output result:');
console.log(`     - 所有公必绩点: ${result.year1PublicGpa.toFixed(2)}`);
console.log(`     - 大一专必绩点: ${result.year1MajorGpa.toFixed(2)}`);
console.log(`     - 大二专必绩点: ${result.year2MajorGpa.toFixed(2)}`);
console.log(`     - 大三专必绩点: ${result.year3MajorGpa.toFixed(2)}`);
console.log(`     - 最终保研绩点: ${result.finalGpa.toFixed(2)}`);

// 手动验证计算
console.log('\n4. Manual verification:');
const allPublicCourses = testGrades.filter(g => g.category === 'public_required' && g.status === 'normal');
const year1MajorCourses = testGrades.filter(g => g.academicYear === 1 && g.category === 'major_required' && g.status === 'normal');
const year2MajorCourses = testGrades.filter(g => g.academicYear === 2 && g.category === 'major_required' && g.status === 'normal');
const year3MajorCourses = testGrades.filter(g => g.academicYear === 3 && g.category === 'major_required' && g.status === 'normal');

console.log('   公必课程:');
allPublicCourses.forEach(c => console.log(`     - ${c.courseName}: ${c.score}分, 绩点${c.gpa}, ${c.credits}学分`));

console.log('   大一专必课程:');
year1MajorCourses.forEach(c => console.log(`     - ${c.courseName}: ${c.score}分, 绩点${c.gpa}, ${c.credits}学分`));

console.log('   大二专必课程:');
year2MajorCourses.forEach(c => console.log(`     - ${c.courseName}: ${c.score}分, 绩点${c.gpa}, ${c.credits}学分`));

console.log('   大三专必课程:');
year3MajorCourses.forEach(c => console.log(`     - ${c.courseName}: ${c.displayScore || c.score}, ${c.status === 'normal' ? `绩点${c.gpa}` : '不计入'}, ${c.credits}学分`));

// 验证公式
const calculateWeightedGpa = (courses) => {
  if (courses.length === 0) return 0;
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return 0;
  const weightedSum = courses.reduce((sum, c) => sum + c.credits * c.gpa, 0);
  return weightedSum / totalCredits;
};

const part1Gpa = calculateWeightedGpa([...allPublicCourses, ...year1MajorCourses]);
const part2Gpa = calculateWeightedGpa([...year2MajorCourses, ...year3MajorCourses]);
const expectedFinalGpa = (part1Gpa * 0.5 + part2Gpa * 0.5);

console.log('\n5. Formula verification:');
console.log(`   Part1 (所有公必 + 大一专必): ${part1Gpa.toFixed(4)}`);
console.log(`   Part2 (大二专必 + 大三专必): ${part2Gpa.toFixed(4)}`);
console.log(`   Expected Final: (Part1 * 0.5) + (Part2 * 0.5) = ${expectedFinalGpa.toFixed(4)}`);
console.log(`   Actual Final: ${result.finalGpa.toFixed(4)}`);
console.log(`   Match: ${Math.abs(expectedFinalGpa - result.finalGpa) < 0.001 ? '✓ YES' : '✗ NO'}`);

console.log('\n=== Test Complete ===');
