import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-rajdhani font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-neon-red transform hover:scale-105",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-neon-red",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-neon-red",
        secondary: "bg-gradient-secondary text-accent-foreground hover:shadow-neon-green transform hover:scale-105",
        ghost: "text-foreground hover:bg-secondary/50 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        gamer: "bg-gradient-dark border-2 border-primary/30 text-foreground hover:border-primary hover:shadow-neon-red transform hover:scale-105 font-orbitron",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-neon-green",
        neon: "bg-transparent border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-background hover:shadow-neon-green animate-neon",
      },
      size: {
        default: "h-11 px-6 py-2 text-sm",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-14 rounded-lg px-10 text-base font-semibold",
        xl: "h-16 rounded-xl px-12 text-lg font-bold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
