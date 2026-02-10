import type { UserGrade, GpaResult } from '../types';

// Score to GPA conversion (SYSU standard - 5 point scale for auto mode)
export function scoreToGpa(score: number): number {
  if (score >= 90) return 5.0;
  if (score >= 85) return 4.7;
  if (score >= 80) return 4.2;
  if (score >= 75) return 3.7;
  if (score >= 70) return 3.2;
  if (score >= 65) return 2.7;
  if (score >= 60) return 2.2;
  return 0;
}

// Score to GPA conversion for manual mode (4 point scale)
// Formula: GPA = (score / 10) - 5, rounded to 1 decimal
// Examples: 98 -> 4.8, 88 -> 3.8, 78 -> 2.8, 68 -> 1.8
export function scoreToGpaManual(score: number): number {
  if (score < 60) return 0;
  const gpa = Math.round(((score / 10) - 5) * 10) / 10;
  return Math.min(gpa, 5.0); // Cap at 5.0
}

// Check if a grade should be included in GPA calculation
// Excludes: deferred exams (缓考), Pass/Not Pass courses
export function shouldIncludeInCalculation(grade: UserGrade): boolean {
  // Exclude deferred exams
  if (grade.status === 'deferred') return false;
  // Exclude Pass/Not Pass courses
  if (grade.status === 'pass' || grade.status === 'not_pass') return false;
  // Include normal grades
  return true;
}

// Calculate weighted GPA
export function calculateWeightedGpa(courses: { credits: number; gpa: number }[]): number {
  if (courses.length === 0) return 0;
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return 0;
  const weightedSum = courses.reduce((sum, c) => sum + c.credits * c.gpa, 0);
  return Math.round((weightedSum / totalCredits) * 100) / 100;
}

// Calculate final recommendation GPA
export function calculateFinalGpa(
  year1PublicCourses: { credits: number; gpa: number }[],
  year1MajorCourses: { credits: number; gpa: number }[],
  year2MajorCourses: { credits: number; gpa: number }[],
  year3MajorCourses: { credits: number; gpa: number }[]
): GpaResult {
  const year1PublicGpa = calculateWeightedGpa(year1PublicCourses);
  const year1MajorGpa = calculateWeightedGpa(year1MajorCourses);
  const year2MajorGpa = calculateWeightedGpa(year2MajorCourses);
  const year3MajorGpa = calculateWeightedGpa(year3MajorCourses);

  // 综合成绩绩点 = 所有公共必修课和一年级专业必修课的平均绩点 × 0.5 + 二年级和三年级专业必修课的平均绩点 × 0.5
  const year1Combined = calculateWeightedGpa([...year1PublicCourses, ...year1MajorCourses]);
  const year23Combined = calculateWeightedGpa([...year2MajorCourses, ...year3MajorCourses]);

  const finalGpa = Math.round((year1Combined * 0.5 + year23Combined * 0.5) * 100) / 100;

  return {
    year1PublicGpa,
    year1MajorGpa,
    year2MajorGpa,
    year3MajorGpa,
    finalGpa
  };
}

// Calculate GPA from user grades
// Formula: (All public required + Year 1 major required average GPA) * 0.5 + (Year 2 + Year 3 major required average GPA) * 0.5
// Excludes: deferred exams, Pass/Not Pass courses
export function calculateGpaFromGrades(grades: UserGrade[]): GpaResult {
  // Filter out grades that shouldn't be included in calculation
  const validGrades = grades.filter(shouldIncludeInCalculation);

  // All public required courses across all years (Year 1, 2, 3)
  const allPublicCourses = validGrades
    .filter(g => g.category === 'public_required')
    .map(g => ({ credits: g.credits, gpa: g.gpa }));

  // Year 1 major required courses
  const year1MajorCourses = validGrades
    .filter(g => g.academicYear === 1 && g.category === 'major_required')
    .map(g => ({ credits: g.credits, gpa: g.gpa }));

  // Year 2 major required courses
  const year2MajorCourses = validGrades
    .filter(g => g.academicYear === 2 && g.category === 'major_required')
    .map(g => ({ credits: g.credits, gpa: g.gpa }));

  // Year 3 major required courses
  const year3MajorCourses = validGrades
    .filter(g => g.academicYear === 3 && g.category === 'major_required')
    .map(g => ({ credits: g.credits, gpa: g.gpa }));

  // For display purposes
  // Part 1: All public required courses (all years) + Year 1 major required
  // Part 2: Year 2 + Year 3 major required
  const part1Courses = [...allPublicCourses, ...year1MajorCourses];
  const part2Courses = [...year2MajorCourses, ...year3MajorCourses];

  const part1Gpa = calculateWeightedGpa(part1Courses);
  const part2Gpa = calculateWeightedGpa(part2Courses);

  const finalGpa = Math.round((part1Gpa * 0.5 + part2Gpa * 0.5) * 100) / 100;

  // For display: show the actual components used in calculation
  // year1PublicGpa now shows ALL public required (not just year 1)
  // This is because public required courses count toward part 1 regardless of year
  return {
    year1PublicGpa: calculateWeightedGpa(allPublicCourses), // All public required (all years)
    year1MajorGpa: calculateWeightedGpa(year1MajorCourses), // Year 1 major required only
    year2MajorGpa: calculateWeightedGpa(year2MajorCourses), // Year 2 major required only
    year3MajorGpa: calculateWeightedGpa(year3MajorCourses), // Year 3 major required only
    finalGpa
  };
}
