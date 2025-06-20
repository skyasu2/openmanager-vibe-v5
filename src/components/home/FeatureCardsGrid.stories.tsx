import type { Meta, StoryObj } from '@storybook/react';
import FeatureCardsGrid from './FeatureCardsGrid';

const meta: Meta<typeof FeatureCardsGrid> = {
  title: 'Home/FeatureCardsGrid',
  component: FeatureCardsGrid,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
