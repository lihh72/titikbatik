import Image from "next/image";

type LogoMarkProps = {
  decorative?: boolean;
  size?: number;
};

export function LogoMark({ decorative = false, size = 36 }: LogoMarkProps) {
  return (
    <span
      className="logo-mark inline-grid shrink-0 place-items-center overflow-hidden rounded-full"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "TitikBatik AI"}
      aria-hidden={decorative || undefined}
    >
      <Image
        src="/logoo.png"
        alt={decorative ? "" : "TitikBatik AI"}
        width={size}
        height={size}
        className="block h-auto w-auto"
        priority
      />
    </span>
  );
}
