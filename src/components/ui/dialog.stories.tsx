/**
 * Dialog Stories
 * 
 * 다이얼로그 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';

const meta: Meta<typeof Dialog> = {
  title: '🎨 UI Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Dialog Component**

모달 형태의 다이얼로그를 제공하는 컴포넌트입니다.

### 주요 기능
- 모달 오버레이
- 키보드 네비게이션 (ESC로 닫기)
- 접근성 준수 (ARIA 속성)
- 트리거 버튼 지원

### 사용 예시
\`\`\`tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>다이얼로그 열기</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>설명입니다.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 다이얼로그',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">다이얼로그 열기</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>설정 편집</DialogTitle>
          <DialogDescription>
            여기에서 프로필 설정을 변경할 수 있습니다. 완료되면 저장을 클릭하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              이름
            </label>
            <input
              id="name"
              defaultValue="홍길동"
              className="col-span-3 px-3 py-2 border rounded"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="username" className="text-right">
              사용자명
            </label>
            <input
              id="username"
              defaultValue="@gildong"
              className="col-span-3 px-3 py-2 border rounded"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">변경사항 저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Confirmation: Story = {
  name: '확인 다이얼로그',
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">삭제</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>정말로 삭제하시겠습니까?</DialogTitle>
          <DialogDescription>
            이 작업은 되돌릴 수 없습니다. 데이터가 영구적으로 삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">취소</Button>
          <Button variant="destructive">삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
