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
 * Brands are made up (and food-flavoured) so the game never impersonates a
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
      text: "Brine Bank Fraud Alert: Did you attempt a £212.47 purchase at GRILLMART 0391 with card ending 4417? Reply YES or NO. To review recent activity, sign in at {{link}}. Reply STOP to opt out.",
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
    brand: "Codswallop Couriers",
    domain: "codcouriers.com",
    sender: "CODCOURIER",
    prompt: "Your parcel couldn't be delivered",
    paths: ["track", "redeliver", "parcel", "delivery"],
    real: {
      text: "Codswallop Couriers: Sorry we missed you! We tried to deliver parcel CC8842291 today. We'll try again tomorrow, 9am-1pm. To change delivery options visit {{link}}",
      url: "codcouriers.com/t/CC8842291",
      notes: [
        "Quotes a specific tracking number",
        "No fee and no deadline: they simply try again tomorrow",
        "The link includes the tracking number on their real domain",
      ],
    },
    house:
      "Codswallop Couriers: Your parcel is on hold at our depot due to an unpaid redelivery fee of £1.45. Pay within 12 hours or it will be returned to sender: {{link}}",
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
      text: "Hi Jordan,\n\nWe couldn't process your payment for this month's Spudflix membership. We'll try again in a few days. To keep watching without interruption, you can update your payment method in your Account page: {{link}}\n\nIf you've already updated it, you can ignore this email.\n\nThe Spudflix Team",
      url: "spudflix.com/account",
      notes: [
        "Uses your actual name instead of 'Dear customer'",
        "Says they'll retry the payment. No 'cancelled in 24 hours' threat",
        "Tells you it's fine to ignore it if you've already sorted it",
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
    sender: "IT Service Desk <servicedesk@tatercorp.com>",
    subject: "Your password expires in 5 days",
    prompt: "Work IT says your password is expiring",
    paths: ["password", "reset", "sso", "login"],
    real: {
      text: "Hi Sam,\n\nYour Tater Corp network password expires in 5 days (19 Nov). You can change it any time from the self-service portal at {{link}} or by pressing Ctrl+Alt+Del on your work laptop.\n\nIT will never ask for your password by email or chat.\n\nTater Corp IT Service Desk · ext. 4400",
      url: "password.tatercorp.com",
      notes: [
        "Offers a way to do it without clicking anything (Ctrl+Alt+Del)",
        "A reasonable five-day deadline, not 'within the hour'",
        "password.tatercorp.com is a real subdomain: the part right before .com is still tatercorp",
      ],
    },
    house:
      "IT NOTICE: Your mailbox password expires today. To avoid losing access to your emails, re-validate your login details now at {{link}}",
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
      text: "Your Gravy verification code is 482 913. Don't share it with anyone. Gravy will never call or text to ask for this code. Didn't request it? Secure your account at {{link}}",
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
      text: "A new sign-in on Windows\n\nYour Gravy Account was just signed in to from a new Windows device near Manchester, UK.\n\nIf this was you, you don't need to do anything. If not, we'll help you secure your account: {{link}}",
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
    emoji: "🏛️",
    channel: "email",
    brand: "HM Ketchup & Customs",
    domain: "hmkc.gov.uk",
    sender: "HMKC <noreply@notifications.hmkc.gov.uk>",
    subject: "Your tax calculation is ready",
    prompt: "The tax office says you're owed a refund",
    paths: ["refund", "claim", "account", "tax"],
    real: {
      text: "Your 2025 to 2026 tax return has been processed. You're due a refund of £84.20.\n\nThis will be paid into the bank account you gave us on your return within 5 working days. You don't need to do anything.\n\nTo view your calculation, sign in to your tax account at {{link}}",
      url: "hmkc.gov.uk/account",
      notes: [
        "Pays to an account they already have. Doesn't ask for card details",
        "'You don't need to do anything': refunds that need you to 'claim' are a red flag",
        "Ends in .gov.uk, which only real government bodies can register",
      ],
    },
    house:
      "HMKC: Following a review you are eligible for a tax refund of £326.18. Submit your card details before the claim expires to receive payment: {{link}}",
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
      text: "Hi @chipbutty, we removed your post from 30 Oct because we received a copyright report from Saucy Records. Your account is in good standing. If you think this was a mistake, you can appeal within 30 days from the Help Centre: {{link}}",
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
      text: "Thanks for your order, Riley!\n\nOrder #112-4471983 · Arriving Thursday\n1 × Deluxe Air Fryer (5.5L): £89.99\n\nTo view or cancel this order, go to Your Orders: {{link}}\n\nWe'll email you when it ships.",
      url: "fryday.com/your-orders",
      notes: [
        "Sends you to 'Your Orders' on the site instead of a phone number",
        "No 'call our fraud team immediately' panic",
        "A believable, ordinary item and price",
      ],
    },
    house:
      "Your Fryday order of an iPhone 17 Pro Max (£1,299.00) has been placed. If you did NOT authorise this purchase call our fraud team immediately or cancel here: {{link}}",
  },
  {
    id: "energy-bill",
    emoji: "⚡",
    channel: "email",
    brand: "Battersea Energy",
    domain: "batterseaenergy.co.uk",
    sender: "Battersea Energy <bills@batterseaenergy.co.uk>",
    subject: "Your November bill is ready",
    prompt: "Your energy supplier emails about your bill",
    paths: ["bill", "payment", "refund", "account"],
    real: {
      text: "Hi Morgan,\n\nYour November bill is ready.\nAmount due: £67.45\nDue date: 2 Dec\n\nYou pay by Direct Debit, so we'll collect this automatically on or after 2 Dec. No action needed.\n\nView your bill: {{link}}",
      url: "batterseaenergy.co.uk/bills",
      notes: [
        "Says the money is collected automatically. No action needed",
        "Specific amount and date that match a normal monthly bill",
      ],
    },
    house:
      "Battersea Energy: We have overcharged you £114.60 this year. Claim your refund today by confirming your billing details: {{link}}",
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
      text: "Hi Alex, I'm a recruiter at Plaice & Partners. I came across your profile and think you could be a great fit for a Junior Data Analyst role (hybrid, Leeds, £29-32k). The full listing is here: {{link}}. Happy to chat if it sounds interesting, no pressure if you're not looking!",
      url: "lobstr.work/jobs/view/38821",
      notes: [
        "Normal salary for the role, not '£45/hr, no experience needed'",
        "Links to a public listing, with no fees and no equipment to buy",
        "'No pressure' is the opposite of scam urgency",
      ],
    },
    house:
      "Congratulations!! You have been selected for a remote Data Entry position paying £45/hr. No interview required. Complete onboarding and purchase your starter equipment here: {{link}}",
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
      "Crumb Cloud: Your photos and videos will be deleted on 15 Nov because your storage is full. Get 50GB FREE to keep them: {{link}}",
  },
  {
    id: "toll",
    emoji: "🚗",
    channel: "sms",
    brand: "Spudway Tolls",
    domain: "spudway.gov.uk",
    sender: "SPUDWAY",
    prompt: "You owe money for a road toll",
    paths: ["pay", "toll", "penalty", "account"],
    real: {
      text: "Spudway: A crossing on 12 Nov by vehicle AB12 CDE has not been paid. Pay by midnight 13 Nov to avoid a penalty charge. Pay at {{link}} or call 0300 123 4567.",
      url: "spudway.gov.uk/pay",
      notes: [
        "Yes, it has a deadline and a penalty. Real services sometimes do! Here the domain is the tell",
        "Includes your registration plate and the exact date",
        "Gives a phone number as an alternative to the link",
      ],
    },
    house:
      "SPUDWAY TOLL SERVICES: You have an outstanding toll balance of £4.15. Failure to pay today will result in a £75 fine and legal action. Pay now: {{link}}",
  },
  {
    id: "delivery-app",
    emoji: "🛵",
    channel: "push",
    brand: "Battered Bites",
    domain: "battered.app",
    sender: "Battered Bites",
    prompt: "Your takeaway delivery app pings you",
    paths: ["order", "refund", "track", "voucher"],
    real: {
      text: "Priya is on the way with your order from The Codfather 🐟 Arriving in 12-17 min. Track your rider: {{link}}",
      url: "battered.app/track/88213",
      notes: [
        "Arrives right after you placed an order. Context matters",
        "Names the restaurant and gives a realistic time window",
        "Asks for nothing: no payment, no login",
      ],
    },
    house:
      "Battered Bites: Your order could not be delivered and a refund of £23.80 is waiting. Claim it within 1 hour before it expires: {{link}}",
  },
  {
    id: "phone-bill",
    emoji: "📱",
    channel: "sms",
    brand: "Tartare Mobile",
    domain: "tartaremobile.com",
    sender: "TARTARE",
    prompt: "Your phone carrier texts you",
    paths: ["upgrade", "reward", "bill", "account"],
    real: {
      text: "Tartare Mobile: Your bill for November is £18.00 and will be collected by Direct Debit on 20 Nov. View it in the My Tartare app or at {{link}}. Text STOP to 61234 to opt out.",
      url: "tartaremobile.com/mybill",
      notes: [
        "Mentions the official app as an alternative to the link",
        "Matches the normal monthly bill amount",
        "Standard opt-out wording",
      ],
    },
    house:
      "Tartare Mobile: Congratulations! As a loyal customer you've been selected for a FREE upgrade to the new Galaxy S26. Claim before midnight: {{link}}",
  },
  {
    id: "tickets",
    emoji: "🎟️",
    channel: "email",
    brand: "Saucebox Tickets",
    domain: "saucebox.com",
    sender: "Saucebox <tickets@saucebox.com>",
    subject: "Your tickets for The Mushy Peas",
    prompt: "A ticket site emails about your concert tickets",
    paths: ["tickets", "payment", "order", "confirm"],
    real: {
      text: "You're going to The Mushy Peas!\n\nO2 Academy Leeds · Sat 6 Dec · Doors 7pm\n2 × Standing\n\nYour tickets are in your Saucebox account. Show the barcode in the app at the door, and note that screenshots won't scan.\n\nView your tickets: {{link}}",
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
    domain: "pharmfresh.co.uk",
    sender: "PharmFresh",
    prompt: "A pharmacy says your prescription is ready",
    paths: ["prescription", "collect", "delivery", "pay"],
    real: {
      text: "Pharm Fresh: Your prescription is ready to collect from our High St branch. Please bring your name and date of birth. Collect within 14 days. Opening hours: {{link}}",
      url: "pharmfresh.co.uk/stores/high-st",
      notes: [
        "The link is just opening hours. Nothing to pay or log in to",
        "You confirm your details in person, not online",
      ],
    },
    house:
      "Pharm Fresh: Your prescription delivery failed. A £2.99 redelivery fee is required to rebook your slot: {{link}}",
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
      text: "Good news! Chris bought your item 'Mid-century armchair' for £45.00. Payment is held safely by Gumbo and released to you once Chris confirms collection. Arrange a pickup time in your messages: {{link}}",
      url: "gumbo.market/messages",
      notes: [
        "The platform holds the money. You never have to 'unlock' a payment",
        "Keeps everything inside the app's own messages",
      ],
    },
    house:
      "Gumbo Marketplace: A buyer has paid £45.00 for your item. To receive the funds you must verify your bank card here first: {{link}}",
  },
  {
    id: "school",
    emoji: "🎓",
    channel: "email",
    brand: "University of Haddock",
    domain: "haddock.ac.uk",
    sender: "Student Services <studentservices@haddock.ac.uk>",
    subject: "Spring term enrolment is open",
    prompt: "Your university emails about enrolment",
    paths: ["enrol", "login", "fees", "portal"],
    real: {
      text: "Dear Taylor,\n\nEnrolment for Spring term is now open and closes on 10 January. Log in to the student portal to check your modules and confirm your details: {{link}}\n\nIf you have questions, drop in to Student Services (Library, Level 1) or reply to this email.\n\nStudent Services\nUniversity of Haddock",
      url: "portal.haddock.ac.uk",
      notes: [
        "Weeks to act, not hours",
        "Gives a physical place to go and ask in person",
        ".ac.uk domains are only given to real universities",
      ],
    },
    house:
      "Dear Student, your university account will be DEACTIVATED due to an unpaid tuition balance. Update your payment information immediately to avoid removal from your course: {{link}}",
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
