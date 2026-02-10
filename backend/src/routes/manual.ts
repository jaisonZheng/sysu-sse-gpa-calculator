import { Router } from 'express';
import type { ManualCalculateRequest, ManualCalculateResponse, UserGrade } from '../types';
import { scoreToGpaManual, calculateGpaFromGrades } from '../utils/gpa';
import { insertUserGrade, insertGpaResult, deleteUserGradesBySession } from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/manual/calculate
router.post('/calculate', (req, res) => {
  try {
    const { netid, courses }: ManualCalculateRequest = req.body;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        finalGpa: 0,
        details: { year1PublicGpa: 0, year1MajorGpa: 0, year2MajorGpa: 0, year3MajorGpa: 0 },
        message: '请提供课程数据'
      } as ManualCalculateResponse);
    }

    // Generate session ID
    const sessionId = uuidv4();

    // Convert to UserGrade format and calculate GPA for each course
    const userGrades: UserGrade[] = courses.map(course => ({
      sessionId,
      courseCode: course.courseCode || '',
      courseName: course.courseName,
      credits: course.credits,
      score: course.score,
      gpa: scoreToGpaManual(course.score),
      category: course.category,
      academicYear: course.academicYear,
      semester: course.semester
    }));

    // Save grades to database
    for (const grade of userGrades) {
      insertUserGrade({
        sessionId: grade.sessionId!,
        courseCode: grade.courseCode,
        courseName: grade.courseName,
        credits: grade.credits,
        score: grade.score,
        gpa: grade.gpa,
        category: grade.category,
        academicYear: grade.academicYear,
        semester: grade.semester
      });
    }

    // Calculate final GPA
    const result = calculateGpaFromGrades(userGrades);

    // Save result to database
    insertGpaResult({
      sessionId,
      netid,
      year1PublicGpa: result.year1PublicGpa,
      year1MajorGpa: result.year1MajorGpa,
      year2MajorGpa: result.year2MajorGpa,
      year3MajorGpa: result.year3MajorGpa,
      finalGpa: result.finalGpa
    });

    const response: ManualCalculateResponse = {
      success: true,
      finalGpa: result.finalGpa,
      details: {
        year1PublicGpa: result.year1PublicGpa,
        year1MajorGpa: result.year1MajorGpa,
        year2MajorGpa: result.year2MajorGpa,
        year3MajorGpa: result.year3MajorGpa
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Calculate error:', error);
    res.status(500).json({
      success: false,
      finalGpa: 0,
      details: { year1PublicGpa: 0, year1MajorGpa: 0, year2MajorGpa: 0, year3MajorGpa: 0 },
      message: '计算过程中发生错误'
    } as ManualCalculateResponse);
  }
});

export default router;
