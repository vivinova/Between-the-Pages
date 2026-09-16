"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Field } from "@/components/ui/field";
import { CrisisResourceNotice } from "@/components/support/crisis-resource-notice";
import { checkForPossiblePii } from "@/lib/moderation/pii";
import { checkForCrisisLanguage } from "@/lib/moderation/crisis";
import { saveMyConfession } from "@/lib/my-confessions";
import {
  submitConfessionSchema,
  type SubmitConfessionInput,
} from "@/lib/validation/confessions";
import { submitConfession, deleteMyConfession } from "@/lib/actions/confessions";

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface SubmitSuccess {
  id: string;
  state: "published" | "pending_review";
  ownerToken: string;
  bodyText: string;
  categoryName: string;
}

export function ConfessForm({ categories }: { categories: Category[] }) {
  const [result, setResult] = useState<SubmitSuccess | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubmitConfessionInput>({
    resolver: zodResolver(submitConfessionSchema),
    defaultValues: { categoryId: "", bodyText: "", emailOptIn: false, contactEmail: "" },
  });

  const bodyText = watch("bodyText") ?? "";
  const emailOptIn = watch("emailOptIn");
  const hasPossiblePii = checkForPossiblePii(bodyText).hasPossibleMatch;
  const hasCrisisLanguage = checkForCrisisLanguage(bodyText);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const category = categories.find((c) => c.id === data.categoryId);
    const response = await submitConfession(data);
    if (!response.ok) {
      setSubmitError(response.error);
      return;
    }
    saveMyConfession(response.id, response.ownerToken);
    setResult({
      id: response.id,
      state: response.state,
      ownerToken: response.ownerToken,
      bodyText: data.bodyText,
      categoryName: category?.name ?? "",
    });
  });

  const handleDelete = async () => {
    if (!result) return;
    setDeleting(true);
    const response = await deleteMyConfession({
      confessionId: result.id,
      ownerToken: result.ownerToken,
    });
    setDeleting(false);
    if (response.ok) {
      setDeleted(true);
    }
  };

  if (result) {
    if (deleted) {
      return (
        <div className="rounded-md border border-wood-400/30 bg-cream-50 p-6 text-center">
          <p className="text-wood-700">Your confession has been deleted.</p>
          <LinkButton href="/confess" variant="secondary" className="mt-4">
            Leave another
          </LinkButton>
        </div>
      );
    }

    return (
      <div className="rounded-md border border-wood-400/30 bg-cream-50 p-6">
        <p className="font-medium text-wood-900">
          {result.state === "published"
            ? "Your confession is live."
            : "Your confession is awaiting review."}
        </p>
        <p className="mt-1 text-sm text-wood-600">
          {result.state === "published"
            ? `It's now published under ${result.categoryName}.`
            : "It contained something that needs a quick human look before it publishes — it'll appear in its category once approved."}
        </p>
        <blockquote className="mt-4 whitespace-pre-wrap border-l-2 border-wood-400/40 pl-4 font-serif text-wood-800">
          {result.bodyText}
        </blockquote>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {result.state === "published" ? (
            <LinkButton href={`/confessions/${result.id}`} variant="primary">
              View it
            </LinkButton>
          ) : null}
          <Button type="button" variant="ghost" disabled={deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete this confession"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-wood-500">
          This delete option only works in this browser. There&apos;s no account and no
          other way to prove this confession is yours, so if you clear your browser data
          you won&apos;t be able to delete it later.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium text-wood-700">
          Category
        </label>
        <select
          id="categoryId"
          className="rounded-md border border-wood-400/40 bg-cream-50 px-3 py-2 text-wood-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk-600"
          {...register("categoryId")}
        >
          <option value="">Choose a category…</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <p role="alert" className="text-sm text-burgundy-600">
            {errors.categoryId.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bodyText" className="text-sm font-medium text-wood-700">
          Your confession
        </label>
        <textarea
          id="bodyText"
          rows={8}
          className="rounded-md border border-wood-400/40 bg-cream-50 px-3 py-2 text-wood-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk-600"
          {...register("bodyText")}
        />
        <div className="flex items-center justify-between text-xs text-wood-500">
          <span>{bodyText.length} / 3000</span>
        </div>
        {errors.bodyText ? (
          <p role="alert" className="text-sm text-burgundy-600">
            {errors.bodyText.message}
          </p>
        ) : null}
      </div>

      {hasPossiblePii ? (
        <p className="rounded-md border border-burgundy-500/40 bg-burgundy-500/10 p-3 text-sm text-burgundy-700">
          This looks like it might include a name, email, phone number, or other
          identifying detail. This board is anonymous — you may want to remove it.
        </p>
      ) : null}

      {hasCrisisLanguage ? <CrisisResourceNotice /> : null}

      <div className="flex flex-col gap-2 rounded-md border border-wood-400/30 bg-cream-50 p-4">
        <label className="flex items-center gap-2 text-sm text-wood-700">
          <input type="checkbox" className="h-4 w-4" {...register("emailOptIn")} />
          Email me if someone interacts with this confession
        </label>
        <p className="text-xs text-wood-500">
          Optional. We&apos;ll only use this for occasional updates about this confession
          — never shown publicly, never sold.
        </p>
        {emailOptIn ? (
          <Field
            label="Email address"
            type="email"
            error={errors.contactEmail?.message}
            {...register("contactEmail")}
          />
        ) : null}
      </div>

      {submitError ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Leave this confession"}
      </Button>
    </form>
  );
}
