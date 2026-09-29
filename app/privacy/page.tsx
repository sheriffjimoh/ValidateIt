export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 font-sans text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: September 29, 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            Welcome to ValidateIt (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and share your information when you use our web application and services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p>When you register, sign in, or interact with ValidateIt using Google Authentication, we collect specific information to provide and secure our service, including:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Identity Data:</strong> Your full name and profile picture associated with your Google account.</li>
            <li><strong>Contact Data:</strong> Your email address.</li>
            <li><strong>Authentication &amp; Token Data:</strong> OAuth tokens and permissions granted by you to authenticate your session.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <p>We use the data we collect for the following operational purposes:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>To create, manage, and secure your user account.</li>
            <li>To authenticate your identity and provide authorized access to the application features.</li>
            <li>To communicate essential service updates, security alerts, and customer support responses.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Data Storage, Security, and Retention</h2>
          <p>
            We implement robust technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Your data is stored securely using encrypted cloud database infrastructure. We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy or to comply with legal obligations. You may request account deletion at any time to purge your data.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Data Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or rent your personal data to third parties. We may share information only with trusted cloud hosting and infrastructure providers who assist us in operating our platform, under strict confidentiality agreements, or when required by law.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Google API Services User Data Policy (Limited Use Disclosure)</h2>
          <p>
            ValidateIt&apos;s use and transfer of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google API Services User Data Policy</a>, including the <strong>Limited Use</strong> requirements. Information received from Google APIs is not used to develop, improve, or train generalized AI/ML models.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Your Data Protection Rights</h2>
          <p>
            You have the right to access, update, or request the deletion of your personal data stored by ValidateIt at any time. 
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2 font-medium">Email: sheriffjimoh88@gmail.com</p>
        </div>
      </section>
    </main>
  );
}