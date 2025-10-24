export default function SiteFooter() {
  return (
    <footer className="bg-gray-100 shadow-inner mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-600">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} Biketime. Všechna práva vyhrazena.
          </div>
          <div className="flex gap-4">
            <a className="hover:underline" href="#">Ochrana osobních údajů</a>
            <a className="hover:underline" href="#">Cookies</a>
            <a className="hover:underline" href="#">Obchodní podmínky</a>
          </div>
        </div>
      </div>
    </footer>
  );
}



