/**
 * Table Stories
 * 
 * 테이블 컴포넌트의 다양한 상태와 시나리오를 문서화합니다.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

const meta: Meta<typeof Table> = {
  title: '🎨 UI Components/Table',
  component: Table,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**Table Component**

데이터를 구조화하여 표시하는 테이블 컴포넌트입니다.

### 주요 기능
- 반응형 테이블 레이아웃
- 정렬 기능 지원
- 스트라이프 행 스타일
- 접근성 준수

### 사용 예시
\`\`\`tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>이름</TableHead>
      <TableHead>상태</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>서버 1</TableCell>
      <TableCell>온라인</TableCell>
    </TableRow>
  </TableBody>
</Table>
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
  name: '기본 테이블',
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">서버명</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>CPU</TableHead>
          <TableHead className="text-right">메모리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">WEB-01</TableCell>
          <TableCell>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              온라인
            </span>
          </TableCell>
          <TableCell>45%</TableCell>
          <TableCell className="text-right">2.4GB</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">DB-01</TableCell>
          <TableCell>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              온라인
            </span>
          </TableCell>
          <TableCell>78%</TableCell>
          <TableCell className="text-right">4.1GB</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">CACHE-01</TableCell>
          <TableCell>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              오프라인
            </span>
          </TableCell>
          <TableCell>0%</TableCell>
          <TableCell className="text-right">0GB</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Simple: Story = {
  name: '간단한 테이블',
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>역할</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>홍길동</TableCell>
          <TableCell>hong@example.com</TableCell>
          <TableCell>관리자</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>김철수</TableCell>
          <TableCell>kim@example.com</TableCell>
          <TableCell>사용자</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
