"use client"

import { Card, CardContent } from "@/components/ui/card"

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-card border-border">
          <CardContent className="pt-8 prose prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
            <p className="text-muted-foreground mb-6">
              Last Updated: {new Date().toLocaleDateString()}
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-foreground mb-4">
                  By accessing and using NeuronNook ("Service"), you accept and agree to be
                  bound by the terms and provision of this agreement. If you do not agree to
                  abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                <p className="text-foreground mb-4">
                  Permission is granted to temporarily download one copy of the materials
                  (information or software) on NeuronNook for personal, non-commercial transitory
                  viewing only. This is the grant of a license, not a transfer of title, and
                  under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Modifying or copying the materials</li>
                  <li>Using the materials for any commercial purpose or for any public display</li>
                  <li>Attempting to decompile or reverse engineer any software contained on the Service</li>
                  <li>Removing any copyright or other proprietary notations from the materials</li>
                  <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
                <p className="text-foreground mb-4">
                  The materials on NeuronNook are provided on an 'as is' basis. NeuronNook makes
                  no warranties, expressed or implied, and hereby disclaims and negates all other
                  warranties including, without limitation, implied warranties or conditions of
                  merchantability, fitness for a particular purpose, or non-infringement of
                  intellectual property or other violation of rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
                <p className="text-foreground mb-4">
                  In no event shall NeuronNook or its suppliers be liable for any damages
                  (including, without limitation, damages for loss of data or profit, or due to
                  business interruption) arising out of the use or inability to use the materials
                  on NeuronNook, even if NeuronNook or a NeuronNook authorized representative has
                  been notified orally or in writing of the possibility of such damage.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Accuracy of Materials</h2>
                <p className="text-foreground mb-4">
                  The materials appearing on NeuronNook could include technical, typographical,
                  or photographic errors. NeuronNook does not warrant that any of the materials
                  on the Service are accurate, complete, or current. NeuronNook may make changes
                  to the materials contained on the Service at any time without notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Materials and Links</h2>
                <p className="text-foreground mb-4">
                  NeuronNook has not reviewed all of the sites linked to its website and is not
                  responsible for the contents of any such linked site. The inclusion of any link
                  does not imply endorsement by NeuronNook of the site. Use of any such linked
                  website is at the user's own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
                <p className="text-foreground mb-4">
                  NeuronNook may revise these terms of service for the website at any time without
                  notice. By using this website, you are agreeing to be bound by the then current
                  version of these terms of service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
                <p className="text-foreground mb-4">
                  These terms and conditions are governed by and construed in accordance with the
                  laws of the jurisdiction in which NeuronNook operates, and you irrevocably
                  submit to the exclusive jurisdiction of the courts in that location.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. User Accounts</h2>
                <p className="text-foreground mb-4">
                  When you create an account on NeuronNook, you must provide information that is
                  accurate, complete, and current at all times. Inaccurate, incomplete, or
                  outdated information may result in the immediate termination of your account on
                  the Service. You are responsible for safeguarding the password that you use to
                  access the Service and for all activities that occur under your password.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
                <p className="text-foreground mb-4">
                  NeuronNook integrates with third-party services including Google, Microsoft,
                  Gmail, Drive, Photos, and OneDrive. Your use of these services is subject to
                  their respective terms of service and privacy policies. NeuronNook is not
                  responsible for the availability or functionality of these third-party services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. AI-Powered Features</h2>
                <p className="text-foreground mb-4">
                  NeuronNook provides AI-powered features for categorization and analysis. These
                  features are provided on an "as-is" basis and may not be 100% accurate. Users
                  should verify critical information before taking action based on AI suggestions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
                <p className="text-foreground mb-4">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL NEURONOOK BE LIABLE
                  FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
                  RESULTING FROM YOUR USE OR INABILITY TO USE THE SERVICE OR MATERIALS, EVEN IF
                  NEURONOOK HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
                <p className="text-foreground mb-4">
                  If you have any questions about these Terms and Conditions, please contact us
                  through the contact information provided on our website.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
