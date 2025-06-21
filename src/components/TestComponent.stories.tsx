import type { Meta, StoryObj } from '@storybook/nextjs';

// Simple test component
const TestComponent = ({ message }: { message: string }) => (
    <div className="p-4 bg-blue-500 text-white rounded">
        {message}
    </div>
);

const meta: Meta<typeof TestComponent> = {
    title: 'Test/TestComponent',
    component: TestComponent,
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        message: {
            control: 'text',
            description: 'Message to display',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        message: 'Hello Storybook!',
    },
};

export const SimpleMessage: Story = {
    args: {
        message: 'Simple test message',
    },
}; 