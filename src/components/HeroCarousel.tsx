'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type HeroCarouselProps = {
  images: { src: string; alt: string }[];
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
};

export default function HeroCarousel({ images, title, subtitle, ctaHref, ctaLabel }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden bg-zinc-900">
      {/* Slides */}
      <div className="absolute inset-0">
        {images.map((img, i) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== index}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover object-center"
              priority={i === 0}
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container-custom text-white">
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-zinc-200 font-light max-w-2xl leading-relaxed">
              {subtitle}
            </p>
            <div className="pt-4">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-primary hover:bg-red-700 rounded-full transition-all duration-300 shadow-lg hover:shadow-red-900/20 transform hover:-translate-y-1"
              >
                {ctaLabel}
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-0 w-full">
        <div className="container-custom flex gap-3">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-12 bg-primary' : 'w-6 bg-white/30 hover:bg-white/50'
                }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


