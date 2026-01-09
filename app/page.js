export default function Home() {
  const categories = [
    { bg: 'bg-[#C9D8BE]', label: 'Flower', emoji: '🍁' },
    { bg: 'bg-[#F8E5CB]', label: 'Edibles', emoji: '🍬' },
    { bg: 'bg-[#E4AD85]', label: 'Vapes', emoji: '💨' },
    { bg: 'bg-[#E2CDB7]', label: 'Concentrates', emoji: '💧' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* --- 1. NAVIGATION --- */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="text-2xl font-bold text-[#2A2A2A]">HybridHunting</div>
        <div className="flex space-x-6">
          <a href="#" className="text-[#2A2A2A] hover:underline">Deals</a>
          <a href="#" className="text-[#2A2A2A] hover:underline">How It Works</a>
          <a href="#" className="text-[#2A2A2A] hover:underline">About</a>
        </div>
      </nav>

      {/* --- 2. HERO SECTION with Warm Cream Background --- */}
      <section className="bg-[#FCF0E4] px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* The main green box */}
          <div className="bg-[#C8D8C0] rounded-3xl p-10 mb-12 text-center">
            <h1 className="text-4xl font-bold text-[#2A2A2A] mb-4">
              Hunt for the best dispensary deals
            </h1>
            <p className="text-xl text-[#2A2A2A] mb-8">Compare prices and save instantly.</p>
            <button className="bg-[#EDBD8F] text-[#2A2A2A] font-bold px-10 py-4 rounded-2xl text-lg hover:opacity-90">
              Find Deals
            </button>
          </div>

          {/* The four vertical rectangles BELOW the green box - in a SINGLE COLUMN */}
          <div className="space-y-6 max-w-2xl mx-auto">
            {categories.map((item) => (
              <div
                key={item.label}
                className={`${item.bg} rounded-2xl p-8 flex items-center`}
              >
                {/* Icon/Image placeholder on LEFT */}
                <div className="text-5xl mr-8">{item.emoji}</div>
                {/* Text on RIGHT */}
                <div>
                  <h3 className="text-2xl font-bold text-[#2A2A2A]">{item.label}</h3>
                  <p className="text-[#2A2A2A] mt-2">Browse the best deals on {item.label.toLowerCase()}.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 3. "ELEVATE & RELAX" Terracotta Section --- */}
      <section className="bg-[#EDBD8F] px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#2A2A2A] mb-6">Elevate & Relax</h2>
          <p className="text-xl text-[#2A2A2A] mb-12">
            Discover curated products to match your vibe.
          </p>
          {/* Single product placeholder - one column */}
          <div className="bg-white/40 rounded-3xl p-10 max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🌿</div>
            <h3 className="text-3xl font-bold text-[#2A2A2A] mb-4">Featured Product</h3>
            <p className="text-[#2A2A2A] text-lg">A premium selection to help you unwind.</p>
          </div>
        </div>
      </section>

      {/* --- 4. FOOTER with Light Peach Background --- */}
      <footer className="bg-[#F5D9C0] px-6 py-16 rounded-t-3xl">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#2A2A2A] mb-10">Ready to start hunting?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-8 mb-12">
            <a href="#" className="text-xl text-[#2A2A2A] hover:underline">Deals</a>
            <a href="#" className="text-xl text-[#2A2A2A] hover:underline">How It Works</a>
            <a href="#" className="text-xl text-[#2A2A2A] hover:underline">About</a>
            <a href="#" className="text-xl text-[#2A2A2A] hover:underline">Contact</a>
          </div>
          <button className="bg-[#C8D8C0] text-[#2A2A2A] font-bold px-12 py-4 rounded-2xl text-xl hover:opacity-90">
            Find Deals
          </button>
          <p className="mt-12 text-[#2A2A2A]">
            © 2024 HybridHunting. For legal use in Nevada. Consume responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}