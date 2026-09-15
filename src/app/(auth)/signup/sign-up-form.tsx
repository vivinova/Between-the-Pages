"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validation/auth";
import { signUp } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function SignUpForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { ageConfirmed: undefined },
  });

  const onSubmit = (values: SignUpInput) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signUp(values);
      if (result?.error) {
        setFormError(result.error);
      }
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
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="flex items-start gap-2">
        <input
          id="ageConfirmed"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-wood-400/60 text-forest-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dusk-600"
          {...register("ageConfirmed")}
        />
        <label htmlFor="ageConfirmed" className="text-sm text-wood-700">
          I confirm that I am 18 years of age or older.
        </label>
      </div>
      {errors.ageConfirmed ? (
        <p role="alert" className="-mt-2 text-sm text-burgundy-600">
          {errors.ageConfirmed.message}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
