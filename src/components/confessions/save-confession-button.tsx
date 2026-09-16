"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isSaved, saveConfession, unsaveConfession } from "@/lib/saved-confessions";

export function SaveConfessionButton({
  confessionId,
  preview,
}: {
  confessionId: string;
  preview: string;
}) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Checked after mount, same reasoning as DeleteConfessionButton — avoids
  // a server/client render mismatch, since localStorage doesn't exist on
  // the server.
  useEffect(() => {
    setSaved(isSaved(confessionId));
    setMounted(true);
  }, [confessionId]);

  if (!mounted) return null;

  const toggle = () => {
    if (saved) {
      unsaveConfession(confessionId);
      setSaved(false);
    } else {
      saveConfession(confessionId, preview);
      setSaved(true);
    }
  };

  return (
    <Button type="button" variant="ghost" onClick={toggle}>
      {saved ? "Saved" : "Save for later"}
    </Button>
  );
}
