"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CrisisResourceNotice } from "@/components/support/crisis-resource-notice";
import { checkForPossiblePii } from "@/lib/moderation/pii";
import { checkForCrisisLanguage } from "@/lib/moderation/crisis";
import { submitReplySchema } from "@/lib/validation/interactions";
import { submitReply } from "@/lib/actions/interactions";

interface ReplyFormValues {
  bodyText: string;
}

export function ReplyForm({ confessionId }: { confessionId: string }) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyFormValues>({
    resolver: zodResolver(submitReplySchema.omit({ confessionId: true })),
    defaultValues: { bodyText: "" },
  });

  const bodyText = watch("bodyText") ?? "";
  const hasPossiblePii = checkForPossiblePii(bodyText).hasPossibleMatch;
  const hasCrisisLanguage = checkForCrisisLanguage(bodyText);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    setNotice(null);
    const result = await submitReply({ confessionId, bodyText: data.bodyText });
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    reset({ bodyText: "" });
    if (result.state === "published") {
      setNotice("Your reply is live.");
      router.refresh();
    } else {
      setNotice("Your reply needs a quick review before it's shown — check back soon.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="reply-body" className="text-sm font-medium text-wood-700">
        Leave a reply
      </label>
      <textarea
        id="reply-body"
        rows={3}
        placeholder="Anonymous, like everything else here."
        className="rounded-md border border-wood-400/40 bg-cream-50 px-3 py-2 text-wood-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk-600"
        {...register("bodyText")}
      />
      <div className="flex items-center justify-between text-xs text-wood-500">
        <span>{bodyText.length} / 500</span>
      </div>
      {errors.bodyText ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {errors.bodyText.message}
        </p>
      ) : null}

      {hasPossiblePii ? (
        <p className="rounded-md border border-burgundy-500/40 bg-burgundy-500/10 p-3 text-sm text-burgundy-700">
          This looks like it might include a name, email, phone number, or other
          identifying detail. This board is anonymous — you may want to remove it.
        </p>
      ) : null}

      {hasCrisisLanguage ? <CrisisResourceNotice /> : null}

      {submitError ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {submitError}
        </p>
      ) : null}
      {notice ? <p className="text-sm text-forest-700">{notice}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Sending…" : "Reply"}
      </Button>
    </form>
  );
}
