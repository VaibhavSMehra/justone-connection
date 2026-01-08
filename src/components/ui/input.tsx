import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full bg-transparent border-0 border-b-2 border-border/60 px-1 py-3 text-base font-light tracking-wide transition-all duration-500 placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_2px_20px_-4px_hsl(var(--primary)/0.3)] focus-visible:placeholder:text-muted-foreground/30 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
