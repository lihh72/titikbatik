"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";

type RevealProps<T extends keyof HTMLElementTagNameMap> = HTMLMotionProps<T> & {
  children: ReactNode;
  delay?: number;
};

const revealEase = [0.16, 1, 0.3, 1] as const;

function useReveal(delay = 0) {
  const reduceMotion = useReducedMotion();

  return {
    initial: reduceMotion ? false : { opacity: 0, y: 34, scale: 0.985 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, amount: 0.24 },
    transition: { duration: 0.72, delay, ease: revealEase },
  };
}

export function MotionDiv({ children, delay, ...props }: RevealProps<"div">) {
  return (
    <motion.div {...props} {...useReveal(delay)}>
      {children}
    </motion.div>
  );
}

export function MotionSection({ children, delay, ...props }: RevealProps<"section">) {
  return (
    <motion.section {...props} {...useReveal(delay)}>
      {children}
    </motion.section>
  );
}

export function MotionArticle({ children, delay, ...props }: RevealProps<"article">) {
  return (
    <motion.article {...props} {...useReveal(delay)}>
      {children}
    </motion.article>
  );
}

export function MotionFigure({ children, delay, ...props }: RevealProps<"figure">) {
  return (
    <motion.figure {...props} {...useReveal(delay)}>
      {children}
    </motion.figure>
  );
}
