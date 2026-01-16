import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: 'default' | 'player' | 'gold';
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, variant = 'default', ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track 
      className={cn(
        "relative h-2 w-full grow overflow-hidden rounded-full",
        variant === 'player' && "bg-white/20",
        variant === 'gold' && "bg-white/20",
        variant === 'default' && "bg-secondary"
      )}
    >
      <SliderPrimitive.Range 
        className={cn(
          "absolute h-full",
          variant === 'player' && "bg-gradient-to-r from-reward-gold to-reward-gold/80",
          variant === 'gold' && "bg-gradient-to-r from-reward-gold to-reward-gold/80",
          variant === 'default' && "bg-primary"
        )} 
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        "block rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === 'player' && "h-5 w-5 bg-reward-gold border-2 border-reward-gold shadow-md shadow-reward-gold/30 focus-visible:ring-reward-gold",
        variant === 'gold' && "h-5 w-5 bg-reward-gold border-2 border-reward-gold shadow-md shadow-reward-gold/30 focus-visible:ring-reward-gold",
        variant === 'default' && "h-6 w-6 border-2 border-primary bg-background focus-visible:ring-ring"
      )} 
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
