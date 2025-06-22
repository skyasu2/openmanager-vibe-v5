/**
 * Drawer Stories
 * 
 * 드로어 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './drawer';

const meta: Meta<typeof Drawer> = {
  title: '🎨 UI Components/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Drawer Component**

화면 가장자리에서 슬라이드되는 드로어 컴포넌트입니다.

### 주요 기능
- 좌/우/상/하 방향 지원
- 부드러운 슬라이드 애니메이션
- 오버레이 배경
- 키보드 네비게이션 지원

### 사용 예시
\`\`\`tsx
<Drawer>
  <DrawerTrigger asChild>
    <Button>드로어 열기</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>제목</DrawerTitle>
      <DrawerDescription>설명</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">닫기</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
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
  name: '기본 드로어',
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">드로어 열기</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>설정</DrawerTitle>
            <DrawerDescription>
              여기에서 애플리케이션 설정을 변경할 수 있습니다.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-y-2">
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  알림 설정, 테마 변경, 계정 관리 등의 옵션을 사용할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button>설정 저장</Button>
            <DrawerClose asChild>
              <Button variant="outline">취소</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithForm: Story = {
  name: '폼이 있는 드로어',
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>새 항목 추가</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>새 항목 추가</DrawerTitle>
            <DrawerDescription>
              새로운 서버 정보를 입력하세요.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">서버 이름</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="예: Web Server 01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">IP 주소</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="예: 192.168.1.100"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button>추가</Button>
            <DrawerClose asChild>
              <Button variant="outline">취소</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ),
};
