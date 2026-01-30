/**
 * UI Components Barrel Export
 *
 * @description Centralized exports for all UI components
 * @module @/components/ui
 */

// Custom UI Components
export { AutoResizeTextarea } from './AutoResizeTextarea';
// Shadcn/UI Core Components
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';
export { Alert, AlertDescription, AlertTitle } from './alert';
export { default as BasicTyping } from './BasicTyping';
export { Badge, type BadgeProps, badgeVariants } from './badge';
export { Button, type ButtonProps, buttonVariants } from './button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
export {
  AIError,
  AuthError,
  DataError,
  ErrorMessage,
  type ErrorMessageProps,
  NetworkError,
  ServerError,
} from './ErrorMessage';
export {
  ButtonWithFeedback,
  type InlineFeedback,
  InlineFeedbackContainer,
  inlineFeedbackManager,
  StatusBadge,
  useInlineFeedback,
} from './InlineFeedbackSystem';
export { Input } from './input';
export {
  LoadingOverlay,
  LoadingSpinner,
  Spinner,
} from './LoadingSpinner';
export { FontAwesome, LucideIcon } from './LucideIcon';
export { Label } from './label';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from './popover';
export { Progress } from './progress';
export { ScrollArea, ScrollBar } from './scroll-area';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
export { Separator } from './separator';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from './sheet';
export { Skeleton } from './skeleton';
export { Switch } from './switch';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Textarea } from './textarea';
export {
  Toast,
  ToastAction,
  type ToastActionElement,
  ToastClose,
  ToastDescription,
  type ToastProps,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
export { Toaster } from './toaster';
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
