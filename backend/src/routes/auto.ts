import { Router } from 'express';
import type { AutoLoginRequest, AutoLoginResponse, FetchGradesResponse } from '../types';
import { ScraperService } from '../scraper/scraper';
import { insertUserGrade, insertGpaResult, getUserGradesBySession, deleteUserGradesBySession } from '../database';
import { scoreToGpa, calculateGpaFromGrades } from '../utils/gpa';

const router = Router();
const scraperService = new ScraperService();

// POST /api/auto/login
router.post('/login', async (req, res) => {
  try {
    const { netid, password }: AutoLoginRequest = req.body;

    if (!netid || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供学号和密码'
      } as AutoLoginResponse);
    }

    const result = await scraperService.login(netid, password);

    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        message: '登录成功'
      } as AutoLoginResponse);
    } else {
      res.status(401).json({
        success: false,
        message: result.message || '登录失败'
      } as AutoLoginResponse);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录过程中发生错误'
    } as AutoLoginResponse);
  }
});

// POST /api/auto/fetch-grades
router.post('/fetch-grades', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: '请提供会话ID'
      } as FetchGradesResponse);
    }

    // Check if session exists
    const session = scraperService.getSession(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: '会话已过期，请重新登录'
      } as FetchGradesResponse);
    }

    // Fetch grades from scraper
    const grades = await scraperService.fetchGrades(sessionId);

    if (!grades || grades.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到成绩数据'
      } as FetchGradesResponse);
    }

    // Clear old grades for this session
    deleteUserGradesBySession(sessionId);

    // Save grades to database
    let insertedCount = 0;
    for (const grade of grades) {
      try {
        insertUserGrade({
          sessionId,
          courseCode: grade.courseCode || '',
          courseName: grade.courseName,
          credits: grade.credits,
          score: grade.score,
          gpa: grade.gpa, // Use GPA from scraper (official SYSU GPA)
          category: grade.category,
          academicYear: grade.academicYear,
          semester: grade.semester
        });
        insertedCount++;
      } catch (e) {
        console.error('Failed to insert grade:', grade.courseName, e);
      }
    }
    console.log(`Inserted ${insertedCount} grades out of ${grades.length}`);

    // Calculate GPA
    const userGrades = getUserGradesBySession(sessionId) as any[];
    const result = calculateGpaFromGrades(userGrades.map(g => ({
      sessionId,
      courseCode: g.course_code,
      courseName: g.course_name,
      credits: g.credits,
      score: g.score,
      gpa: g.gpa,
      category: g.category,
      academicYear: g.academic_year,
      semester: g.semester
    })));

    // Save result
    insertGpaResult({
      sessionId,
      netid: session.netid,
      year1PublicGpa: result.year1PublicGpa,
      year1MajorGpa: result.year1MajorGpa,
      year2MajorGpa: result.year2MajorGpa,
      year3MajorGpa: result.year3MajorGpa,
      finalGpa: result.finalGpa
    });

    res.json({
      success: true,
      courses: grades,
      gpaResult: result
    } as FetchGradesResponse);
  } catch (error) {
    console.error('Fetch grades error:', error);
    res.status(500).json({
      success: false,
      message: '获取成绩过程中发生错误'
    } as FetchGradesResponse);
  }
});

// POST /api/auto/logout
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (sessionId) {
      await scraperService.logout(sessionId);
      // Note: We don't delete grades here anymore
      // Grades are kept permanently (with netid) or cleaned up by scheduled task (without netid)
    }

    res.json({
      success: true,
      message: '已登出'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: '登出过程中发生错误'
    });
  }
});

export default router;
