// Course category types
export type CourseCategory = 'public_required' | 'major_required' | 'major_elective' | 'general_elective';

// Academic year type (1 = freshman, 2 = sophomore, 3 = junior)
export type AcademicYear = 1 | 2 | 3;

// Semester type
export type Semester = 1 | 2;

// Course definition
export interface Course {
  id?: number;
  courseCode: string;
  courseName: string;
  credits: number;
  category: CourseCategory;
  gradeYear: number; // e.g., 2023, 2024, 2025
}

// User grade entry
export interface UserGrade {
  id?: number;
  sessionId?: string;
  courseCode: string;
  courseName: string;
  credits: number;
  score: number; // 0-100
  gpa: number; // 0-5.0
  category: CourseCategory;
  academicYear: AcademicYear;
  semester: Semester;
  createdAt?: string;
}

// GPA calculation result
export interface GpaResult {
  id?: number;
  sessionId?: string;
  netid?: string;
  year1PublicGpa: number;
  year1MajorGpa: number;
  year2MajorGpa: number;
  year3MajorGpa: number;
  finalGpa: number;
  createdAt?: string;
}

// Manual calculation request
export interface ManualCalculateRequest {
  courses: {
    courseCode: string;
    courseName: string;
    credits: number;
    score: number;
    category: CourseCategory;
    academicYear: AcademicYear;
    semester: Semester;
  }[];
}

// Manual calculation response
export interface ManualCalculateResponse {
  success: boolean;
  finalGpa: number;
  details: {
    year1PublicGpa: number;
    year1MajorGpa: number;
    year2MajorGpa: number;
    year3MajorGpa: number;
  };
  message?: string;
}

// Auto login request
export interface AutoLoginRequest {
  netid: string;
  password: string;
}

// Auto login response
export interface AutoLoginResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
}

// Fetch grades response
export interface FetchGradesResponse {
  success: boolean;
  courses?: UserGrade[];
  gpaResult?: GpaResult;
  message?: string;
}

// Score to GPA conversion (SYSU standard)
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
