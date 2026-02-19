import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const Sheet = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80" onClick={() => onOpenChange(false)} />
      {children}
    </>
  );
};

const SheetTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) => <>{children}</>;

const SheetContent = ({
  side = 'right',
  className,
  children,
}: {
  side?: 'right';
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm bg-[#0B0D0E] border-gray-800',
      className,
    )}>
    {children}
    <button
      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
      onClick={e => {
        // Traverse up to find close handler or just let parent handle click-outside if needed
        // Ideally pass simpler state
        const parent = e.currentTarget.parentElement?.parentElement;
        // This is a simplified Mock. In real usage, we pass setOpen via Context.
        // For now we rely on the overlay click to close or custom Logic.
      }}>
      <X className="h-4 w-4 text-gray-400" />
      <span className="sr-only">Close</span>
    </button>
  </div>
);

export { Sheet, SheetTrigger, SheetContent };
