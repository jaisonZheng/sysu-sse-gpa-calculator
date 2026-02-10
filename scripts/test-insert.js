const { insertUserGrade, getUserGradesBySession } = require('./dist/database');

const sessionId = 'test-' + Date.now();
console.log('Testing insert with sessionId:', sessionId);

try {
  const result = insertUserGrade({
    sessionId,
    courseCode: '',
    courseName: 'Test Course',
    credits: 3,
    score: 90,
    gpa: 4.0,
    category: 'public_required',
    academicYear: 1,
    semester: 1
  });
  console.log('Insert result:', result);

  const grades = getUserGradesBySession(sessionId);
  console.log('Retrieved grades:', grades);
} catch (e) {
  console.error('Error:', e);
}
