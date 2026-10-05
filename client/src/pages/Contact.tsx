import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <p className="text-sm font-semibold text-teal">
            CONTACT MEDILINK
          </p>

          <h1 className="mt-3 font-display text-4xl font-extrabold text-navy">
            How can we help?
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-[#647583]">
            Contact us about patient support, healthcare provider
            onboarding, hospital partnerships or technical assistance.
          </p>

          <div className="mt-10 space-y-6">
            <div className="flex gap-4">
              <Mail className="mt-1 h-5 w-5 text-teal" />

              <div>
                <p className="font-semibold text-navy">
                  General support
                </p>

                <p className="mt-1 text-sm text-[#647583]">
                  support@medilink.co.zw
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone className="mt-1 h-5 w-5 text-teal" />

              <div>
                <p className="font-semibold text-navy">
                  Phone
                </p>

                <p className="mt-1 text-sm text-[#647583]">
                  +263 77 000 0000
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <MapPin className="mt-1 h-5 w-5 text-teal" />

              <div>
                <p className="font-semibold text-navy">
                  Location
                </p>

                <p className="mt-1 text-sm text-[#647583]">
                  Harare, Zimbabwe
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="card p-7 md:p-9">
          <h2 className="font-display text-2xl font-bold text-navy">
            Send us a message
          </h2>

          {submitted ? (
            <div className="mt-8 rounded-xl bg-[#EAF8FA] p-5 text-sm leading-6 text-navy">
              Your message has been captured in the interface.
              The next step will be connecting this form to the backend.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 grid gap-5">
              <label className="text-sm font-semibold text-navy">
                Full name

                <input
                  required
                  className="field mt-2"
                  placeholder="Your name"
                />
              </label>

              <label className="text-sm font-semibold text-navy">
                Email

                <input
                  required
                  type="email"
                  className="field mt-2"
                  placeholder="you@example.com"
                />
              </label>

              <label className="text-sm font-semibold text-navy">
                Topic

                <select className="field mt-2">
                  <option>Patient support</option>
                  <option>Healthcare provider onboarding</option>
                  <option>Hospital partnership</option>
                  <option>Technical support</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-navy">
                Message

                <textarea
                  required
                  className="field mt-2 min-h-36"
                  placeholder="How can we help?"
                />
              </label>

              <button className="btn-primary w-fit px-8">
                Send message
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}