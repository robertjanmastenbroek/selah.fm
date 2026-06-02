import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA Copyright Policy — Selah.fm',
  description: 'Copyright infringement notification procedure. Report unauthorized use of your copyrighted work on Selah.fm.',
};

export default function DMCAPage() {
  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <main className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
          DMCA Copyright Policy
        </h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: June 2, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Copyright Infringement Notification</h2>
            <p>
              Selah.fm respects the intellectual property rights of others and expects its users to do the same. 
              In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond expeditiously 
              to claims of copyright infringement committed using the Selah.fm platform that are reported to our 
              designated Copyright Agent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Filing a DMCA Notice</h2>
            <p className="mb-3">
              If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, 
              please provide our Copyright Agent with the following information:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing, including a URL or specific location on Selah.fm where the material may be found.</li>
              <li>Your contact information: name, address, telephone number, and email address.</li>
              <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact Our Copyright Agent</h2>
            <p className="mb-2">Send DMCA notices to:</p>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p><strong>Email:</strong> <a href="mailto:copyright@selah.fm" className="text-primary hover:underline">copyright@selah.fm</a></p>
              <p className="text-xs text-muted-foreground/60 mt-1">Please include "DMCA Notice" in the subject line.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Counter-Notification Procedure</h2>
            <p className="mb-3">
              If you believe that material you posted on Selah.fm was removed or access to it was disabled by mistake 
              or misidentification, you may file a counter-notification with our Copyright Agent. Your counter-notification must include:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the material that has been removed or to which access has been disabled and the location at which the material appeared before it was removed or disabled.</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.</li>
              <li>Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the federal court in your district.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Repeat Infringers</h2>
            <p>
              Selah.fm will terminate, in appropriate circumstances, the accounts of users who are repeat infringers 
              of copyright. We reserve the right to remove content alleged to be infringing without prior notice, 
              at our sole discretion, and without liability to you.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
