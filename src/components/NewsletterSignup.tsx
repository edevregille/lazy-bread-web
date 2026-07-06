"use client";

import Script from "next/script";

export default function NewsletterSignup() {
  return (
    <div id="mc_embed_shell" className="max-w-xl mx-auto">
      <div
        id="mc_embed_signup"
        className="bg-white rounded-xl shadow-lg px-6 py-8 sm:px-10 sm:py-10 text-center"
      >
        <form
          action="https://lazybreadpdx.us13.list-manage.com/subscribe/post?u=1258725a28e2ce02896d1195f&id=827eae6307&f_id=00e627eaf0"
          method="post"
          id="mc-embedded-subscribe-form"
          name="mc-embedded-subscribe-form"
          className="validate"
          target="_blank"
        >
          <div id="mc_embed_signup_scroll">
            <h2 className="text-2xl font-semibold text-bakery-primary mb-2 font-body">
              Lazy Bread email updates
            </h2>
            <p className="text-earth-brown/70 text-sm mb-5 font-body">
              Get the latest flavors and market schedule straight to your inbox.
            </p>

            <div className="indicates-required text-xs text-earth-brown/60 mb-3 font-body">
              <span className="asterisk text-bakery-primary">*</span> indicates required
            </div>

            <div className="mc-field-group text-left mb-4">
              <label
                htmlFor="mce-EMAIL"
                className="block text-sm font-semibold text-earth-brown mb-1.5 font-body"
              >
                Email Address <span className="asterisk text-bakery-primary">*</span>
              </label>
              <input
                type="email"
                name="EMAIL"
                className="required email w-full rounded-lg border border-bakery-primary/20 px-4 py-2.5 text-earth-brown font-body focus:outline-none focus:ring-2 focus:ring-bakery-primary/40 focus:border-bakery-primary"
                id="mce-EMAIL"
                required
              />
            </div>

            {/* Bot trap — real people should not fill this in; do not remove or risk spam signups */}
            <div style={{ position: "absolute", left: "-5000px" }} aria-hidden="true">
              <input type="text" name="b_1258725a28e2ce02896d1195f_827eae6307" tabIndex={-1} defaultValue="" />
            </div>
            <div hidden>
              <input type="hidden" name="tags" value="7266003" />
            </div>

            <div id="mce-responses" className="clear foot">
              <div className="response font-body text-sm text-red-600 mt-2" id="mce-error-response" style={{ display: "none" }} />
              <div className="response font-body text-sm text-bakery-primary mt-2" id="mce-success-response" style={{ display: "none" }} />
            </div>

            <div className="optionalParent">
              <div className="clear foot mt-2">
                <button
                  type="submit"
                  name="subscribe"
                  id="mc-embedded-subscribe"
                  className="btn-primary-lg w-full sm:w-auto"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Script
        src="https://s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js"
        strategy="afterInteractive"
      />
      <Script id="mc-embed-config" strategy="afterInteractive">
        {`
          window.fnames = new Array();
          window.ftypes = new Array();
          fnames[0]='EMAIL';
          ftypes[0]='email';
        `}
      </Script>
    </div>
  );
}
