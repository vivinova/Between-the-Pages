"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getMyConfessionToken, forgetMyConfession } from "@/lib/my-confessions";
import { deleteMyConfession } from "@/lib/actions/confessions";

export function DeleteConfessionButton({ confessionId }: { confessionId: string }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // localStorage is only available client-side — check after mount rather
  // than during render, so this never disagrees with the server-rendered
  // markup.
  useEffect(() => {
    setToken(getMyConfessionToken(confessionId));
  }, [confessionId]);

  if (!token) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    const result = await deleteMyConfession({ confessionId, ownerToken: token });
    setDeleting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    forgetMyConfession(confessionId);
    router.push("/categories");
  };

  return (
    <div className="mt-6 border-t border-wood-400/20 pt-4">
      <p className="text-xs text-wood-500">You submitted this confession from this browser.</p>
      <Button
        type="button"
        variant="ghost"
        disabled={deleting}
        onClick={handleDelete}
        className="mt-1"
      >
        {deleting ? "Deleting…" : "Delete this confession"}
      </Button>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
