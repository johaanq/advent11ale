import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
  children: React.ReactNode
}

export function Button({
  variant = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variantStyles = {
    default: "bg-wine-600 text-white hover:bg-wine-700 focus:ring-wine-500",
    outline: "border-2 hover:bg-wine-800/30",
  }

  const classes = `${baseStyles} ${variantStyles[variant]} ${className}`

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

