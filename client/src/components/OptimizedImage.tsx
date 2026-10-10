import type { ImgHTMLAttributes } from "react";
import variants from "./imageVariants.json";
export default function OptimizedImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const variant = (variants as Record<string, { src: string; srcSet: string }>)[props.src || ""];
  if (!variant) return <img decoding="async" {...props} />;
  return <picture className="contents"><source type="image/webp" srcSet={variant.srcSet} sizes={props.sizes || "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 440px"} /><img decoding="async" {...props} /></picture>;
}
