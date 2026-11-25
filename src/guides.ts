export interface Guide {
  id: string;
  title: string;
  summary: string;
  steps: { title: string; body: string }[];
  cta?: { to: string; label: string };
}

export const GUIDES: Guide[] = [
  {
    id: "create-account",
    title: "Create your account",
    summary: "Sign up in a minute and verify your email.",
    steps: [
      { title: "Register with the right email", body: "Students use their @st.knust.edu.gh or @idl.knust.edu.gh address. Everyone else can use any email. Type it twice and check for typos." },
      { title: "Verify your email", body: "Students get a 6-digit code; everyone else gets a link. Check spam or junk if it isn’t in your inbox." },
      { title: "Typed it wrong?", body: "On the verify screen tap “Wrong email? Change it”, enter the correct address and your password, and we’ll send a fresh code." },
      { title: "You’re in", body: "Browse products and services, chat with sellers and order deliveries." },
    ],
  },
  {
    id: "create-business",
    title: "Create a business account",
    summary: "Open a storefront so you can sell products and services.",
    steps: [
      { title: "Open Settings, then Create your business", body: "You need a verified account first. Tap Settings, then “Create your business”." },
      { title: "Fill in your business details", body: "Add your business name, location and phone number, and accept the Business Terms." },
      { title: "Activate it", body: "The first launch spots are free. After that there is a one-time activation fee paid securely with Paystack." },
      { title: "Make it yours", body: "Upload a logo and banner (you can crop and zoom them), then add your first listing." },
    ],
    cta: { to: "/store/create", label: "Create my business" },
  },
  {
    id: "add-products",
    title: "Add a product or service",
    summary: "List something for sale in four short steps.",
    steps: [
      { title: "Choose Product or Service", body: "Tap Sell, then pick whether you’re listing an item or a service you offer." },
      { title: "Add photos", body: "Upload up to 5 photos. Crop and zoom each one, and try Free AI Enhance for brighter, clearer pictures." },
      { title: "Describe it", body: "Add a clear title, description and price. Products also need a condition, a pickup location and how many you have in stock." },
      { title: "Preview and publish", body: "Check the preview, edit anything you like, then publish. Want more eyes on it? Promote the listing from its page." },
    ],
    cta: { to: "/sell", label: "Add a listing" },
  },
  {
    id: "become-courier",
    title: "Become a courier",
    summary: "Verified students can earn by delivering around campus.",
    steps: [
      { title: "Open the Courier page", body: "Tap the truck icon or go to Settings, then Courier. Courier mode is for verified students only." },
      { title: "Register once", body: "The first 5 couriers join free. After that it costs GH₵10, paid once with Paystack." },
      { title: "Turn courier mode on", body: "Once registered you can switch courier mode on or off any time without paying again." },
    ],
    cta: { to: "/courier", label: "Go to Courier" },
  },
  {
    id: "payments",
    title: "How payments work",
    summary: "Pay once in the app; your money is held until handover.",
    steps: [
      { title: "Two seller payment routes", body: "Sellers who complete the GH₵10 verified Paystack MoMo setup can accept in-app payments. Sellers who have not completed setup use in-person payment and handover." },
      { title: "Buyers pay once", body: "For verified payout sellers, you pay the item, delivery and service fee in one Paystack checkout. The money is held until you confirm receipt. For other sellers, meet in person and pay at handover." },
      { title: "Money is held safely", body: "The seller is paid only when you give the courier your QR or PIN, or confirm pickup. Don’t give the code until you have the item." },
      { title: "Problems and refunds", body: "Cancel before handover for a full refund. If something is wrong, don’t give the code and report it. Our team decides and the money stays held until then." },
      { title: "Sellers and couriers", body: "For in-app orders, sellers receive the item price by MoMo after receipt is confirmed. Couriers receive delivery fees in one weekly MoMo payment. Sellers register their payout account in Settings for a one-time GH₵10 setup fee." },
    ],
    cta: { to: "/settings", label: "Open Settings" },
  },
  {
    id: "courier-tasks",
    title: "How couriers carry out a delivery",
    summary: "From accepting a request to getting paid.",
    steps: [
      { title: "Accept a request", body: "New delivery requests appear on your Courier page. Open one to see the pickup and drop-off, then accept it." },
      { title: "Pick up the item", body: "Go to the seller, collect the item and tap “I picked it up”." },
      { title: "Hand it over", body: "Meet the buyer, then tap “Confirm handover” and scan their QR code or enter their PIN." },
      { title: "Get paid", body: "Buyers pay inside the app, so nobody pays you in person. Confirm your MoMo number in Settings. Your delivery fees are sent there in one weekly payment, and each delivery shows under Payouts." },
      { title: "Don’t cancel after accepting", body: "Cancelling an accepted delivery permanently suspends your account. Only accept jobs you can finish." },
    ],
    cta: { to: "/courier", label: "Open Courier board" },
  },
];

export const guideById = (id: string) => GUIDES.find((g) => g.id === id)!;
