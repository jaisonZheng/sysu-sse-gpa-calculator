export type CourseCategory = 'public_required' | 'major_required' | 'major_elective' | 'general_elective';
export type AcademicYear = 1 | 2 | 3;
export type Semester = 1 | 2;

// Grade status: normal, deferred (缓考), pass (P), not_pass (NP)
export type GradeStatus = 'normal' | 'deferred' | 'pass' | 'not_pass';

export interface Course {
  id?: number;
  courseCode: string;
  courseName: string;
  credits: number;
  category: CourseCategory;
  gradeYear: number;
}

export interface UserGrade {
  id?: number;
  sessionId?: string;
  courseCode: string;
  courseName: string;
  credits: number;
  score: number;
  gpa: number;
  category: CourseCategory;
  academicYear: AcademicYear;
  semester: Semester;
  // Special status for deferred exam or P/NP courses
  status?: GradeStatus;
  // Display value for special grades (e.g., "缓考", "P", "NP")
  displayScore?: string;
  createdAt?: string;
}

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

export interface AutoLoginRequest {
  netid: string;
  password: string;
}

export interface AutoLoginResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
}

export interface FetchGradesResponse {
  success: boolean;
  courses?: UserGrade[];
  gpaResult?: GpaResult;
  message?: string;
}

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
// Formula: GPA = (score - 50) / 10 = score/10 - 5
// Examples: 99->4.9, 95->4.5, 88->3.8, 78->2.8, 68->1.8
export function scoreToGpaManual(score: number): number {
  if (score < 60) return 0;
  const gpa = (score - 50) / 10;
  return Math.min(gpa, 5.0); // Cap at 5.0
}
