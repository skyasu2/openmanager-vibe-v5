import type { Meta, StoryObj } from '@storybook/react';
import ServerDashboard from './ServerDashboard';

const meta: Meta<typeof ServerDashboard> = {
  title: 'Dashboard/ServerDashboard',
  component: ServerDashboard,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithManyServers: Story = {
  args: {},
};
