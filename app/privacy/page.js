import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <Link href="/" className="text-[#C8D8C0] hover:underline text-sm inline-block mb-6">
          ← Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold text-[#2A2A2A] mb-6">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 25, 2026</p>
        
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Account Information:</strong> When you create an account, we collect your email address and saved favorites.</li>
              <li><strong>Location Information:</strong> With your permission, we collect your approximate location to show nearby dispensaries.</li>
              <li><strong>Usage Data:</strong> We collect information about how you use our website (pages viewed, searches, filters applied).</li>
              <li><strong>Device Information:</strong> We collect browser type, IP address, and device type for analytics purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Provide and improve our price comparison service</li>
              <li>Save your favorite products and preferences</li>
              <li>Show you relevant deals based on your location</li>
              <li>Analyze site usage to improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share anonymized, aggregated data with third parties for analytical purposes. We do not share your location, favorites, or account information with dispensaries unless you explicitly choose to contact them.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">4. Cookies</h2>
            <p>We use cookies to remember your preferences (location, filters, age verification) and to analyze site traffic. You can disable cookies in your browser settings, but some features may not work properly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Supabase:</strong> For database and authentication</li>
              <li><strong>Vercel:</strong> For hosting and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">6. Data Security</h2>
            <p>We implement reasonable security measures to protect your information. However, no internet transmission is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your account information. You can do this through your account settings or by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">8. Children's Privacy</h2>
            <p>Our website is not intended for individuals under 21. We do not knowingly collect information from minors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">9. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Continued use of the website constitutes acceptance of any changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2A2A2A] mb-3">10. Contact</h2>
            <p>If you have questions about this privacy policy, please contact us through our website.</p>
          </section>
        </div>
      </div>
    </div>
  )
}