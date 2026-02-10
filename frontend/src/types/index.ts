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
