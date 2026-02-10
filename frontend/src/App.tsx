import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Calculator, Globe, Info } from 'lucide-react'
import ManualMode from './pages/ManualMode'
import AutoMode from './pages/AutoMode'

function App() {
  const [activeTab, setActiveTab] = useState('manual')

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            中山大学保研绩点计算器
          </h1>
          <p className="text-gray-600">
            支持手动输入和自动爬取两种模式，精准计算保研绩点
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>计算规则说明</AlertTitle>
          <AlertDescription>
            综合成绩绩点 = 所有公共必修课和一年级专业必修课的平均绩点 × 0.5 + 二年级和三年级专业必修课的平均绩点 × 0.5
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              手动模式
            </TabsTrigger>
            <TabsTrigger value="auto" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              自动爬取模式
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>手动输入成绩</CardTitle>
                <CardDescription>
                  手动输入各门课程的成绩，系统将自动计算保研绩点
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManualMode />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auto">
            <Card>
              <CardHeader>
                <CardTitle>自动爬取成绩</CardTitle>
                <CardDescription>
                  使用 netid 登录教务系统，自动爬取并计算保研绩点
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutoMode />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 中山大学保研绩点计算器 | 数据仅供参考，请以官方公布为准</p>
          <p className="mt-1">隐私说明：自动模式下密码仅用于登录，不会被存储</p>
        </div>
      </div>
    </div>
  )
}

export default App
