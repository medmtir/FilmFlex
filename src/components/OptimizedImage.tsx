import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
}

export default function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 75,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`bg-neutral-800 flex items-center justify-center ${className}`}>
        <span className="text-neutral-500 text-xs">Image not available</span>
      </div>
    );
  }

  return (
    <div className={fill ? `absolute inset-0 ${className}` : `relative ${className}`}>
      {!isLoaded && !fill && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${fill ? 'w-full h-full' : ''}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        unoptimized={src.startsWith('http') && !src.includes('images.unsplash.com') && !src.includes('images.metahub.space') && !src.includes('image.tmdb.org')}
      />
    </div>
  );
}