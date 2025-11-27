/* eslint-disable @next/next/no-img-element */
'use client';



const models = [
  {
    title: 'Vuca EVO',
    description: 'Vuca EVO je špičková řada e-MTB a e-SUV kol s revolučním motorem Pinion integrovaným přímo v převodovce. Díky řemenovému pohonu a volitelné automatické převodovce jde o téměř bezúdržbová kola pro náročné terénní jezdce. Celoodpružené i hardtail modely využívají moderní čtyřčepové zavěšení a nabízejí stabilitu i výkon v jakémkoli terénu. Praktické doplňky jako integrované osvětlení z nich dělají ideální volbu pro dobrodružství i každodenní ježdění.',
    image: '/images/bulls-models/vuca-evo.jpg',
  },
  {
    title: 'Sonic SX',
    description: 'Lehká sportovní řada e-MTB s karbonovým rámem a motorem Bosch Performance Line SX. Zaměřená na maximálně přirozený pocit z jízdy, nízkou hmotnost a agilitu. Ideální pro sportovní trailové ježdění. Nabízí i verze s nízkým nástupem. Oproti Sonic EVO jde o lehčí, hravější volbu s menší dopomocí.',
    image: '/images/bulls-models/sonic-sx.jpg',
  },
  {
    title: 'Sonic EVO',
    description: 'Plnohodnotná e-MTB řada pro nejnáročnější terény. Masivní a chytrý rám Sonic E-Power Chassis, posed pro vysokou stabilitu a výkonné motory Bosch Performance Line CX. Určeno pro enduro, trail i XC. Oproti Sonic SX nabízí vyšší výkon, stabilitu a robustnost.',
    image: '/images/bulls-models/sonic-evo.jpg',
  },
  {
    title: 'Sturmvogel EVO',
    description: 'Stylová městská elektrokola s retro designem. Silný Bosch Performance Line CX, řemenový pohon a minimalistický monokokový rám. Extra široké pláště, přední světlo integrované do rámu (MonkeyLink) a TwinLight zadní světlo pro maximální bezpečnost. Pro jezdce, kteří chtějí styl, pohodlí a výkon.',
    image: '/images/bulls-models/sturmvogel-evo.jpg',
  },
  {
    title: 'Iconic EVO',
    description: '„SUV“ kategorie elektrokol: robustní, pohodlná a praktická. Silný motor Bosch CX Gen5, široké pláště Schwalbe, odpružení 120 mm a kompletní výbava pro město i terén. K dispozici hardtaily i full-suspension modely. Existují i varianty s karbonem a řemenem. Oproti Cross Lite EVO jsou více terénní a těžší.',
    image: '/images/bulls-models/iconic-evo.jpg',
  },
  {
    title: 'Copperhead EVO',
    description: 'Výborný poměr cena/výkon v kategorii e-MTB. Výkonný Bosch CX Gen5, kvalitní rám a moderní světla MonkeyLink. Verze jak trail–FS, tak hardtail. Výborné pro jezdce, kteří chtějí špičkovou technologii za dostupnější cenu. Varianta „Street“ nabízí plnou výbavu na silnici.',
    image: '/images/bulls-models/copperhead-evo.jpg',
  },
  {
    title: 'Cross Lite EVO',
    description: 'Trekkingová elektrokola pro každodenní ježdění i delší výlety. Kombinují sportovní charakter s komfortem a bezpečností. Velký výběr motorů (SX pro nízkou hmotnost, CX pro sílu), možnost ABS, řemenového pohonu, i klasické přehazovačky. Lehčí a silniční než Iconic EVO, ale stále zvládnou i neasfaltované cesty.',
  },
  {
    title: 'Grinder EVO',
    description: 'Elektrické gravel modely. Skvělé pro šotolinu, silnici i město. Některé verze sportovní s berany, jiné dobře vybavené pro trail (Trail Grinder). K dispozici i minimalistické flatbar modely s řemenem. Univerzální volba pro každého, kdo chce kombinovat rychlost, zábavu i výlety mimo asfalt.',
  },
  {
    title: 'Urban EVO',
    description: 'Moderní městská elektrokola s minimalistickým designem. FIT Bafang motor a baterie 520 Wh skvěle integrované do rámu. Elegantní detaily jako zadní světlo v sedlovce nebo displej zapuštěný v top tube. K dispozici i singlespeed verze s řemenem (Amsterdam). Pro jezdce, kteří chtějí čistý design a pohodlí ve městě.',
  },
  {
    title: 'EVO CX',
    description: 'Dostupná e-MTB řada pro začínající i rekreační jezdce. Bosch CX Gen5, odolný rám a solidní komponenty. Hardtaily i levnější full-suspension varianty. Oproti Copperhead/Sonic mají jednodušší výbavu, ale pořád nabízí plnohodnotný MTB zážitek za skvělou cenu.',
  },
  {
    title: 'EVA',
    description: 'Dámská řada vycházející z top modelů Sonic. Upravená geometrie pro ženy, nízká hmotnost, motory Bosch a kvalitní odpružení. V nabídce hardtaily i full-suspension. Nejde o zmenšené pánské modely, ale o samostatně navržené e-MTB pro ženy.',
  },
  {
    title: 'Tokee EVO',
    description: 'Elektrokola pro děti a mladé jezdce (cca 135–165 cm). Lehký motor Bosch SX, jisté ovládání a bezpečnost (zadní TwinLight, možnost MonkeyLink světlometu). Odolná vidlice, hydraulické brzdy a kvalitní pláště. Pro děti, které chtějí jezdit s dospělými bez limitů.',
  },
];

export default function BullsBikesPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">BULLS Modelové Řady</h1>
            <p className="mt-4 text-lg text-gray-500">
              Přehled modelových řad elektrokol BULLS pro rok 2025.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {models.map((model, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
                {/* Image Section */}
                <div className="bg-gray-100 border-b border-gray-100">
                  {model.image ? (
                    <img
                      src={model.image}
                      alt={model.title}
                      className="w-full h-auto block"
                    />
                  ) : (
                    <div className="h-56 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="mt-2 block text-sm font-medium">Foto připravujeme</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{model.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">
                    {model.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
