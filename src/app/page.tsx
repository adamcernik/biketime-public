import Link from 'next/link';
import Image from 'next/image';
import FeaturedBikes from '@/components/FeaturedBikes';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="relative">
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/ZEG_525900080644_Mode_002.jpg"
            alt="Biketime hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-[146px] relative text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">BULLS SONIC EN-R TEAM</h1>
          <p className="text-lg max-w-2xl mb-6">Bosch Performance Line CX-RACE GEN5 (Smart System) 25/100 Nm, 600 Wh</p>
          <Link href="/catalog/525900080644" className="inline-block bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-100">Zobrazit detail</Link>
        </div>
      </section>

      <FeaturedBikes />
    </main>
  );
}
