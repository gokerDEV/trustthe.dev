const DOMAIN = process.env.DOMAIN || 'trustthe.dev';
const BASE_URL = `https://${DOMAIN}`;
const SITE_NAME = 'Trust The Developer';
const CONTACT_EMAIL = 'contact[at]goker.dev';
const DEFAULT_LOCALE = 'en_US';
const DEFAULT_DESCRIPTION =
  'A component for developers who build with transparency, versioning, and soul.';
const DEFAULT_OG_IMAGE = '/placeholder.jpg';
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const DEFAULT_SCHEMA_IMAGE = '/placeholder.jpg';
const AUTHOR_NAME = 'goker';
const AUTHOR_URL = 'https://goker.dev/goker';
const TWITTER_HANDLE = '@gokerDEV';
const TWITTER_CARD_TYPE = 'summary_large_image';
const ORGANIZATION_NAME = 'Trust The Developer';
const ORGANIZATION_URL = 'https://trustthe.dev';

// Trust the developers
const TECH_STACK = 'Next.js 16, React 19, Tailwind 4, Shadcn UI, KODKAFA API';
const TECH_TOOLS = 'Cursor, WebStorm, Github, Vercel';
const BUY_ME_A_COFFEE = 'https://www.buymeacoffee.com/goker';

const TTD = {
  version: String(process.env.VERSION),
  commitHash: process.env.VERCEL_GIT_COMMIT_SHA || '1234567890',
  commitAuthorName: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || 'goker',
  commitAuthorLogin: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || 'goker-dev',
  commitMessage:
    process.env.VERCEL_GIT_COMMIT_MESSAGE ||
    'Enhance Version Component: Add tooltip tech stack display',
  commitRef: process.env.VERCEL_GIT_COMMIT_REF || 'main',
  repoSlug: process.env.VERCEL_GIT_REPO_SLUG || 'kodkafa-app-template',
  repoOwner: process.env.VERCEL_GIT_REPO_OWNER || 'kodkafa',
  provider:
    typeof process.env.VERCEL_GIT_PROVIDER === 'string'
      ? process.env.VERCEL_GIT_PROVIDER
      : 'github',
};
// Humans.txt
const HUMANSTXT = `
/* TEAM */
This is a one-man-army project.
Dev, designer, debugger, deployer: ${AUTHOR_NAME}
Site: ${AUTHOR_URL}

/* THANKS */
Big thanks to AI assistants — more stable than junior devs after their third espresso.
And to the open web: still weird, still wonderful. Never change.

/* SITE */
Stack: ${TECH_STACK}
Tools: ${TECH_TOOLS}
Backend: KODKAFA API — https://kodkafa.com
PS:This is a template which is  i'm working on and it will be open-sourced soon.

/* INSPIRATION */
Built to learn, share, and keep the digital garden growing.
Fueled by curiosity, caffeine, and a low tolerance for bad UI.

/* ROADMAP */
- Auth system (because not everything is for everyone)
- Private content access (sssh...)
- Shopping (code now, buy later)
- Direct chat (talk to the dev, maybe even get a reply)
✓ Dark mode - already redefined. Balanced, beautiful, contrast-checked.
  → https://goker.me/balanced-theme-system
- Chaos mode (??? no one asked, so we built it)

/* CONTACT */
Want to contribute, collaborate, or correct a comma?
Ping me: ${CONTACT_EMAIL}

/* EASTER EGG */
You found the humans.txt - you're probably my kind of people.
Consider this a digital nod of respect.

/* SUPPORT */
Like the project? Fuel the dev: ${BUY_ME_A_COFFEE}
`;

const PROFILES = {
  // linkedin: 'https://www.linkedin.com/in/gokercebeci/',
  // github: 'https://github.com/gokerDEV',
  behance: 'https://behance.com/gokerART',
  facebook: 'https://www.facebook.com/goker.art',
  // twitter: "https://twitter.com/gokercebeci",
  twitter: 'https://twitter.com/gokerART',
  instagram: 'https://instagram.com/goker.art',
  // steam: 'https://steamcommunity.com/id/gokerGAME',
  // twitch: 'https://www.twitch.tv/gokerESO',
  youtube: 'https://youtube.com/@gokerART',
  vimeo: 'https://vimeo.com/gokerART',
  dribbble: 'https://dribble.com/goker',
  '500px': 'https://500px.com/goker',
  etsy: 'https://etsy.com/shop/goker',
  thenounproject: 'https://thenounproject.com/goker',
  myminifactory: 'https://www.myminifactory.com/users/goker',
  pinterest: 'www.pinterest.com/gokerART',
  // medium: 'https://medium.com/@gokerDEV',
  codepen: 'https://codepen.io/goker',
};

const PINNED_POSTS = [
  {
    slug: 'echoneo-prompts-policies-and-millennia-of-irony',
    domain: 'goker.art',
  },
  {
    slug: 'echoneo',
    domain: 'goker.art',
  },
  {
    slug: 'goker',
    domain: 'goker.art',
  },
];

export {
  AUTHOR_NAME,
  AUTHOR_URL,
  BASE_URL,
  BUY_ME_A_COFFEE,
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_LOCALE,
  DEFAULT_OG_IMAGE,
  DEFAULT_SCHEMA_IMAGE,
  DOMAIN,
  HUMANSTXT,
  OG_HEIGHT,
  OG_WIDTH,
  ORGANIZATION_NAME,
  ORGANIZATION_URL,
  SITE_NAME,
  TECH_STACK,
  TTD,
  TWITTER_CARD_TYPE,
  TWITTER_HANDLE,
  PROFILES,
  PINNED_POSTS,
};
