"use client"

import { Card, CardContent } from "@/components/ui/card"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="pt-8 prose prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="text-muted-foreground mb-6">
              Last Updated: {new Date().toLocaleDateString()}
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-foreground mb-4">
                  NeuronNook ("we", "us", "our", or "Service") is committed to protecting your
                  privacy. This Privacy Policy explains how we collect, use, disclose, and
                  safeguard your information when you visit our website and use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                <p className="text-foreground mb-4">
                  We collect information you voluntarily provide and information collected
                  automatically:
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-4">Voluntarily Provided Information:</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4 mb-4">
                  <li>Account credentials (email address, name)</li>
                  <li>OAuth tokens from Google and Microsoft accounts</li>
                  <li>Information from your Gmail, Google Drive, Google Photos, and OneDrive</li>
                  <li>Contact information</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-4">Automatically Collected Information:</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4 mb-4">
                  <li>Log files and usage data</li>
                  <li>Device information (browser type, IP address)</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Analytics data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="text-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Authenticate your account and verify your identity</li>
                  <li>Categorize and organize your emails, files, and photos using AI</li>
                  <li>Send administrative communications</li>
                  <li>Comply with legal obligations</li>
                  <li>Monitor and analyze usage trends and patterns</li>
                  <li>Detect and prevent fraudulent transactions and security incidents</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p className="text-foreground mb-4">
                  NeuronNook uses industry-standard security measures to protect your personal
                  information. However, no method of transmission over the Internet or electronic
                  storage is 100% secure. While we strive to use commercially acceptable means to
                  protect your personal information, we cannot guarantee its absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
                <p className="text-foreground mb-4">
                  We use third-party services to provide features and functionality:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4 mb-4">
                  <li>
                    <strong>Google Services:</strong> Gmail, Google Drive, Google Photos, Google
                    Cloud
                  </li>
                  <li>
                    <strong>Microsoft Services:</strong> Microsoft Azure, OneDrive, Outlook
                  </li>
                  <li>
                    <strong>AI Services:</strong> Google Gemini AI for content analysis and
                    categorization
                  </li>
                  <li>
                    <strong>Database:</strong> MongoDB for data storage
                  </li>
                </ul>
                <p className="text-foreground mt-4">
                  These services have their own privacy policies, and we encourage you to review
                  them. NeuronNook is not responsible for the privacy practices of these
                  third-party services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. OAuth and Connected Accounts</h2>
                <p className="text-foreground mb-4">
                  When you connect your Google or Microsoft account to NeuronNook, we request
                  specific permissions to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4 mb-4">
                  <li>Read your email messages</li>
                  <li>Access your Google Drive and OneDrive files</li>
                  <li>View your Google Photos library</li>
                  <li>Send emails on your behalf (with your explicit approval)</li>
                </ul>
                <p className="text-foreground mt-4">
                  You can revoke these permissions at any time through your Google or Microsoft
                  account settings. Revoking access will prevent us from accessing your data, but
                  may limit the functionality of NeuronNook.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. AI Processing and Analysis</h2>
                <p className="text-foreground mb-4">
                  NeuronNook uses AI services (Google Gemini) to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4 mb-4">
                  <li>Categorize emails into personal, work, and spam/promotional</li>
                  <li>Generate insights and recommendations</li>
                  <li>Analyze file content and organization</li>
                  <li>Describe photos and identify objects/locations</li>
                  <li>Draft email responses with AI assistance</li>
                </ul>
                <p className="text-foreground mt-4">
                  Your data is processed by AI services as necessary to provide these features.
                  The AI may retain data according to their respective privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
                <p className="text-foreground mb-4">
                  We retain your personal information for as long as necessary to provide our
                  services and comply with legal obligations. You can request deletion of your
                  account and associated data at any time. Some data may be retained as required
                  by law or for legitimate business purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Your Rights</h2>
                <p className="text-foreground mb-4">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4 mb-4">
                  <li>Right to access your personal data</li>
                  <li>Right to correct inaccurate data</li>
                  <li>Right to delete your data (right to be forgotten)</li>
                  <li>Right to restrict processing</li>
                  <li>Right to data portability</li>
                  <li>Right to withdraw consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Cookies and Tracking</h2>
                <p className="text-foreground mb-4">
                  NeuronNook uses cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4 mb-4">
                  <li>Remember your preferences</li>
                  <li>Authenticate your session</li>
                  <li>Analyze usage patterns</li>
                  <li>Improve user experience</li>
                </ul>
                <p className="text-foreground mt-4">
                  You can control cookie settings through your browser. Disabling cookies may
                  affect the functionality of NeuronNook.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
                <p className="text-foreground mb-4">
                  NeuronNook does not knowingly collect information from children under the age
                  of 13. If we become aware that a child under 13 has provided us with personal
                  information, we will delete such information immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
                <p className="text-foreground mb-4">
                  Your information may be transferred to, stored in, and processed in countries
                  other than your country of residence, which may have data protection laws
                  different from those of your home country. By using NeuronNook, you consent to
                  the transfer of your information to countries outside your country of residence.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Changes to This Privacy Policy</h2>
                <p className="text-foreground mb-4">
                  We may update this Privacy Policy from time to time to reflect changes in our
                  practices or for other operational, legal, or regulatory reasons. We will notify
                  you of any material changes by updating the "Last Updated" date and, if
                  required, obtaining your consent.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
                <p className="text-foreground mb-4">
                  If you have questions about this Privacy Policy or our privacy practices,
                  please contact us through:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Email: privacy@neuron-nook.com</li>
                  <li>Website: https://neuron-nook.vercel.app</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">15. GDPR Compliance</h2>
                <p className="text-foreground mb-4">
                  If you are located in the European Union, we comply with the General Data
                  Protection Regulation (GDPR). Your personal data is processed based on:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Your consent for service provision</li>
                  <li>Fulfillment of contractual obligations</li>
                  <li>Compliance with legal obligations</li>
                  <li>Protection of vital interests</li>
                  <li>Legitimate interests pursued by NeuronNook</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">16. CCPA Compliance</h2>
                <p className="text-foreground mb-4">
                  If you are a California resident, you have rights under the California Consumer
                  Privacy Act (CCPA), including the right to know what personal information is
                  collected, the right to delete personal information, and the right to opt-out
                  of the sale of personal information.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
