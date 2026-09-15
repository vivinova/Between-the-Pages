"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "@/lib/validation/auth";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function RequestResetForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
  });

  if (submitted) {
    return (
      <p className="text-sm text-wood-700">
        If an account exists for that email, a reset link is on its way.
      </p>
    );
  }

  const onSubmit = (values: RequestPasswordResetInput) => {
    startTransition(async () => {
      await requestPasswordReset(values);
      setSubmitted(true);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
