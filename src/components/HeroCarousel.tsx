'use client';

import { useState } from 'react';
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

  return (
    <section className="relative min-h-[420px]">
      {/* Slides */}
      <div className="absolute inset-0">
        {images.map((img, i) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-500 ${i === index ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== index}
          >
            <Image src={img.src} alt={img.alt} fill className="object-cover" priority={i === 0} />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </div>

      {/* Overlay content */}
      <div className="max-w-6xl mx-auto px-4 py-[146px] relative text-white">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{title}</h1>
        <p className="text-lg max-w-2xl mb-6">{subtitle}</p>
        <Link href={ctaHref} className="inline-block bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-100">
          {ctaLabel}
        </Link>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/60 hover:bg-white/80'}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}


