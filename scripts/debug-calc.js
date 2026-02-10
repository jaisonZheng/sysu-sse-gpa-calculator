const { getUserGradesBySession } = require('./dist/database');
const { calculateGpaFromGrades } = require('./dist/utils/gpa');

// 使用最新的session
const sessionId = '360dab0a-d84f-4f1e-ba81-bc78ec7c847e';

const dbGrades = getUserGradesBySession(sessionId);
console.log('DB Grades count:', dbGrades.length);

const userGrades = dbGrades.map(g => ({
  sessionId,
  courseCode: g.course_code,
  courseName: g.course_name,
  credits: g.credits,
  score: g.score,
  gpa: g.gpa,
  category: g.category,
  academicYear: g.academic_year,
  semester: g.semester
}));

console.log('First grade:', userGrades[0]);
console.log('Public required count:', userGrades.filter(g => g.category === 'public_required').length);
console.log('Major required count:', userGrades.filter(g => g.category === 'major_required').length);

const result = calculateGpaFromGrades(userGrades);
console.log('GPA Result:', result);
