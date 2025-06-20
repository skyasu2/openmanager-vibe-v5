import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AIEngineShowcase = () => {
  const engines = [
    {
      id: 'google-ai',
      name: 'Google AI Studio',
      category: 'external',
      priority: 10,
    },
    {
      id: 'mcp',
      name: 'Model Context Protocol',
      category: 'infrastructure',
      priority: 8,
    },
    {
      id: 'rag',
      name: 'Local Vector Database',
      category: 'infrastructure',
      priority: 7,
    },
    {
      id: 'custom-intent',
      name: '의도 분석 엔진',
      category: 'custom',
      priority: 6,
    },
    {
      id: 'custom-analysis',
      name: '분석 엔진',
      category: 'custom',
      priority: 6,
    },
    {
      id: 'custom-recommendation',
      name: '추천 시스템',
      category: 'custom',
      priority: 5,
    },
    {
      id: 'opensource-nlp',
      name: '자연어 처리',
      category: 'opensource',
      priority: 4,
    },
    {
      id: 'opensource-sentiment',
      name: '감정 분석',
      category: 'opensource',
      priority: 4,
    },
    {
      id: 'opensource-classification',
      name: '분류 시스템',
      category: 'opensource',
      priority: 3,
    },
    {
      id: 'opensource-summarization',
      name: '요약 엔진',
      category: 'opensource',
      priority: 3,
    },
    {
      id: 'opensource-qa',
      name: '질의응답',
      category: 'opensource',
      priority: 3,
    },
    { id: 'anomaly', name: '이상 탐지', category: 'analytics', priority: 5 },
    { id: 'prediction', name: '예측 분석', category: 'analytics', priority: 4 },
    {
      id: 'correlation',
      name: '상관관계 분석',
      category: 'analytics',
      priority: 3,
    },
  ];

  const categoryColors = {
    external: 'bg-blue-100 text-blue-800',
    infrastructure: 'bg-green-100 text-green-800',
    custom: 'bg-orange-100 text-orange-800',
    opensource: 'bg-cyan-100 text-cyan-800',
    analytics: 'bg-red-100 text-red-800',
  };

  return (
    <div className='w-full max-w-6xl mx-auto p-6'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold mb-4'>14개 AI 엔진 시스템</h1>
        <p className='text-gray-600'>
          OpenManager Vibe v5의 통합 AI 엔진 아키텍처
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {engines.map(engine => (
          <Card key={engine.id} className='hover:shadow-lg transition-shadow'>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>
                  {engine.name}
                </CardTitle>
                <Badge variant='outline' className='text-xs'>
                  P{engine.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Badge
                className={`${categoryColors[engine.category]} text-xs`}
                variant='secondary'
              >
                {engine.category}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        {Object.entries(categoryColors).map(([category, colorClass]) => {
          const categoryEngines = engines.filter(e => e.category === category);
          return (
            <Card key={category}>
              <CardHeader className='pb-2'>
                <CardTitle className='text-lg capitalize'>{category}</CardTitle>
                <CardDescription>
                  {categoryEngines.length}개 엔진
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {categoryEngines.map(engine => (
                    <div key={engine.id} className='text-sm'>
                      {engine.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const meta: Meta<typeof AIEngineShowcase> = {
  title: 'AI Systems/AI Engine Showcase',
  component: AIEngineShowcase,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ByCategory: Story = {
  render: () => <AIEngineShowcase />,
};
