"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ContentWarningGateProps {
  labelNames: string[];
  children: React.ReactNode;
}

export function ContentWarningGate({ labelNames, children }: ContentWarningGateProps) {
  const [revealed, setRevealed] = useState(labelNames.length === 0);

  if (revealed) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-lg border border-burgundy-500/40 bg-burgundy-500/10 p-6 text-center">
      <p className="font-serif text-lg text-wood-900">This passage is labeled:</p>
      <p className="mt-2 text-burgundy-700">{labelNames.join(", ")}</p>
      <p className="mt-4 text-sm text-wood-600">
        You can change which topics you see warnings for in Settings.
      </p>
      <Button type="button" className="mt-4" onClick={() => setRevealed(true)}>
        Continue
      </Button>
    </div>
  );
}
