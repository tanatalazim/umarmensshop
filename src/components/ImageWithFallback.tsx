import React, { useState } from 'react';
import { Shirt, Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  categoryName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-[3/4]',
  categoryName = 'UMAR MENS',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // If no source provided or error occurred
  if (!src || error) {
    return (
      <div
        className={`relative ${aspectRatio} w-full bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden ${className}`}
      >
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
        
        {/* Brand watermark */}
        <div className="relative z-10 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
            <Shirt className="w-6 h-6 stroke-[1.5]" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono block">
            {categoryName}
          </span>
          <p className="text-xs font-semibold text-zinc-300 line-clamp-2 max-w-[180px]">
            {alt}
          </p>
          <span className="text-[9px] uppercase tracking-wider text-zinc-600 block pt-1 font-mono">
            Boutique Almaty
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${aspectRatio} w-full bg-zinc-100 overflow-hidden ${className}`}>
      {/* Shimmer skeleton while image is loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 animate-pulse" />
      )}

      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
