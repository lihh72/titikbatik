type LogoMarkProps = {
  decorative?: boolean;
};

export function LogoMark({ decorative = false }: LogoMarkProps) {
  return (
    <span
      className="logo-mark"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "TitikBatik AI"}
      aria-hidden={decorative || undefined}
    >
      <i />
      <i />
    </span>
  );
}
