import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CURRENT_TERMS_VERSION } from "../terms";

const clauses = [
  {
    title: "1. Who may use KNUST Mart",
    paragraphs: [
      "By creating or using an account, you agree to these Terms. You must provide accurate account information and have legal capacity to enter into this agreement. If the law requires a parent or guardian's consent for you to use the service, obtain it before using KNUST Mart.",
      "Keep your password, verification codes, and account access private. You are responsible for activity through your account and should promptly report suspected unauthorized access.",
    ],
  },
  {
    title: "2. Marketplace and transactions",
    paragraphs: [
      "KNUST Mart provides tools for users to discover listings, contact one another, and arrange purchases and delivery or pickup. Unless expressly stated otherwise, KNUST Mart is a marketplace facilitator, not the seller, buyer, manufacturer, or courier for a transaction. Users are responsible for checking listings, agreeing on transaction details, and complying with applicable law.",
      "Listings and user content are provided by users. We do not guarantee that every listing, item, user, or claim is accurate, safe, available, or lawful. Report suspicious listings or conduct through the available support channels.",
    ],
  },
  {
    title: "3. Safe and lawful conduct",
    paragraphs: [
      "Do not use KNUST Mart to deceive, threaten, harass, impersonate, steal, distribute unlawful or unsafe goods, manipulate reviews, evade fees, or interfere with the service. Do not list goods you do not own or have permission to sell, or goods whose sale is prohibited.",
      "Do not send passwords, one-time codes, payment credentials, or your delivery QR code or PIN in chat. For courier orders, share the handover code only when the item is physically in your possession.",
    ],
  },
  {
    title: "4. Orders and cancellation",
    paragraphs: [
      "A buyer may cancel an order through KNUST Mart only before the item is handed to the courier. An order may still be cancelled while the seller is confirming it or while a courier is assigned but has not picked it up. For pickup orders, cancellation is available before the buyer confirms collection. The app will not allow cancellation after courier handoff or completed pickup; contact support if there is a safety or transaction problem.",
      "Order, delivery, and payment status shown in the service is subject to confirmation by the relevant users and payment providers. Any fees and payment terms will be shown in the applicable flow.",
    ],
  },
  {
    title: "5. Personal information, messages, and privacy",
    paragraphs: [
      "We use information you submit, including account and listing details, transaction records, and messages, to operate KNUST Mart, connect transaction participants, provide support, protect the service, and handle reports and disputes. Information needed to arrange an order may be shown to the people involved in that order.",
      "Chat messages are stored and are not end-to-end encrypted. Authorized personnel may review relevant messages when handling support requests, safety concerns, suspected fraud, or disputes. We do not promise that chats are private from the other participant. Do not send sensitive personal information unless it is necessary for the transaction.",
      "We use reasonable safeguards to protect information, but no online service can guarantee absolute security. We may retain records for as long as needed for service, safety, dispute-resolution, and legal purposes, and disclose information where required by law or appropriately necessary to protect users and the service.",
    ],
  },
  {
    title: "6. Fraud, reports, and enforcement",
    paragraphs: [
      "We may investigate reports, preserve relevant account, transaction, and message records, restrict features, suspend or close accounts, remove listings, and cooperate with payment providers or lawful authorities where appropriate or required. We may take action without advance notice when needed to prevent harm, fraud, or continued misuse.",
      "Suspected criminal conduct may be referred to law enforcement where appropriate or required. KNUST Mart does not determine criminal guilt or impose criminal punishment; investigation, prosecution, and any sentence are matters for the competent authorities and courts under applicable law.",
    ],
  },
  {
    title: "7. Business and seller terms",
    paragraphs: [
      "To open a business storefront, you must also accept the Business Terms at business creation. You confirm that you are authorized to operate the business and that its name, location, listings, prices, photos, and claims are accurate and lawful.",
      "You are responsible for the goods or services you offer, honoring accepted orders, communicating material changes, and complying with applicable consumer, tax, licensing, product-safety, and other legal obligations. Do not offer counterfeit, stolen, restricted, or otherwise unlawful goods or services.",
      "Store activation fees, if any, are displayed before checkout. Payment processing may be provided by a third party and may be subject to that provider's terms. A storefront or payment does not mean KNUST Mart has verified every business claim or product.",
    ],
  },
  {
    title: "8. Availability, liability, and changes",
    paragraphs: [
      "We work to keep KNUST Mart available and useful, but the service may change or be interrupted and is provided subject to applicable law. To the extent permitted by law, KNUST Mart is not responsible for users' independent acts, user listings, or disputes between users. Nothing in these Terms excludes liability or consumer rights that cannot legally be excluded.",
      "We may update these Terms. We will publish the current version here and identify it by version/date. If a material update requires renewed acceptance, we will request it before you continue using the affected feature.",
    ],
  },
  {
    title: "9. Prohibited and restricted items",
    paragraphs: [
      "You may not list, advertise, or sell: illegal drugs or drug paraphernalia, alcohol or tobacco, weapons or anything designed to cause harm, stolen or counterfeit goods, prescription medicines, exam papers, leaked assessments or completed coursework offered for submission, accounts or login details, adult content, or any item or service that breaches Ghanaian law or KNUST regulations.",
      "Services must be lawful and honestly described. We may remove any listing we reasonably believe breaches this section, with or without notice, and may restrict or close the account behind it.",
    ],
  },
  {
    title: "10. Badges and achievements",
    paragraphs: [
      "Badges show a seller's record on KNUST Mart. Most are awarded automatically when the criteria listed in Settings are met; Campus Legend is assigned by KNUST Mart admins at their discretion and cannot be applied for.",
      "You must not buy, sell, trade, or fake badges, create extra accounts to qualify for them, arrange fake orders or reviews, or pressure buyers for ratings. We may withhold, suspend, or revoke any badge, including an automatically earned one, if we find it was obtained through misconduct, if the criteria are no longer met, or if the account is subject to unresolved disputes, a report, or enforcement action. Revoking a badge does not by itself limit other rights under these Terms.",
    ],
  },
  {
    title: "11. Pickup, delivery, and meeting safety",
    paragraphs: [
      "Arrange handovers in busy, well-lit public campus places such as the library, the Student Union Building, or a hall entrance. Avoid meeting alone in isolated areas or late at night, tell a friend where you are going, and bring someone along for high-value items.",
      "Inspect the item before accepting it and before sharing your handover code. Do not pay or hand over goods outside the agreed order flow if you are unsure. If you feel unsafe, leave, and report the user and contact campus security or the police where appropriate.",
      "Couriers and sellers must carry out handovers honestly and may not open, swap, or tamper with items. Users are responsible for their own safety and conduct when meeting. KNUST Mart does not supervise meetups or deliveries in person.",
    ],
  },
  {
    title: "12. Disputes between buyers and sellers",
    paragraphs: [
      "If something goes wrong with an order, first try to resolve it directly and politely through the order chat. If that fails, report the order through the app as soon as possible, with accurate details and any photos or messages that support your account.",
      "We may review the order record, messages, and reports, ask both sides for information, and take reasonable steps such as marking an order as disputed, limiting features, or removing listings or badges. KNUST Mart acts as a facilitator: we are not obliged to resolve every dispute, we do not guarantee any outcome or refund, and our decisions on platform actions do not replace your legal rights. Users remain free to seek help from campus authorities or the courts.",
      "Do not use threats, harassment, or public shaming to settle a dispute, and do not post false reports or reviews.",
    ],
  },
  {
    title: "13. Limits on our responsibility",
    paragraphs: [
      "To the extent the law allows, KNUST Mart is not liable for the quality, safety, legality, or delivery of items and services sold by users, for loss or injury arising from meetings or deliveries between users, for badges or ratings given by others, or for losses caused by events outside our reasonable control such as network outages, payment-provider downtime, or power failures.",
      "Where liability cannot be excluded, it is limited to the extent the law permits. Nothing in these Terms limits liability for fraud, death, or personal injury caused by our own negligence, or any rights you have that cannot be waived.",
    ],
  },
  {
    title: "14. Governing law and contact",
    paragraphs: [
      "These Terms are intended to be governed by the laws of Ghana, subject to any mandatory legal protections that apply to you. Disputes are subject to the jurisdiction of competent courts in Ghana.",
      "These Terms are a product-use agreement, not legal advice or a guarantee against loss, fraud, or legal claims. Have a qualified Ghanaian lawyer review them before relying on them as a final legal document.",
    ],
  },
];

export default function Terms() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <article className="card mx-auto max-w-3xl rounded-3xl border border-line bg-[var(--surface)] p-5 sm:p-9">
        <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft size={17} aria-hidden="true" /> Back to KNUST Mart
        </Link>
        <div className="mb-8 flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand"><ShieldCheck size={24} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gold">Version {CURRENT_TERMS_VERSION}</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Terms and Conditions</h1>
            <p className="mt-2 text-sm text-ink/60">Applies to all KNUST Mart account holders. Business sellers also accept the Business Terms in section 7.</p>
          </div>
        </div>
        <div className="space-y-7">
          {clauses.map(({ title, paragraphs }) => (
            <section key={title}>
              <h2 className="font-display text-lg font-bold">{title}</h2>
              <div className="mt-2 space-y-3 text-sm leading-6 text-ink/75">
                {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-9 border-t border-line pt-5 text-xs leading-5 text-ink/55">
          Last updated 17 November 2026. This draft should receive qualified legal review before being treated as final legal advice.
        </p>
      </article>
    </main>
  );
}
