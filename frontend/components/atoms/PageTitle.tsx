interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div>
      <h1 style={{ color: "var(--foreground)", fontSize: "clamp(24px, 7vw, 32px)", fontWeight: 600, margin: 0, letterSpacing: "-0.03em" }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: "var(--muted-foreground)", margin: "clamp(2px, 1.5vw, 4px) 0 0", fontSize: "clamp(12px, 3vw, 14px)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
