import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('기본 버튼이 렌더링된다', () => {
    render(<Button>테스트 버튼</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('테스트 버튼');
  });

  it('다양한 variant 스타일이 적용된다', () => {
    const { rerender } = render(<Button variant='primary'>Primary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');

    rerender(<Button variant='secondary'>Secondary</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');

    rerender(<Button variant='danger'>Danger</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });

  it('다양한 size 스타일이 적용된다', () => {
    const { rerender } = render(<Button size='small'>Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<Button size='medium'>Medium</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');

    rerender(<Button size='large'>Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('disabled 상태가 적용된다', () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('loading 상태가 적용된다', () => {
    render(<Button loading>Loading Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    // 로딩 스피너가 있는지 확인
    const spinner = button.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('클릭 이벤트가 호출된다', () => {
    const mockClick = vi.fn();
    render(<Button onClick={mockClick}>Clickable Button</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태에서는 클릭 이벤트가 호출되지 않는다', () => {
    const mockClick = vi.fn();
    render(
      <Button disabled onClick={mockClick}>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClick).not.toHaveBeenCalled();
  });

  it('loading 상태에서는 클릭 이벤트가 호출되지 않는다', () => {
    const mockClick = vi.fn();
    render(
      <Button loading onClick={mockClick}>
        Loading Button
      </Button>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockClick).not.toHaveBeenCalled();
  });

  it('커스텀 className이 적용된다', () => {
    render(<Button className='custom-class'>Custom Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('추가 props가 전달된다', () => {
    render(
      <Button data-testid='test-button' aria-label='Test Button'>
        Props Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-testid', 'test-button');
    expect(button).toHaveAttribute('aria-label', 'Test Button');
  });
});
