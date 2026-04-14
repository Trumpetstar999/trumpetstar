import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>>(({
  className,
  ...props
}, ref) => <SwitchPrimitives.Root className={cn("peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-inner transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-muted/50 data-[state=checked]:bg-[hsl(120,45%,60%)]", className)} {...props} ref={ref}>
    <SwitchPrimitives.Thumb className={cn("pointer-events-none block h-6 w-6 rounded-full bg-white border border-black/10 shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-0 transition-all duration-300 ease-in-out data-[state=checked]:translate-x-[26px] data-[state=unchecked]:translate-x-[2px]")} />
  </SwitchPrimitives.Root>);
Switch.displayName = SwitchPrimitives.Root.displayName;
export { Switch };