import { forwardRef } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-forest-600 text-cream-50 hover:bg-forest-700",
  secondary: "bg-wood-100 text-wood-800 hover:bg-cream-200 border border-wood-400/40",
  ghost: "bg-transparent text-wood-700 hover:bg-wood-400/10",
};

export const buttonBaseClasses =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(buttonBaseClasses, buttonVariantClasses[variant], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
