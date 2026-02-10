import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Load courses data from JSON file
// Try dist/data first (production), then src/data (development)
let coursesDataPath = path.join(__dirname, '../data/courses.json');
if (!fs.existsSync(coursesDataPath)) {
  coursesDataPath = path.join(__dirname, '../../src/data/courses.json');
}
const coursesData = JSON.parse(fs.readFileSync(coursesDataPath, 'utf-8'));

// Get current academic year based on date
function getCurrentAcademicYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // Academic year starts in September
  if (month >= 9) {
    return year;
  } else {
    return year - 1;
  }
}

// Calculate which years should be shown for a student of a given enrollment year
function getAvailableYears(enrollmentYear: number): number[] {
  const currentAcademicYear = getCurrentAcademicYear();
  const yearDiff = currentAcademicYear - enrollmentYear + 1;

  const availableYears: number[] = [];

  if (yearDiff >= 1) availableYears.push(1);
  if (yearDiff >= 2) availableYears.push(2);
  if (yearDiff >= 3) availableYears.push(3);

  return availableYears;
}

// GET /api/courses - Get all available grade years
router.get('/', (req, res) => {
  try {
    const gradeYears = Object.keys(coursesData);
    res.json({
      success: true,
      gradeYears,
      currentAcademicYear: getCurrentAcademicYear()
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: '获取年级列表失败'
    });
  }
});

// GET /api/courses/:gradeYear - Get courses for a specific grade year
router.get('/:gradeYear', (req, res) => {
  try {
    const { gradeYear } = req.params;
    const data = coursesData[gradeYear];

    if (!data) {
      return res.status(404).json({
        success: false,
        message: '未找到该年级的课程数据'
      });
    }

    const enrollmentYear = parseInt(gradeYear);
    const availableYears = getAvailableYears(enrollmentYear);

    res.json({
      success: true,
      enrollmentYear,
      currentAcademicYear: getCurrentAcademicYear(),
      availableYears,
      courses: data
    });
  } catch (error) {
    console.error('Get courses by grade year error:', error);
    res.status(500).json({
      success: false,
      message: '获取课程列表失败'
    });
  }
});

export default router;
