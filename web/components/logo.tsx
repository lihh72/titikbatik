import Image from "next/image";

type LogoMarkProps = {
  decorative?: boolean;
  size?: number;
};

export function LogoMark({ decorative = false, size = 36 }: LogoMarkProps) {
  return (
    <span
      className="logo-mark"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "TitikBatik AI"}
      aria-hidden={decorative || undefined}
    >
      <Image
        src="/logoo.png"
        alt={decorative ? "" : "TitikBatik AI"}
        width={size}
        height={size}
        priority
      />
    </span>
  );
}