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
                  Welcome to NeuronNook. We are committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, and share your data when you use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Google User Data Disclosure</h2>
                <p className="text-foreground mb-4">
                  To comply with the Google API Services User Data Policy and provide our categorization services, we disclose the following regarding how NeuronNook accesses, uses, stores, and shares Google user data:
                </p>
                <div className="space-y-4 pl-4 border-l-2 border-primary">
                  <div>
                    <h3 className="text-xl font-medium text-foreground">Data Accessed</h3>
                    <p className="text-foreground">
                      Our application requests access to the following Google user data:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-foreground ml-2 mt-2">
                      <li><strong>Google Profile (openid, email, profile):</strong> Primary email address, name, and profile picture to create and authenticate your account.</li>
                      <li><strong>Gmail (gmail.readonly, gmail.send):</strong> Email metadata and previews (sender, recipient, subject, date, snippet/preview, read status, thread ID).</li>
                      <li><strong>Google Drive (drive.readonly):</strong> File metadata (file ID, name, MIME type, size, modified time, web view link, icon link, thumbnail link).</li>
                      <li><strong>Google Photos (photoslibrary.readonly, photoslibrary):</strong> Photo and media metadata (file ID, base/product URLs, MIME type, filename, creation time, dimensions, camera make and model).</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-foreground">Data Usage</h3>
                    <p className="text-foreground">
                      We use the accessed Google user data for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-foreground ml-2 mt-2">
                      <li><strong>Dashboard Display:</strong> Presenting your emails, files, and photos within a unified dashboard interface.</li>
                      <li><strong>AI Categorization:</strong> Processing specific metadata (e.g., email sender, subject, snippets, file names, MIME types) to automatically categorize your content (e.g., "work", "personal", "spam").</li>
                      <li><strong>Analytics:</strong> Aggregating categorization results to provide dashboard summaries and organization recommendations.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-foreground">Data Sharing</h3>
                    <p className="text-foreground">
                      To facilitate our core AI categorization feature, we share specific, limited Google user data with third-party Artificial Intelligence providers:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-foreground ml-2 mt-2">
                      <li><strong>Third Parties:</strong> Data is shared with NVIDIA NIM and OpenRouter for processing by large language models.</li>
                      <li><strong>Data Shared:</strong> Only the minimum necessary data is transmitted (e.g., email sender, subject, snippet; file name, MIME type).</li>
                      <li><strong>Purpose:</strong> Strictly to analyze the text and return a categorization label, confidence score, and reasoning. This data is not shared with other third-party advertisers or data brokers, and is not used to train generalized AI models.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-foreground">Data Storage & Protection</h3>
                    <p className="text-foreground">
                      <strong>Storage:</strong> We store basic profile information (email, name) and OAuth access/refresh tokens in a secure database. We also store the resulting AI categorization metadata. We do <strong>not</strong> store the actual content of your emails, files, or photos in our database.
                      <br />
                      <strong>Protection:</strong> Our database is secured and accessed via authenticated server-side connections. User sessions are managed using signed JSON Web Tokens (JWTs) in secure, HTTP-only cookies. All data in transit is encrypted over HTTPS.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium text-foreground">Data Retention & Deletion</h3>
                    <p className="text-foreground">
                      <strong>Retention:</strong> We retain your OAuth tokens and generated categorization metadata only as long as you maintain an active account.
                      <br />
                      <strong>Deletion Process:</strong> You can instantly clear your connection and delete your data via the "Clear Tokens" or "Disconnect" feature in the application dashboard (or by making a request to our <code>/api/auth/clear-tokens</code> endpoint). This completely severs our application's access to your Google data and deletes your tokens from our systems.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Changes to this Policy</h2>
                <p className="text-foreground mb-4">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Contact Us</h2>
                <p className="text-foreground mb-4">
                  If you have any questions about this Privacy Policy or how we handle your data, please contact us through the information provided on our website.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
