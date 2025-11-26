import Link from 'next/link';
import Image from 'next/image';
import FeaturedBikes from '@/components/FeaturedBikes';
import HeroCarousel, { CarouselSlide } from '@/components/HeroCarousel';
import ShopsMap from '@/components/ShopsMap';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Revalidate every hour
export const revalidate = 3600;

async function getSlides() {
  try {
    const q = query(collection(db, 'carousel_slides'), where('isVisible', '==', true));
    const snapshot = await getDocs(q);
    const slides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarouselSlide));
    // Sort by order (asc) or createdAt (desc) if order is missing
    return slides.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  } catch (error) {
    console.error('Error fetching slides:', error);
    return [];
  }
}

export default async function Home() {
  const slides = await getSlides();

  return (
    <main className="min-h-screen bg-white">
      <HeroCarousel slides={slides} />

      {/* Categories Grid */}
      <section className="py-16 bg-zinc-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/catalog?category=Celopéra&ebike=true" className="group relative h-[300px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <Image src="/ZEG_525900080644_Mode_002.jpg" alt="E-MTB" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-2xl font-bold text-white mb-2">E-MTB</h3>
                <span className="text-zinc-300 text-sm group-hover:text-white transition-colors flex items-center">
                  Prozkoumat kategorii
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
            <Link href="/catalog?category=Gravel" className="group relative h-[300px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <Image src="/ZEG_525803760447_Mode_001.jpg" alt="Gravel" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Gravel & Road</h3>
                <span className="text-zinc-300 text-sm group-hover:text-white transition-colors flex items-center">
                  Prozkoumat kategorii
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
            <Link href="/prislusenstvi" className="group relative h-[300px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <Image src="/ZEG_524901240440_mood_7.jpg" alt="Příslušenství" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Příslušenství</h3>
                <span className="text-zinc-300 text-sm group-hover:text-white transition-colors flex items-center">
                  Vybavit se
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <FeaturedBikes />

      {/* USP / About Section */}
      <section className="section-padding bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Biketime – váš partner pro kola <span className="text-primary">BULLS</span> už 10 let
              </h2>
              <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                <p>
                  Jsme oficiální dovozce kol a elektrokol BULLS pro Českou republiku a Slovensko.
                  Už deset let pomáháme cykloprodejnám rozšiřovat nabídku o prémiová německá kola,
                  která kombinují technologii, spolehlivost a výkon.
                </p>
                <p>
                  Naším cílem je být spolehlivým partnerem, ne jen dodavatelem. Zajišťujeme kompletní servis –
                  od objednávek a logistiky, přes technickou podporu, až po marketingové materiály pro váš prodej.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/catalog" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20">
                  Prohlédnout katalog
                </Link>
                <Link href="/kontakt" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 backdrop-blur-sm transition-colors border border-white/10">
                  Staňte se partnerem
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Oficiální distribuce</h3>
                <p className="text-zinc-400">Přímý dovozce a garant kvality pro ČR a SK.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Prémiová kvalita</h3>
                <p className="text-zinc-400">Německá technologie a špičkové komponenty.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Servisní podpora</h3>
                <p className="text-zinc-400">Kompletní technické zázemí a náhradní díly.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">10 let na trhu</h3>
                <p className="text-zinc-400">Stabilní partner s dlouholetou zkušeností.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Shops Map Section */}
      <section className="bg-white">
        <ShopsMap height="600px" className="w-full" />
      </section>
    </main>
  );
}
