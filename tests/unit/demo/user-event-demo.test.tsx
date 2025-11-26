/**
 * 🎯 User Event 데모 테스트
 *
 * @description @testing-library/user-event 사용법 데모
 * @author Claude Code
 * @created 2025-11-26
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 간단한 데모 컴포넌트들
const Button = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => <button onClick={onClick}>{children}</button>;

const Input = ({
  onChange,
  placeholder,
}: {
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <input placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
);

const Form = ({
  onSubmit,
}: {
  onSubmit: (data: { email: string; password: string }) => void;
}) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ email, password });
      }}
    >
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">로그인</button>
    </form>
  );
};

describe('💡 User Event 사용법 데모', () => {
  describe('기본 클릭 인터랙션', () => {
    it('버튼 클릭 시 핸들러가 호출된다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>클릭</Button>);

      // fireEvent보다 실제 사용자 행동에 가까움
      await user.click(screen.getByText('클릭'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('더블 클릭이 작동한다', async () => {
      const user = userEvent.setup();
      const handleDoubleClick = vi.fn();

      render(<button onDoubleClick={handleDoubleClick}>더블클릭</button>);

      await user.dblClick(screen.getByText('더블클릭'));

      expect(handleDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('우클릭(컨텍스트 메뉴)이 작동한다', async () => {
      const user = userEvent.setup();
      const handleContextMenu = vi.fn((e) => e.preventDefault());

      render(<button onContextMenu={handleContextMenu}>우클릭</button>);

      const button = screen.getByText('우클릭');
      await user.pointer({ keys: '[MouseRight]', target: button });

      expect(handleContextMenu).toHaveBeenCalled();
    });
  });

  describe('타이핑 인터랙션', () => {
    it('텍스트 입력이 작동한다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} placeholder="입력하세요" />);

      const input = screen.getByPlaceholderText('입력하세요');
      await user.type(input, 'Hello World');

      // 각 키 입력마다 onChange가 호출됨
      expect(handleChange).toHaveBeenCalledTimes(11); // "Hello World" = 11자
      expect(input).toHaveValue('Hello World');
    });

    it('특수 키 입력이 작동한다', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input onChange={handleChange} placeholder="입력하세요" />);

      const input = screen.getByPlaceholderText('입력하세요');

      // 특수 키 조합
      await user.type(input, 'test{Enter}');
      await user.type(input, '{Backspace}{Backspace}');
      await user.type(input, '{Control>}a{/Control}'); // Ctrl+A

      expect(handleChange).toHaveBeenCalled();
    });

    it('복사-붙여넣기가 작동한다', async () => {
      const user = userEvent.setup();

      render(<Input onChange={vi.fn()} placeholder="입력하세요" />);

      const input = screen.getByPlaceholderText('입력하세요');

      // 클립보드 작업
      await user.type(input, 'Copy this');
      await user.tripleClick(input); // 전체 선택
      await user.copy(); // Ctrl+C
      await user.clear(input);
      await user.paste(); // Ctrl+V

      expect(input).toHaveValue('Copy this');
    });
  });

  describe('폼 인터랙션', () => {
    it('폼 제출이 작동한다', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(<Form onSubmit={handleSubmit} />);

      // 이메일 입력
      const emailInput = screen.getByPlaceholderText('이메일');
      await user.type(emailInput, 'test@example.com');

      // 비밀번호 입력
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      await user.type(passwordInput, 'password123');

      // 폼 제출
      const submitButton = screen.getByText('로그인');
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('Tab 키로 포커스 이동이 작동한다', async () => {
      const user = userEvent.setup();

      render(<Form onSubmit={vi.fn()} />);

      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');

      // 이메일 필드에 포커스
      await user.click(emailInput);
      expect(emailInput).toHaveFocus();

      // Tab으로 다음 필드로 이동
      await user.tab();
      expect(passwordInput).toHaveFocus();

      // Shift+Tab으로 이전 필드로 이동
      await user.tab({ shift: true });
      expect(emailInput).toHaveFocus();
    });
  });

  describe('키보드 네비게이션', () => {
    it('Enter 키로 버튼 활성화가 작동한다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>확인</Button>);

      const button = screen.getByText('확인');
      button.focus();

      // Enter로 버튼 클릭
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('Space 키로 버튼 활성화가 작동한다', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>확인</Button>);

      const button = screen.getByText('확인');
      button.focus();

      // Space로 버튼 클릭
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('고급 인터랙션', () => {
    it('호버(마우스 오버)가 작동한다', async () => {
      const user = userEvent.setup();
      const handleMouseEnter = vi.fn();
      const handleMouseLeave = vi.fn();

      render(
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          호버 영역
        </div>
      );

      const element = screen.getByText('호버 영역');

      // 마우스 호버
      await user.hover(element);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);

      // 마우스 떠남
      await user.unhover(element);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('드래그 앤 드롭이 작동한다 (기본 예시)', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <div draggable>드래그 가능</div>
          <div>드롭 영역</div>
        </div>
      );

      // 실제 드래그 앤 드롭은 더 복잡하지만,
      // user-event로 포인터 이벤트 시뮬레이션 가능
      const draggable = screen.getByText('드래그 가능');

      await user.pointer([
        { target: draggable, keys: '[MouseLeft>]' },
        { coords: { x: 100, y: 100 } },
        { keys: '[/MouseLeft]' },
      ]);

      // 드래그 이벤트 검증은 실제 구현에 따라 다름
    });
  });

  describe('실전 예시: 검색 기능', () => {
    const SearchComponent = ({
      onSearch,
    }: {
      onSearch: (query: string) => void;
    }) => {
      const [query, setQuery] = React.useState('');

      return (
        <div>
          <input
            type="search"
            placeholder="검색어 입력"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => onSearch(query)}>검색</button>
        </div>
      );
    };

    it('검색 워크플로우가 작동한다', async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();

      render(<SearchComponent onSearch={handleSearch} />);

      // 1. 검색어 입력
      const input = screen.getByPlaceholderText('검색어 입력');
      await user.type(input, 'React Testing');

      // 2. 검색 버튼 클릭
      const button = screen.getByText('검색');
      await user.click(button);

      // 3. 검증
      expect(handleSearch).toHaveBeenCalledWith('React Testing');
    });

    it('Enter 키로도 검색이 가능하다', async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();

      // 폼으로 변경
      const SearchForm = () => {
        const [query, setQuery] = React.useState('');

        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
          >
            <input
              type="search"
              placeholder="검색어 입력"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">검색</button>
          </form>
        );
      };

      render(<SearchForm />);

      // 검색어 입력 후 Enter
      const input = screen.getByPlaceholderText('검색어 입력');
      await user.type(input, 'React Testing{Enter}');

      expect(handleSearch).toHaveBeenCalledWith('React Testing');
    });
  });
});

// React import 추가
import React from 'react';
