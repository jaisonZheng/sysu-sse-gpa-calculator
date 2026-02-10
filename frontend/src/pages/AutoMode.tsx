import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, LogIn, LogOut, Shield, Eye, EyeOff } from 'lucide-react'
import type { AutoLoginResponse, FetchGradesResponse, UserGrade, GpaResult, CourseCategory } from '@/types'

export default function AutoMode() {
  const [netid, setNetid] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<UserGrade[] | null>(null)
  const [result, setResult] = useState<GpaResult | null>(null)

  const handleLogin = async () => {
    if (!netid.trim() || !password.trim()) {
      setError('请输入学号和密码')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auto/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ netid, password })
      })

      const data: AutoLoginResponse = await response.json()

      if (data.success && data.sessionId) {
        setSessionId(data.sessionId)
        // Clear password after login
        setPassword('')
        // Automatically fetch grades
        await fetchGrades(data.sessionId)
      } else {
        setError(data.message || '登录失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async (sid: string) => {
    setFetching(true)
    setError(null)

    try {
      const response = await fetch('/api/auto/fetch-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid })
      })

      const data: FetchGradesResponse = await response.json()

      if (data.success) {
        setCourses(data.courses || [])
        setResult(data.gpaResult || null)
      } else {
        setError(data.message || '获取成绩失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setFetching(false)
    }
  }

  const handleLogout = async () => {
    if (sessionId) {
      await fetch('/api/auto/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
    }
    setSessionId(null)
    setCourses(null)
    setResult(null)
    setError(null)
  }

  const getCategoryLabel = (category: CourseCategory) => {
    const labels: Record<CourseCategory, string> = {
      public_required: '公必',
      major_required: '专必',
      major_elective: '专选',
      general_elective: '通选'
    }
    return labels[category]
  }

  const getYearLabel = (year: number) => {
    const labels: Record<number, string> = {
      1: '大一',
      2: '大二',
      3: '大三'
    }
    return labels[year] || `大${year}`
  }

  if (sessionId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">已登录</h3>
            <p className="text-sm text-gray-500">学号: {netid}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>

        {fetching && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">正在爬取成绩数据，请稍候...</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                  <div className="text-sm text-gray-500 mb-1">大一公必绩点</div>
                  <div className="text-xl font-semibold">{result.year1PublicGpa.toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">大一专必绩点</div>
                  <div className="text-xl font-semibold">{result.year1MajorGpa.toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">大二专必绩点</div>
                  <div className="text-xl font-semibold">{result.year2MajorGpa.toFixed(2)}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">大三专必绩点</div>
                  <div className="text-xl font-semibold">{result.year3MajorGpa.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {courses && courses.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">课程成绩详情</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">课程名称</th>
                    <th className="border p-2 text-left">课程代码</th>
                    <th className="border p-2 text-center">学分</th>
                    <th className="border p-2 text-center">成绩</th>
                    <th className="border p-2 text-center">绩点</th>
                    <th className="border p-2 text-center">类别</th>
                    <th className="border p-2 text-center">学年</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-2">{course.courseName}</td>
                      <td className="border p-2">{course.courseCode}</td>
                      <td className="border p-2 text-center">{course.credits}</td>
                      <td className="border p-2 text-center">{course.score}</td>
                      <td className="border p-2 text-center">{course.gpa.toFixed(1)}</td>
                      <td className="border p-2 text-center">{getCategoryLabel(course.category)}</td>
                      <td className="border p-2 text-center">{getYearLabel(course.academicYear)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {courses && courses.length === 0 && !fetching && (
          <Alert>
            <AlertTitle>未找到成绩</AlertTitle>
            <AlertDescription>
              未能从教务系统获取到成绩数据，请检查是否已完成评教或联系管理员。
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>隐私保护说明</AlertTitle>
        <AlertDescription>
          您的密码仅用于登录教务系统，不会被存储在服务器上。爬取的成绩数据会保存在服务器上方便您随时查看（可通过联系管理员删除）。
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="netid">学号 (NetID)</Label>
          <Input
            id="netid"
            value={netid}
            onChange={(e) => setNetid(e.target.value)}
            placeholder="请输入学号"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">密码</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              登录中...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              登录并获取成绩
            </>
          )}
        </Button>
      </div>

      <div className="text-sm text-gray-500 space-y-2">
        <p>说明：</p>
        <ul className="list-disc list-inside space-y-1">
          <li>系统将自动登录中山大学教务系统</li>
          <li>爬取成绩可能需要一些时间，请耐心等待</li>
          <li>如遇问题，请尝试手动模式</li>
        </ul>
      </div>
    </div>
  )
}
