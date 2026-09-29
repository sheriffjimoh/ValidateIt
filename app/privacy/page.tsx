export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 font-sans text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: September 29, 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            Welcome to ValidateIt (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Data We Collect</h2>
          <p>When you sign in or interact with our application using Google Authentication, we may collect the following information:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Identity Data:</strong> Your name and profile picture provided via your Google account.</li>
            <li><strong>Contact Data:</strong> Your email address.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
          <p>We use the data we collect for the following purposes:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>To create and manage your user account.</li>
            <li>To authenticate your identity and provide secure access to the application.</li>
            <li>To communicate with you regarding service updates or support.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Data Storage and Security</h2>
          <p>
            We implement appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. Your data is securely stored using industry-standard database infrastructure.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Google API Services User Data Policy (Limited Use)</h2>
          <p>
            ValidateIt&apos;s use and transfer of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google API Services User Data Policy</a>, including the <strong>Limited Use</strong> requirements.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
          </p>
          <p className="mt-2 font-medium">Email: sheriffjimoh88@gmail.com</p>
        </div>
      </section>
    </main>
  );
}