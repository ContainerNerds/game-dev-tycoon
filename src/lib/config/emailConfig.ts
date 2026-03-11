import type { EmailType, EmailPriority, NotificationType } from '@/lib/game/types';

// ============================================================
// Sender names by email type
// ============================================================

export const EMAIL_SENDERS: Record<EmailType, string[]> = {
  'game-review': [
    'GameSpot', 'IGN', 'Polygon', 'Kotaku', 'PC Gamer',
    'Eurogamer', 'Rock Paper Shotgun', 'The Verge Gaming',
    'Destructoid', 'GamesRadar+',
  ],
  'fan-mail': [
    'Alex_Gamer92', 'PixelQueen', 'NightOwlPlays', 'CasualCarl',
    'xXDarkLordXx', 'RetroRita', 'SpeedrunSteve', 'CozyGamer',
    'TurboTina', 'SilentSamurai', 'LootHoarder', 'AFK_Andy',
    'GlitchHunter', 'SavePointSara', 'BossRushBen',
  ],
  'hate-mail': [
    'Angry_Customer_42', 'RefundNow!!', 'Disappointed_Dave',
    'NeverBuyingAgain', 'OneStarReview', 'BuggedOutBob',
    'CrashTestDummy', 'LagLord', 'UninstallKing',
  ],
  'employee-quit': ['HR Department'],
  'employee-vacation': ['HR Department'],
  'monthly-report': ['Finance Department'],
  'investment-opportunity': [
    'Venture Capital Weekly', 'Angel Investors Network',
    'GameFund Capital', 'Pixel Ventures', 'IndieBoost Fund',
  ],
  'server-alert': ['Infrastructure Monitoring'],
  'general': ['System'],
};

// ============================================================
// Fan mail templates (positive)
// ============================================================

export const FAN_MAIL_TEMPLATES = [
  {
    subject: 'I LOVE {gameName}!!!',
    body: 'I just wanted to say that {gameName} is the best game I\'ve played in years. I\'ve already put in over 200 hours and I\'m not stopping anytime soon. Thank you for making such an amazing game!',
  },
  {
    subject: '{gameName} saved my summer',
    body: 'I was so bored this summer until I found {gameName}. Now it\'s all I play. My friends are hooked too. Please never stop making games!',
  },
  {
    subject: 'Fan art incoming!',
    body: 'Hey! I\'ve been drawing fan art of {gameName} characters all week. Your game has inspired me creatively in ways I didn\'t expect. Keep up the amazing work!',
  },
  {
    subject: 'My kids love {gameName}',
    body: 'Just wanted to let you know that my whole family plays {gameName} together every weekend. It\'s become our family bonding time. Thank you for creating something we can all enjoy!',
  },
  {
    subject: 'Take my money!',
    body: 'When is the next DLC coming? I\'ve 100% completed {gameName} and I need MORE. Seriously, I\'ll pay whatever you\'re asking. This game is incredible.',
  },
  {
    subject: '{gameName} got me through a tough time',
    body: 'I know this might sound dramatic, but {gameName} really helped me through a rough patch in my life. Sometimes you just need a great game to escape to. Thank you.',
  },
  {
    subject: 'Best soundtrack ever',
    body: 'The music in {gameName} is absolutely phenomenal. I listen to the soundtrack at work now. Please tell your sound team they\'re geniuses.',
  },
  {
    subject: 'Speedrun community forming!',
    body: 'Hey, just wanted to let you know there\'s a growing speedrun community around {gameName}! The current world record is 47 minutes. Your game has serious legs!',
  },
] as const;

// ============================================================
// Hate mail templates (negative)
// ============================================================

export const HATE_MAIL_TEMPLATES = [
  {
    subject: '{gameName} is broken',
    body: 'I paid good money for {gameName} and it crashes every 30 minutes. Fix your game or give me a refund. This is unacceptable.',
  },
  {
    subject: 'Worst game of the year',
    body: 'I can\'t believe I wasted money on {gameName}. The bugs are everywhere, the gameplay is repetitive, and the graphics look like they\'re from 2010. Do better.',
  },
  {
    subject: 'WHERE IS THE UPDATE???',
    body: 'It\'s been WEEKS since launch and still no patch for {gameName}? The lag is unbearable and the servers are constantly full. I\'m losing patience.',
  },
  {
    subject: 'Refund request',
    body: 'I\'m writing to formally request a refund for {gameName}. The game is nothing like what was advertised. I feel scammed.',
  },
  {
    subject: 'Your servers are garbage',
    body: 'Every time I try to play {gameName} the servers are either down or lagging so badly it\'s unplayable. Invest in some real infrastructure.',
  },
  {
    subject: 'Uninstalling {gameName}',
    body: 'Just wanted you to know I\'m uninstalling {gameName} and telling all my friends to avoid it. The game-breaking bugs made me lose 20 hours of progress. Shameful.',
  },
] as const;

// ============================================================
// Investment opportunity templates
// ============================================================

export const INVESTMENT_TEMPLATES = [
  {
    subject: 'Partnership opportunity for {studioName}',
    body: 'We\'ve been following {studioName}\'s growth with great interest. We believe there\'s an opportunity for a strategic partnership that could accelerate your studio\'s expansion. Let\'s discuss.',
  },
  {
    subject: 'Funding round invitation',
    body: 'Our fund specializes in gaming studios with proven track records. {studioName} fits our portfolio perfectly. We\'d like to discuss a potential investment of ${amount} to help scale your operations.',
  },
  {
    subject: 'Exclusive publishing deal',
    body: 'We represent a major distribution platform looking for our next exclusive title. Given {studioName}\'s recent success, we\'d love to discuss a mutually beneficial publishing arrangement.',
  },
] as const;

// ============================================================
// Random email generation probabilities
// ============================================================

export const EMAIL_CONFIG = {
  /** Base chance per in-game day to generate fan mail (scales with fan count) */
  fanMailBaseChance: 0.02,
  /** Additional chance per 1000 fans */
  fanMailChancePerThousandFans: 0.01,
  /** Cap on daily fan mail chance */
  fanMailMaxChance: 0.25,

  /** Base chance per in-game day to generate hate mail (scales with active games with bugs) */
  hateMailBaseChance: 0.01,
  /** Additional chance per active bug */
  hateMailChancePerBug: 0.005,
  /** Cap on daily hate mail chance */
  hateMailMaxChance: 0.15,

  /** Chance per month for an investment email */
  investmentChancePerMonth: 0.15,
  /** Min lifetime revenue to start receiving investment emails */
  investmentMinLifetimeRevenue: 50_000,

  /** Server load threshold (0-1) that triggers alert emails */
  serverAlertLoadThreshold: 0.85,
  /** Cooldown in days between server alert emails for the same region */
  serverAlertCooldownDays: 7,

  /** Max emails to keep in inbox before oldest get pruned */
  maxInboxSize: 200,
} as const;

// ============================================================
// Notification toast config
// ============================================================

export const NOTIFICATION_CONFIG = {
  /** Which email types automatically generate a toast notification */
  emailTypesWithToast: [
    'game-review',
    'employee-quit',
    'employee-vacation',
    'monthly-report',
    'investment-opportunity',
    'server-alert',
  ] as EmailType[],

  /** Toast variant by notification type */
  toastVariant: {
    'new-email': 'default',
    'server-overload': 'destructive',
    'game-milestone': 'success',
    'employee-event': 'default',
    'money-warning': 'destructive',
    'achievement': 'success',
    'general': 'default',
  } as Record<NotificationType, string>,

  /** Toast duration in ms by email priority */
  toastDurationByPriority: {
    low: 3000,
    normal: 4000,
    high: 5000,
    urgent: 8000,
  } as Record<EmailPriority, number>,
} as const;

// ============================================================
// Email type display metadata
// ============================================================

export const EMAIL_TYPE_META: Record<EmailType, { label: string; icon: string; color: string }> = {
  'game-review': { label: 'Review', icon: 'star', color: 'text-yellow-500' },
  'fan-mail': { label: 'Fan Mail', icon: 'heart', color: 'text-pink-500' },
  'hate-mail': { label: 'Hate Mail', icon: 'flame', color: 'text-red-500' },
  'employee-quit': { label: 'Resignation', icon: 'user-minus', color: 'text-orange-500' },
  'employee-vacation': { label: 'Vacation', icon: 'palm-tree', color: 'text-green-500' },
  'monthly-report': { label: 'Report', icon: 'bar-chart-3', color: 'text-blue-500' },
  'investment-opportunity': { label: 'Investment', icon: 'trending-up', color: 'text-emerald-500' },
  'server-alert': { label: 'Server Alert', icon: 'alert-triangle', color: 'text-red-500' },
  'general': { label: 'General', icon: 'mail', color: 'text-muted-foreground' },
};
