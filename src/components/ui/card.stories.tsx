import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardContent className='p-6'>
        <p>Simple card with just content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>Server Status</CardTitle>
        <CardDescription>Current server monitoring information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <p className='text-sm text-green-600'>✅ All systems operational</p>
          <p className='text-sm text-gray-600'>Last updated: Just now</p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>서버 대시보드</CardTitle>
        <CardDescription>실시간 서버 모니터링</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='flex justify-between'>
            <span className='text-sm font-medium'>CPU 사용률</span>
            <span className='text-sm text-green-600'>45%</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm font-medium'>메모리 사용률</span>
            <span className='text-sm text-yellow-600'>78%</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm font-medium'>디스크 사용률</span>
            <span className='text-sm text-red-600'>89%</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant='outline' className='w-full'>
          상세 보기
        </Button>
      </CardFooter>
    </Card>
  ),
};
