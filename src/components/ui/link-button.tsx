import Link, { type LinkProps } from "next/link";
import clsx from "clsx";
import { buttonBaseClasses, buttonVariantClasses, type ButtonVariant } from "@/components/ui/button";

interface LinkButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    LinkProps {
  variant?: ButtonVariant;
}

/**
 * A link styled like a Button, rendered as a single <a> — not a <button>
 * nested inside a <Link>. That nested-interactive-element pattern is
 * invalid HTML and a real accessibility failure (confuses keyboard nav and
 * screen readers, and trips axe-core's target-size check besides), so this
 * component exists specifically to replace `<Link href={...}><Button>` —
 * never reintroduce that pattern.
 */
export function LinkButton({ className, variant = "primary", ...props }: LinkButtonProps) {
  return (
    <Link
      className={clsx(buttonBaseClasses, buttonVariantClasses[variant], className)}
      {...props}
    />
  );
}
