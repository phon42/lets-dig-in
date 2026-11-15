import type { Scenario } from "@phish/shared";

/**
 * The truth bank. Each scenario has one legit message (written the way real
 * companies actually write them) plus a kitchen-made fake for small games.
 *
 * Every message, real or fake, must contain {{link}} exactly where its link
 * goes. The real message's link is on the brand's real domain; players'
 * fakes get a lookalike link they pick while writing. That link is the one
 * reliable tell, so a player can't just copy the real message word for word
 * and become impossible to tell apart from it.
 *
 * Brands are made up (and food-flavored) so the game never impersonates a
 * real company.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "bank-charge",
    emoji: "💳",
    channel: "sms",
    brand: "Brine Bank",
    domain: "brinebank.com",
    sender: "BRINEBANK",
    prompt: "Your bank flags a suspicious charge",
    paths: ["activity", "fraud", "secure", "card"],
    real: {
      text: "Brine Bank Fraud Alert: Did you attempt a $212.47 purchase at GRILLMART #0391 with card ending 4417? Reply YES or NO. To review recent activity, sign in at {{link}}. Reply STOP to opt out.",
      url: "brinebank.com/activity",
      notes: [
        "Only asks for a YES or NO reply, never a PIN, password or code",
        "Gives the exact amount, merchant and last four card digits",
        "Has the standard 'Reply STOP' opt-out that real alert services include",
      ],
    },
    house:
      "Brine Bank: Unusual sign-in detected on your account. Access will be limited in 24 hours unless you confirm your identity at {{link}}",
  },
  {
    id: "parcel",
    emoji: "📦",
    channel: "sms",
    brand: "Cod Express",
    domain: "codexpress.com",
    sender: "CODEXPRESS",
    prompt: "Your package couldn't be delivered",
    paths: ["track", "redeliver", "package", "delivery"],
    real: {
      text: "Cod Express: Sorry we missed you! We tried to deliver package CX8842291 today but a signature is required. We'll try again tomorrow between 9am and 1pm. To change delivery options visit {{link}}",
      url: "codexpress.com/t/CX8842291",
      notes: [
        "Quotes a specific tracking number",
        "No fee and no deadline: they simply try again tomorrow",
        "The link includes the tracking number on their real domain",
      ],
    },
    house:
      "Cod Express: Your package is on hold at our warehouse due to an unpaid redelivery fee of $1.45. Pay within 12 hours or it will be returned to sender: {{link}}",
  },
  {
    id: "streaming",
    emoji: "📺",
    channel: "email",
    brand: "Spudflix",
    domain: "spudflix.com",
    sender: "Spudflix <info@account.spudflix.com>",
    subject: "There's a problem with your payment",
    prompt: "Your streaming subscription payment failed",
    paths: ["account", "billing", "payment", "renew"],
    real: {
      text: "Hi Jordan,\n\nWe couldn't process your payment for this month's Spudflix membership. We'll try again in a few days. To keep watching without interruption, you can update your payment method on your Account page: {{link}}\n\nIf you've already updated it, you can ignore this email.\n\nThe Spudflix Team",
      url: "spudflix.com/account",
      notes: [
        "Uses your actual name instead of 'Dear customer'",
        "Says they'll retry the payment. No 'canceled in 24 hours' threat",
        "Tells you it's fine to ignore it if you've already taken care of it",
      ],
    },
    house:
      "Dear Customer, your Spudflix membership has been SUSPENDED due to a billing error!! Restore your access immediately: {{link}}",
  },
  {
    id: "it-password",
    emoji: "🔐",
    channel: "email",
    brand: "Tater Corp IT",
    domain: "tatercorp.com",
    sender: "IT Help Desk <helpdesk@tatercorp.com>",
    subject: "Your password expires in 5 days",
    prompt: "Work IT says your password is expiring",
    paths: ["password", "reset", "sso", "login"],
    real: {
      text: "Hi Sam,\n\nYour Tater Corp network password expires in 5 days (Nov 19). You can change it any time from the self-service portal at {{link}} or by pressing Ctrl+Alt+Del on your work laptop.\n\nIT will never ask for your password by email or chat.\n\nTater Corp IT Help Desk · ext. 4400",
      url: "password.tatercorp.com",
      notes: [
        "Offers a way to do it without clicking anything (Ctrl+Alt+Del)",
        "A reasonable five-day deadline, not 'within the hour'",
        "password.tatercorp.com is a real subdomain: the part right before .com is still tatercorp",
      ],
    },
    house:
      "IT NOTICE: Your mailbox password expires today. To avoid losing access to your email, re-validate your login details now at {{link}}",
  },
  {
    id: "login-code",
    emoji: "🔢",
    channel: "sms",
    brand: "Gravy",
    domain: "gravy.com",
    sender: "Gravy",
    prompt: "A login code arrives that you didn't ask for",
    paths: ["security", "verify", "account", "help"],
    real: {
      text: "Your Gravy verification code is 482913. Don't share it with anyone. Gravy will never call or text to ask for this code. Didn't request it? Secure your account at {{link}}",
      url: "gravy.com/security",
      notes: [
        "Explicitly tells you never to share the code",
        "Doesn't ask you to reply, call or forward anything",
      ],
    },
    house:
      "Gravy Security: someone requested a code for your account. If this wasn't you, reply with the code we just sent so we can cancel the request, or visit {{link}}",
  },
  {
    id: "new-signin",
    emoji: "🖥️",
    channel: "email",
    brand: "Gravy",
    domain: "gravy.com",
    sender: "Gravy <no-reply@accounts.gravy.com>",
    subject: "Security alert: new sign-in on Windows",
    prompt: "Someone signed in to your email from a new device",
    paths: ["security", "signin", "verify", "account"],
    real: {
      text: "A new sign-in on Windows\n\nYour Gravy Account was just signed in to from a new Windows device near Columbus, OH.\n\nIf this was you, you don't need to do anything. If not, we'll help you secure your account: {{link}}",
      url: "myaccount.gravy.com/notifications",
      notes: [
        "'You don't need to do anything' if it was you. No pressure",
        "myaccount.gravy.com is a subdomain of gravy.com, so it's the real thing",
        "Gives a rough location instead of scary hacker talk",
      ],
    },
    house:
      "Gravy Alert: Your account was accessed from Russia. Your account will be locked unless you verify your identity within 2 hours: {{link}}",
  },
  {
    id: "tax-refund",
    emoji: "🧾",
    channel: "email",
    brand: "TurboTater",
    domain: "turbotater.com",
    sender: "TurboTater <do-not-reply@notifications.turbotater.com>",
    subject: "Good news: your federal return was accepted",
    prompt: "Your tax app says your refund is on the way",
    paths: ["refund", "claim", "account", "tax"],
    real: {
      text: "Hi Casey,\n\nYour 2025 federal tax return was accepted. Your refund of $284.20 will be sent by direct deposit to the checking account ending in 3381. Most refunds arrive within 21 days. You don't need to do anything.\n\nTo track your refund, sign in at {{link}}",
      url: "turbotater.com/refund-status",
      notes: [
        "Pays into an account you already gave them. Doesn't ask for card details",
        "'You don't need to do anything': refunds that need you to 'claim' them are a red flag",
        "Shows only the last four digits of your account, never the whole number",
      ],
    },
    house:
      "TurboTater: Following a review you are eligible for an additional tax refund of $326.18. Submit your card details before the claim expires to receive payment: {{link}}",
  },
  {
    id: "copyright",
    emoji: "📸",
    channel: "dm",
    brand: "Pickle",
    domain: "pickle.social",
    sender: "Pickle Support ✓",
    prompt: "A social app says your post broke copyright rules",
    paths: ["appeal", "help", "verify", "copyright"],
    real: {
      text: "Hi @chilidog, we removed your post from Oct 30 because we received a copyright report from Saucy Records. Your account is in good standing. If you think this was a mistake, you can appeal within 30 days from the Help Center: {{link}}",
      url: "pickle.social/help/appeals",
      notes: [
        "Calm tone: your account is 'in good standing'",
        "30 days to appeal, not 24 hours",
        "Doesn't ask you to log in through the message or hand over a password",
      ],
    },
    house:
      "⚠️ Pickle Copyright Team: Your account has been reported for violating our policy and will be PERMANENTLY deleted in 24 hours. Verify you are the owner here: {{link}}",
  },
  {
    id: "order",
    emoji: "🛒",
    channel: "email",
    brand: "Fryday",
    domain: "fryday.com",
    sender: "Fryday.com <auto-confirm@fryday.com>",
    subject: "Your Fryday order #112-4471983",
    prompt: "An order confirmation arrives for something you didn't buy",
    paths: ["orders", "cancel", "refund", "account"],
    real: {
      text: "Thanks for your order, Riley!\n\nOrder #112-4471983 · Arriving Thursday\n1 × Deluxe Air Fryer (6 qt): $89.99\n\nTo view or cancel this order, go to Your Orders: {{link}}\n\nWe'll email you when it ships.",
      url: "fryday.com/your-orders",
      notes: [
        "Sends you to 'Your Orders' on the site instead of a phone number",
        "No 'call our fraud team immediately' panic",
        "A believable, ordinary item and price",
      ],
    },
    house:
      "Your Fryday order of an iPhone 17 Pro Max ($1,299.00) has been placed. If you did NOT authorize this purchase call our fraud team immediately or cancel here: {{link}}",
  },
  {
    id: "energy-bill",
    emoji: "⚡",
    channel: "email",
    brand: "Brisket Power & Light",
    domain: "brisketpower.com",
    sender: "Brisket Power & Light <billing@brisketpower.com>",
    subject: "Your November bill is ready",
    prompt: "Your electric company emails about your bill",
    paths: ["bill", "payment", "refund", "account"],
    real: {
      text: "Hi Morgan,\n\nYour November bill is ready.\nAmount due: $97.45\nDue date: Dec 2\n\nYou're enrolled in AutoPay, so we'll charge your bank account automatically on Dec 2. No action needed.\n\nView your bill: {{link}}",
      url: "brisketpower.com/bills",
      notes: [
        "Says the money is collected automatically. No action needed",
        "Specific amount and date that match a normal monthly bill",
      ],
    },
    house:
      "Brisket Power & Light: We have overcharged you $114.60 this year. Claim your refund today by confirming your billing details: {{link}}",
  },
  {
    id: "recruiter",
    emoji: "💼",
    channel: "dm",
    brand: "Lobstr",
    domain: "lobstr.work",
    sender: "Dana Whitebait · Recruiter at Plaice & Partners",
    prompt: "A recruiter messages you about a job",
    paths: ["jobs", "apply", "onboarding", "offer"],
    real: {
      text: "Hi Alex, I'm a recruiter at Plaice & Partners. I came across your profile and think you could be a great fit for a Junior Data Analyst role (hybrid, Chicago, $62-70k). The full listing is here: {{link}}. Happy to chat if it sounds interesting, no pressure if you're not looking!",
      url: "lobstr.work/jobs/view/38821",
      notes: [
        "Normal salary for the role, not '$45/hr, no experience needed'",
        "Links to a public listing, with no fees and no equipment to buy",
        "'No pressure' is the opposite of scam urgency",
      ],
    },
    house:
      "Congratulations!! You have been selected for a remote Data Entry position paying $45/hr. No interview required. Complete onboarding and purchase your starter equipment here: {{link}}",
  },
  {
    id: "storage",
    emoji: "☁️",
    channel: "push",
    brand: "Crumb Cloud",
    domain: "crumbcloud.com",
    sender: "Crumb Cloud",
    prompt: "Your cloud storage is full",
    paths: ["storage", "upgrade", "billing", "restore"],
    real: {
      text: "Your Crumb Cloud storage is full. New photos won't back up until you free up space or upgrade. Your existing files are safe. Manage storage: {{link}}",
      url: "crumbcloud.com/storage",
      notes: [
        "'Your existing files are safe'. No threat to delete anything",
        "Says exactly what stops working (new backups) and nothing more dramatic",
      ],
    },
    house:
      "Crumb Cloud: Your photos and videos will be deleted on Nov 15 because your storage is full. Get 50GB FREE to keep them: {{link}}",
  },
  {
    id: "toll",
    emoji: "🚗",
    channel: "sms",
    brand: "SpudPass",
    domain: "spudpass.com",
    sender: "SPUDPASS",
    prompt: "You owe money for a highway toll",
    paths: ["pay", "toll", "violation", "account"],
    real: {
      text: "SpudPass: A toll on 11/12 for plate 7KXM482 could not be charged because your card on file expired. Update your card by 11/26 to avoid a violation notice. Pay at {{link}} or call 1-800-555-0142.",
      url: "spudpass.com/pay",
      notes: [
        "Yes, it has a deadline and a penalty. Real services sometimes do! Here the domain is the tell",
        "Includes your license plate, the exact date and why the charge failed",
        "Gives a phone number as an alternative to the link",
      ],
    },
    house:
      "SPUDPASS TOLL SERVICES: You have an outstanding toll balance of $4.15. Failure to pay today will result in a $75 fine and suspension of your registration. Pay now: {{link}}",
  },
  {
    id: "delivery-app",
    emoji: "🛵",
    channel: "push",
    brand: "Battered Bites",
    domain: "battered.app",
    sender: "Battered Bites",
    prompt: "Your food delivery app pings you",
    paths: ["order", "refund", "track", "voucher"],
    real: {
      text: "Priya is on the way with your order from The Codfather 🐟 Arriving in 12-17 min. Track your driver: {{link}}",
      url: "battered.app/track/88213",
      notes: [
        "Arrives right after you placed an order. Context matters",
        "Names the restaurant and gives a realistic time window",
        "Asks for nothing: no payment, no login",
      ],
    },
    house:
      "Battered Bites: Your order could not be delivered and a refund of $23.80 is waiting. Claim it within 1 hour before it expires: {{link}}",
  },
  {
    id: "phone-bill",
    emoji: "📱",
    channel: "sms",
    brand: "Tartare Wireless",
    domain: "tartarewireless.com",
    sender: "TARTARE",
    prompt: "Your phone carrier texts you",
    paths: ["upgrade", "reward", "bill", "account"],
    real: {
      text: "Tartare Wireless: Your November bill is $45.00 and will be paid by AutoPay on Nov 20. View it in the My Tartare app or at {{link}}. Text STOP to 61234 to opt out.",
      url: "tartarewireless.com/mybill",
      notes: [
        "Mentions the official app as an alternative to the link",
        "Matches the normal monthly bill amount",
        "Standard opt-out wording",
      ],
    },
    house:
      "Tartare Wireless: Congratulations! As a loyal customer you've been selected for a FREE upgrade to the new Galaxy S26. Claim before midnight: {{link}}",
  },
  {
    id: "tickets",
    emoji: "🎟️",
    channel: "email",
    brand: "Saucebox Tickets",
    domain: "saucebox.com",
    sender: "Saucebox <tickets@saucebox.com>",
    subject: "Your tickets for The Corndogs",
    prompt: "A ticket site emails about your concert tickets",
    paths: ["tickets", "payment", "order", "confirm"],
    real: {
      text: "You're going to The Corndogs!\n\nThe Gravy Boat Ballroom, Austin TX · Sat, Dec 6 · Doors 7pm\n2 × General Admission\n\nYour tickets are in your Saucebox account. Show the barcode in the app at the door, and note that screenshots won't scan.\n\nView your tickets: {{link}}",
      url: "saucebox.com/my-tickets",
      notes: [
        "All the boring specifics: venue, date, doors time, ticket type",
        "Tells you to use the official app, so it isn't pushing you to a website",
      ],
    },
    house:
      "Saucebox: There was a problem with your ticket order. Your tickets will be released to other fans unless you re-confirm your payment details within 2 hours: {{link}}",
  },
  {
    id: "pharmacy",
    emoji: "💊",
    channel: "sms",
    brand: "Pharm Fresh",
    domain: "pharmfresh.com",
    sender: "PharmFresh",
    prompt: "A pharmacy says your prescription is ready",
    paths: ["prescription", "pickup", "delivery", "pay"],
    real: {
      text: "Pharm Fresh: Your prescription is ready for pickup at our Main St store. Please bring a photo ID. We'll hold it for 10 days. Store hours: {{link}}",
      url: "pharmfresh.com/stores/main-st",
      notes: [
        "The link is just store hours. Nothing to pay or log in to",
        "You confirm who you are in person, not online",
      ],
    },
    house:
      "Pharm Fresh: Your prescription delivery failed. A $2.99 redelivery fee is required to reschedule: {{link}}",
  },
  {
    id: "marketplace",
    emoji: "🪑",
    channel: "dm",
    brand: "Gumbo Marketplace",
    domain: "gumbo.market",
    sender: "Gumbo Marketplace",
    prompt: "Someone wants to buy the chair you listed online",
    paths: ["payment", "receive", "verify", "item"],
    real: {
      text: "Good news! Chris bought your item 'Mid-century armchair' for $45.00. Payment is held safely by Gumbo and released to you once Chris confirms pickup. Arrange a pickup time in your messages: {{link}}",
      url: "gumbo.market/messages",
      notes: [
        "The platform holds the money. You never have to 'unlock' a payment",
        "Keeps everything inside the app's own messages",
      ],
    },
    house:
      "Gumbo Marketplace: A buyer has paid $45.00 for your item. To receive the funds you must verify your bank card here first: {{link}}",
  },
  {
    id: "school",
    emoji: "🎓",
    channel: "email",
    brand: "Haddock State University",
    domain: "haddock.edu",
    sender: "Office of the Registrar <registrar@haddock.edu>",
    subject: "Spring semester registration is open",
    prompt: "Your college emails about class registration",
    paths: ["register", "login", "tuition", "portal"],
    real: {
      text: "Hi Taylor,\n\nRegistration for the Spring semester is now open and closes on January 10. Log in to the student portal to pick your classes and confirm your details: {{link}}\n\nIf you have questions, stop by the Registrar's Office (Student Union, 2nd floor) or reply to this email.\n\nOffice of the Registrar\nHaddock State University",
      url: "portal.haddock.edu",
      notes: [
        "Weeks to act, not hours",
        "Gives a physical place to go and ask in person",
        ".edu domains are only given to accredited colleges",
      ],
    },
    house:
      "Dear Student, your university account will be DEACTIVATED due to an unpaid tuition balance. Update your payment information immediately to avoid being dropped from your classes: {{link}}",
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/** Secret-ingredient suggestions shown to writers, purely optional */
export const TIPS = [
  "Use their real-sounding name, scammers who do this are scarier",
  "Copy the brand's tone: calm, boring, a little corporate",
  "Add one oddly specific detail (an order number, a time)",
  "Keep it short. Real alerts rarely ramble",
  "Give a deadline, but a believable one",
  "Offer a refund or reward",
  "Mention an alternative like the app, so it feels legit",
  "Reassure them: 'no action needed if this was you'",
  "Throw in an emoji the brand might actually use",
  "Make it sound like a routine notification",
  "Add an opt-out line ('Reply STOP…')",
  "Pretend you're helping them stay safe",
];
