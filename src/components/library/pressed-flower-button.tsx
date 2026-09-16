"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addPressedFlower, removePressedFlower } from "@/lib/actions/interactions";
import { Button } from "@/components/ui/button";

interface PressedFlowerButtonProps {
  bookId: string;
  initiallyActive: boolean;
  signedIn: boolean;
}

export function PressedFlowerButton({ bookId, initiallyActive, signedIn }: PressedFlowerButtonProps) {
  const [active, setActive] = useState(initiallyActive);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link href="/login" className="text-sm font-medium text-dusk-700 underline">
        Sign in to press a flower
      </Link>
    );
  }

  const toggle = () => {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const result = next ? await addPressedFlower(bookId) : await removePressedFlower(bookId);
      if (result.error) {
        setActive(!next);
      }
    });
  };

  return (
    <Button type="button" variant={active ? "primary" : "secondary"} onClick={toggle} disabled={isPending}>
      {active ? "🌸 Flower pressed" : "Press a flower"}
    </Button>
  );
}
