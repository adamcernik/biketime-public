import Link from 'next/link';
import FeaturedBikes from '@/components/FeaturedBikes';
import HeroCarousel from '@/components/HeroCarousel';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <HeroCarousel
        images={[
          { src: '/ZEG_525900080644_Mode_002.jpg', alt: 'Biketime hero 1' },
          { src: '/ZEG_525803760447_Mode_001.jpg', alt: 'Biketime hero 2' },
          { src: '/ZEG_524901240440_mood_7.jpg', alt: 'Biketime hero 3' },
        ]}
        title="BULLS SONIC EN-R TEAM"
        subtitle="Bosch Performance Line CX-RACE GEN5 (Smart System) 25/100 Nm, 600 Wh"
        ctaHref="/catalog/525900080644"
        ctaLabel="Zobrazit detail"
      />

      <FeaturedBikes />

      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 grid gap-6">
          <h2 className="text-2xl md:text-3xl font-bold">BikeTime – váš partner pro kola BULLS už 10 let</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed max-w-3xl">
            <p>
              Jsme oficiální dovozce kol a elektrokol BULLS pro Českou republiku a Slovensko.
              Už deset let pomáháme cykloprodejnám rozšiřovat nabídku o prémiová německá kola,
              která kombinují technologii, spolehlivost a výkon.
            </p>
            <p>
              Naším cílem je být spolehlivým partnerem, ne jen dodavatelem. Zajišťujeme kompletní servis –
              od objednávek a logistiky, přes technickou podporu, až po marketingové materiály pro váš prodej.
            </p>
            <p>
              Pokud hledáte jistotu v kvalitě, dostupnosti i komunikaci, BULLS od Biketime je správná volba.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/catalog" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-black text-white hover:bg-gray-800 shadow-sm">
              👉 Prohlédněte si aktuální katalog kol BULLS
            </Link>
            <Link href="/kontakt" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm">
              👉 Staňte se partnerskou prodejnou
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
