import * as React from "react"
import { cn } from "../../utils/cn"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border-color bg-card text-textPrimary shadow glass-panel",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export { Card }
