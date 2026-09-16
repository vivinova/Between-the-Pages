export const REPORT_REASONS = [
  { value: "harassment", name: "Harassment or targeting a specific person" },
  { value: "hate_speech", name: "Hate speech or discrimination" },
  { value: "graphic_content", name: "Graphic or violent content" },
  { value: "personal_information", name: "Contains someone's personal information" },
  { value: "dangerous_advice", name: "Dangerous instructions or advice" },
  { value: "immediate_safety_concern", name: "Someone may be in immediate danger" },
  { value: "spam", name: "Spam or advertising" },
  { value: "other", name: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export const REPORT_REASON_VALUES = REPORT_REASONS.map((r) => r.value) as [
  ReportReason,
  ...ReportReason[],
];
