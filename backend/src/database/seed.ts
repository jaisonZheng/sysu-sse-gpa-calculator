import db, { insertCourse } from './index';

// 中山大学计算机学院 2023级 培养方案课程数据（示例）
// 实际使用时需要根据具体专业和年级调整

const courses = [
  // 大一公共必修课
  { courseCode: 'MATH101', courseName: '高等数学I', credits: 5, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'MATH102', courseName: '高等数学II', credits: 5, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'MATH103', courseName: '线性代数', credits: 3, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'MATH104', courseName: '概率论与数理统计', credits: 3, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'PHY101', courseName: '大学物理I', credits: 4, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'PHY102', courseName: '大学物理II', credits: 4, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'ENG101', courseName: '大学英语I', credits: 2, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'ENG102', courseName: '大学英语II', credits: 2, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'ENG103', courseName: '大学英语III', credits: 2, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'ENG104', courseName: '大学英语IV', credits: 2, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'PE101', courseName: '体育I', credits: 1, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'PE102', courseName: '体育II', credits: 1, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'PE103', courseName: '体育III', credits: 1, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'PE104', courseName: '体育IV', credits: 1, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'POL101', courseName: '思想道德与法治', credits: 3, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'POL102', courseName: '中国近现代史纲要', credits: 3, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'POL103', courseName: '马克思主义基本原理', credits: 3, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'POL104', courseName: '毛泽东思想和中国特色社会主义理论体系概论', credits: 4, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'MIL101', courseName: '军事理论', credits: 2, category: 'public_required', gradeYear: 2023 },
  { courseCode: 'MIL102', courseName: '军事技能', credits: 2, category: 'public_required', gradeYear: 2023 },

  // 大一专业必修课
  { courseCode: 'CS101', courseName: '计算机科学导论', credits: 2, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS102', courseName: '程序设计基础', credits: 4, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS103', courseName: '离散数学', credits: 4, category: 'major_required', gradeYear: 2023 },

  // 大二专业必修课
  { courseCode: 'CS201', courseName: '数据结构与算法', credits: 5, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS202', courseName: '计算机组成原理', credits: 4, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS203', courseName: '操作系统', credits: 4, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS204', courseName: '计算机网络', credits: 4, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS205', courseName: '数据库系统', credits: 3, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS206', courseName: '面向对象程序设计', credits: 3, category: 'major_required', gradeYear: 2023 },

  // 大三专业必修课
  { courseCode: 'CS301', courseName: '软件工程', credits: 3, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS302', courseName: '编译原理', credits: 3, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS303', courseName: '人工智能导论', credits: 3, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS304', courseName: '计算机系统结构', credits: 3, category: 'major_required', gradeYear: 2023 },
  { courseCode: 'CS305', courseName: '算法设计与分析', credits: 3, category: 'major_required', gradeYear: 2023 },

  // 专业选修课
  { courseCode: 'CS401', courseName: '机器学习', credits: 3, category: 'major_elective', gradeYear: 2023 },
  { courseCode: 'CS402', courseName: '深度学习', credits: 3, category: 'major_elective', gradeYear: 2023 },
  { courseCode: 'CS403', courseName: '计算机视觉', credits: 3, category: 'major_elective', gradeYear: 2023 },
  { courseCode: 'CS404', courseName: '自然语言处理', credits: 3, category: 'major_elective', gradeYear: 2023 },
  { courseCode: 'CS405', courseName: '网络安全', credits: 3, category: 'major_elective', gradeYear: 2023 },
  { courseCode: 'CS406', courseName: '分布式系统', credits: 3, category: 'major_elective', gradeYear: 2023 },
  { courseCode: 'CS407', courseName: '云计算技术', credits: 3, category: 'major_elective', gradeYear: 2023 },
  { courseCode: 'CS408', courseName: '大数据技术', credits: 3, category: 'major_elective', gradeYear: 2023 },

  // 通识选修课
  { courseCode: 'GEN101', courseName: '通识选修课1', credits: 2, category: 'general_elective', gradeYear: 2023 },
  { courseCode: 'GEN102', courseName: '通识选修课2', credits: 2, category: 'general_elective', gradeYear: 2023 },
  { courseCode: 'GEN103', courseName: '通识选修课3', credits: 2, category: 'general_elective', gradeYear: 2023 },
];

export function seedDatabase() {
  console.log('Seeding database with course data...');

  for (const course of courses) {
    try {
      insertCourse(course);
    } catch (error) {
      console.error(`Failed to insert course ${course.courseCode}:`, error);
    }
  }

  console.log(`Seeded ${courses.length} courses`);
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}
