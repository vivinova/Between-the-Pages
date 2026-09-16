"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addNeededThis, removeNeededThis } from "@/lib/actions/interactions";
import { Button } from "@/components/ui/button";

interface NeededThisButtonProps {
  bookId: string;
  initiallyActive: boolean;
  signedIn: boolean;
}

export function NeededThisButton({ bookId, initiallyActive, signedIn }: NeededThisButtonProps) {
  const [active, setActive] = useState(initiallyActive);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link href="/login" className="text-sm font-medium text-dusk-700 underline">
        Sign in to say this was needed
      </Link>
    );
  }

  const toggle = () => {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const result = next ? await addNeededThis(bookId) : await removeNeededThis(bookId);
      if (result.error) {
        setActive(!next);
      }
    });
  };

  return (
    <Button type="button" variant={active ? "primary" : "secondary"} onClick={toggle} disabled={isPending}>
      {active ? "This was needed" : "I needed this"}
    </Button>
  );
}
