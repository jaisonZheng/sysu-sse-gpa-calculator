const { getUserGradesBySession } = require('./dist/database');
const { calculateGpaFromGrades } = require('./dist/utils/gpa');

const sessionId = process.argv[2] || '3ab6fa5d-2cfb-4766-b98a-11d028e51e66';

const dbGrades = getUserGradesBySession(sessionId);
console.log('DB Grades count:', dbGrades.length);

if (dbGrades.length === 0) {
  console.log('No grades found!');
  process.exit(1);
}

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
console.log('Public required:', userGrades.filter(g => g.category === 'public_required').map(g => ({ name: g.courseName, credits: g.credits, gpa: g.gpa })));
console.log('Major required (year 2):', userGrades.filter(g => g.category === 'major_required' && g.academicYear === 2).map(g => ({ name: g.courseName, credits: g.credits, gpa: g.gpa })));

const result = calculateGpaFromGrades(userGrades);
console.log('GPA Result:', result);

// Manual calculation
const publicCourses = userGrades.filter(g => g.category === 'public_required');
const year1Major = userGrades.filter(g => g.academicYear === 1 && g.category === 'major_required');
const year2Major = userGrades.filter(g => g.academicYear === 2 && g.category === 'major_required');
const year3Major = userGrades.filter(g => g.academicYear === 3 && g.category === 'major_required');

console.log('\nManual check:');
console.log('Public courses count:', publicCourses.length);
console.log('Year 1 major count:', year1Major.length);
console.log('Year 2 major count:', year2Major.length);
console.log('Year 3 major count:', year3Major.length);

// Calculate weighted GPAs
function calcWeightedGpa(courses) {
  if (courses.length === 0) return 0;
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return 0;
  const weightedSum = courses.reduce((sum, c) => sum + c.credits * c.gpa, 0);
  return weightedSum / totalCredits;
}

const publicGpa = calcWeightedGpa(publicCourses);
const year1MajorGpa = calcWeightedGpa(year1Major);
const year2MajorGpa = calcWeightedGpa(year2Major);
const year3MajorGpa = calcWeightedGpa(year3Major);

const part1 = calcWeightedGpa([...publicCourses, ...year1Major]);
const part2 = calcWeightedGpa([...year2Major, ...year3Major]);
const finalGpa = part1 * 0.5 + part2 * 0.5;

console.log('\nCalculated values:');
console.log('Public GPA:', publicGpa.toFixed(2));
console.log('Year 1 Major GPA:', year1MajorGpa.toFixed(2));
console.log('Year 2 Major GPA:', year2MajorGpa.toFixed(2));
console.log('Year 3 Major GPA:', year3MajorGpa.toFixed(2));
console.log('Part 1 (Public + Year 1 Major):', part1.toFixed(2));
console.log('Part 2 (Year 2 + Year 3 Major):', part2.toFixed(2));
console.log('Final GPA:', finalGpa.toFixed(2));
