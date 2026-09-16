export function CrisisResourceNotice() {
  return (
    <div className="rounded-md border border-burgundy-500/40 bg-burgundy-500/10 p-4">
      <p className="text-sm font-medium text-burgundy-700">
        If you&apos;re in crisis or thinking about suicide, please reach out to someone
        who can help right now.
      </p>
      <ul className="mt-2 space-y-1 text-sm text-wood-700">
        <li>
          In the US: call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline),
          available 24/7.
        </li>
        <li>
          Text <strong>HOME</strong> to <strong>741741</strong> (Crisis Text Line).
        </li>
        <li>If you&apos;re in immediate danger, please contact emergency services.</li>
      </ul>
      <p className="mt-2 text-xs text-wood-500">
        Between the Pages is a peer reflection space, not therapy or emergency support,
        and no one here is monitoring in real time. These resources are US-based; if
        you&apos;re elsewhere, please reach out to a local service or someone you trust.
      </p>
    </div>
  );
}
