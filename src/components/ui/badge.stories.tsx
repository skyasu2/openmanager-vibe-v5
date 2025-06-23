import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const ServerStatus: Story = {
  render: () => (
    <div className='flex gap-2 flex-wrap'>
      <Badge variant='default' className='bg-green-100 text-green-800'>
        ✅ 정상
      </Badge>
      <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
        ⚠️ 경고
      </Badge>
      <Badge variant='destructive'>🚨 위험</Badge>
      <Badge variant='outline'>🔧 유지보수</Badge>
    </div>
  ),
};
