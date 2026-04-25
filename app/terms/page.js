import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <Link href="/" className="text-[#C8D8C0] hover:underline text-sm inline-block mb-6">
          ← Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold text-[#2A2A2A] mb-6">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 25, 2026</p>
        
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">1. Informational Use Only</h2>
            <p>HybridHunting does not sell, distribute, or manufacture any cannabis products. All information provided on this website is for educational and comparison purposes only. We are an informational directory and not a retail cannabis store.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">2. Age Restriction</h2>
            <p>You must be 21 years or older to access this website. By using this site, you confirm that you meet this age requirement. Any access by individuals under 21 is strictly prohibited and a violation of these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">3. Third-Party Information</h2>
            <p>Product prices, availability, and deal information are provided by third-party licensed dispensaries through Leafly.com. We do not guarantee the accuracy, completeness, or timeliness of any information displayed. Prices are subject to change without notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">4. No Liability</h2>
            <p>HybridHunting is not responsible for any transactions, agreements, or interactions between users and dispensaries. All purchases, returns, and disputes are solely between you and the licensed dispensary. We are not liable for any damages, injuries, or losses resulting from the use of this website or any products purchased through linked dispensaries.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">5. Compliance with Laws</h2>
            <p>This website operates in compliance with Nevada state law regarding adult-use cannabis. You are responsible for understanding and complying with all local, state, and federal laws regarding cannabis possession and use. Cannabis remains illegal under federal law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">6. External Links</h2>
            <p>Our website contains links to third-party dispensary websites. We are not responsible for the content, privacy practices, or accuracy of information on these external sites.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">7. No Medical Advice</h2>
            <p>Nothing on this website is intended to be medical advice. Always consult a physician or qualified healthcare provider before using cannabis products. Cannabis may interact with medications or worsen certain medical conditions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the website constitutes acceptance of any changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">9. Contact</h2>
            <p>If you have any questions about these terms, please contact us through our website.</p>
          </section>
        </div>
      </div>
    </div>
  )
}