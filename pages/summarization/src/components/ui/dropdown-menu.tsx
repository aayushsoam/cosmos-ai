import * as React from 'react';
import { cn } from '@/lib/utils';
// Simplified implementation without Radix primitives for speed, can upgrade later
const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
  <div className="relative inline-block text-left">{children}</div>
);
const DropdownMenuTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) => (
  <>{children}</>
);

const DropdownMenuContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      'absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 bg-[#1e1e1e] border border-gray-700',
      className,
    )}>
    <div className="py-1">{children}</div>
  </div>
);

const DropdownMenuItem = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={cn('text-gray-300 block w-full px-4 py-2 text-left text-sm hover:bg-gray-700', className)}>
    {children}
  </button>
);

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
