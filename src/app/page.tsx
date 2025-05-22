import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-blue-900">
            OpenManager Vibe V5
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI 기반 서버 모니터링 및 분석 플랫폼
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <FeatureCard 
            title="서버 모니터링"
            description="실시간 서버 상태 모니터링 및 알림 기능을 제공합니다."
            icon="/globe.svg"
            link="/dashboard"
          />
          <FeatureCard 
            title="MCP 대화형 인터페이스"
            description="자연어로 시스템 상태를 물어보고 분석 결과를 확인하세요."
            icon="/window.svg"
            link="/chat"
          />
          <FeatureCard 
            title="리포트 및 분석"
            description="서버 성능 분석 및 리포트 생성을 자동화합니다."
            icon="/file.svg"
            link="/reports"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">시작하기</h2>
          <p className="text-gray-600 mb-6">
            대시보드에서 서버 상태를 확인하거나, MCP 대화형 인터페이스를 통해 자연어로 질문해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
            >
              대시보드 바로가기
            </Link>
            <Link
              href="/chat"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
            >
              MCP 채팅 시작하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: string
  link: string
}

function FeatureCard({ title, description, icon, link }: FeatureCardProps) {
  return (
    <Link
      href={link}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
    >
      <div className="p-6">
        <div className="mb-4 flex justify-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <Image src={icon} alt={title} width={32} height={32} />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-blue-800">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  )
}
