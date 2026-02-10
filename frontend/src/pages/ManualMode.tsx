import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calculator, Trash2, Plus, GraduationCap } from 'lucide-react'
import type { ManualCalculateResponse, AcademicYear, CourseCategory } from '@/types'
import { scoreToGpa } from '@/types'

interface CourseInput {
  id: string
  courseName: string
  credits: number
  score: number
  category: CourseCategory
  academicYear: AcademicYear
  semester: 1 | 2
}

interface CourseData {
  courseName: string
  credits: number
  academicYear: number
}

interface GradeYearData {
  public_required: CourseData[]
  major_required: CourseData[]
  major_elective: CourseData[]
}

export default function ManualMode() {
  const [selectedGradeYear, setSelectedGradeYear] = useState<string>('')
  const [availableYears, setAvailableYears] = useState<number[]>([1, 2, 3])
  const [, setCoursesData] = useState<GradeYearData | null>(null)
  const [activeYear, setActiveYear] = useState<AcademicYear>(1)
  const [courses, setCourses] = useState<Record<AcademicYear, CourseInput[]>>({ 1: [], 2: [], 3: [] })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ManualCalculateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gradeYears, setGradeYears] = useState<string[]>([])

  // Fetch available grade years on mount
  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGradeYears(data.gradeYears)
        }
      })
      .catch(console.error)
  }, [])

  // Load courses when grade year is selected
  useEffect(() => {
    if (!selectedGradeYear) return

    fetch(`/api/courses/${selectedGradeYear}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCoursesData(data.courses)
          setAvailableYears(data.availableYears)

          // Initialize courses from template
          const initialCourses: Record<AcademicYear, CourseInput[]> = { 1: [], 2: [], 3: [] }

          // Process public required courses
          data.courses.public_required?.forEach((c: CourseData, idx: number) => {
            const year = Math.min(c.academicYear, 3) as AcademicYear
            if (initialCourses[year]) {
              initialCourses[year].push({
                id: `pub-${idx}`,
                courseName: c.courseName,
                credits: c.credits,
                score: 0,
                category: 'public_required',
                academicYear: year,
                semester: c.academicYear * 2 - 1 > 1 ? 2 : 1
              })
            }
          })

          // Process major required courses
          data.courses.major_required?.forEach((c: CourseData, idx: number) => {
            const year = Math.min(c.academicYear, 3) as AcademicYear
            if (initialCourses[year]) {
              initialCourses[year].push({
                id: `maj-${idx}`,
                courseName: c.courseName,
                credits: c.credits,
                score: 0,
                category: 'major_required',
                academicYear: year,
                semester: c.academicYear * 2 - 1 > 1 ? 2 : 1
              })
            }
          })

          setCourses(initialCourses)
          if (data.availableYears.length > 0) {
            setActiveYear(data.availableYears[0] as AcademicYear)
          }
        }
      })
      .catch(console.error)
  }, [selectedGradeYear])

  const handleScoreChange = (year: AcademicYear, id: string, score: string) => {
    const numScore = parseFloat(score) || 0
    setCourses(prev => ({
      ...prev,
      [year]: prev[year].map(c => c.id === id ? { ...c, score: numScore } : c)
    }))
  }

  const handleAddCourse = (year: AcademicYear) => {
    const newCourse: CourseInput = {
      id: Date.now().toString(),
      courseName: '',
      credits: 3,
      score: 0,
      category: year === 1 ? 'public_required' : 'major_required',
      academicYear: year,
      semester: 1
    }
    setCourses(prev => ({
      ...prev,
      [year]: [...prev[year], newCourse]
    }))
  }

  const handleRemoveCourse = (year: AcademicYear, id: string) => {
    setCourses(prev => ({
      ...prev,
      [year]: prev[year].filter(c => c.id !== id)
    }))
  }

  const handleCourseChange = (year: AcademicYear, id: string, field: keyof CourseInput, value: string | number) => {
    setCourses(prev => ({
      ...prev,
      [year]: prev[year].map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
  }

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const allCourses = Object.values(courses).flat()
      const validCourses = allCourses.filter(c => c.score > 0 && c.courseName.trim() !== '')

      if (validCourses.length === 0) {
        setError('请至少输入一门课程的成绩')
        setLoading(false)
        return
      }

      const response = await fetch('/api/manual/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses: validCourses.map(c => ({
            courseCode: c.id,
            courseName: c.courseName,
            credits: c.credits,
            score: c.score,
            category: c.category,
            academicYear: c.academicYear,
            semester: c.semester
          }))
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || '计算失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // Show grade year selector if not selected
  if (!selectedGradeYear) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <GraduationCap className="h-16 w-16 mx-auto text-blue-500" />
          <h2 className="text-2xl font-bold">选择你的年级</h2>
          <p className="text-gray-500">请根据你的入学年份选择，系统会为你加载对应的培养方案</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gradeYears.map(year => (
            <Button
              key={year}
              variant="outline"
              size="lg"
              onClick={() => setSelectedGradeYear(year)}
              className="h-24 text-lg"
            >
              {year}级
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const yearLabels: Record<number, string> = {
    1: '大一',
    2: '大二',
    3: '大三'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          当前选择: <span className="font-medium">{selectedGradeYear}级</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedGradeYear('')}>
          重新选择年级
        </Button>
      </div>

      <Tabs value={activeYear.toString()} onValueChange={(v) => setActiveYear(parseInt(v) as AcademicYear)}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableYears.length}, 1fr)` }}>
          {availableYears.map(year => (
            <TabsTrigger key={year} value={year.toString()}>{yearLabels[year]}</TabsTrigger>
          ))}
        </TabsList>

        {availableYears.map((year) => (
          <TabsContent key={year} value={year.toString()}>
            <div className="space-y-4">
              {courses[year as AcademicYear]?.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-4">
                        <Label className="text-xs">课程名称</Label>
                        <Input
                          value={course.courseName}
                          onChange={(e) => handleCourseChange(year as AcademicYear, course.id, 'courseName', e.target.value)}
                          placeholder="课程名称"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">学分</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={course.credits}
                          onChange={(e) => handleCourseChange(year as AcademicYear, course.id, 'credits', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">类别</Label>
                        <select
                          value={course.category}
                          onChange={(e) => handleCourseChange(year as AcademicYear, course.id, 'category', e.target.value as CourseCategory)}
                          className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="public_required">公必</option>
                          <option value="major_required">专必</option>
                          <option value="major_elective">专选</option>
                          <option value="general_elective">通选</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">成绩 (0-100)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={course.score || ''}
                          onChange={(e) => handleScoreChange(year as AcademicYear, course.id, e.target.value)}
                          placeholder="成绩"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCourse(year as AcademicYear, course.id)}
                          className="mt-5"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {course.score > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        绩点: {scoreToGpa(course.score).toFixed(1)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={() => handleAddCourse(year as AcademicYear)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加课程
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Button
          onClick={handleCalculate}
          disabled={loading}
          size="lg"
          className="w-full md:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              计算中...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              计算保研绩点
            </>
          )}
        </Button>
      </div>

      {result && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">最终保研绩点</h3>
              <div className="text-5xl font-bold text-blue-600">
                {result.finalGpa.toFixed(2)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-500 mb-1">所有公必绩点</div>
                <div className="text-xl font-semibold">{result.details.year1PublicGpa.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-500 mb-1">大一专必绩点</div>
                <div className="text-xl font-semibold">{result.details.year1MajorGpa.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-500 mb-1">大二专必绩点</div>
                <div className="text-xl font-semibold">{result.details.year2MajorGpa.toFixed(2)}</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-500 mb-1">大三专必绩点</div>
                <div className="text-xl font-semibold">{result.details.year3MajorGpa.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
