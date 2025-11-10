/**
 * Gamification & Progressive Unlocking System
 *
 * This implements the V1 → V2 → V3 roadmap:
 * - V1: Debates (primary content, everyone can create)
 * - V2: Societies (unlocked when debates hit thresholds OR user proves engagement)
 * - V3: Initiatives (unlocked when user shows deeper community involvement)
 */

// ============================================
// CONFIGURATION (Easy to adjust for production)
// ============================================

export const UNLOCK_THRESHOLDS = {
  // ============================================
  // INITIATIVE UNLOCK (V1 → V2 Flow)
  // ============================================
  // PRIMARY PATH: Debate reaches threshold → Anyone can create Initiative from it
  INITIATIVE_FROM_DEBATE: {
    MIN_VOTES: 3,           // Testing: 3 votes (Production: 100+)
    MIN_AGREEMENT_PCT: 67,  // 67% of voters must agree (2 out of 3 PRO votes)
  },

  // SECONDARY PATH: User proves general engagement → Can create initiatives freely
  // UPDATE: Made immediate for all users to encourage collaborative projects
  INITIATIVE_FROM_ACTIVITY: {
    MIN_ACTIVITY_SCORE: 0,     // Immediate access - no activity required
    MIN_DEBATES_CREATED: 0,    // Immediate access - no debates required
    MIN_ARGUMENTS_POSTED: 0,   // Immediate access - no arguments required
  },

  // ============================================
  // SOCIETY UNLOCK (V3 Flow - TBD)
  // ============================================
  // Societies will be handled differently later
  SOCIETY_FROM_DEBATE: {
    MIN_VOTES: 3,           // Testing: 3 votes (Production: 100+)
    MIN_AGREEMENT_PCT: 67,  // 67% of voters must agree (2 out of 3 PRO votes)
  },

  SOCIETY_FROM_ACTIVITY: {
    MIN_ACTIVITY_SCORE: 50, // User needs 50 activity points
  },
} as const;

// ============================================
// ACTIVITY SCORE CALCULATION
// ============================================

/**
 * Activity point values for different actions
 * Higher points = more valuable community contribution
 */
export const ACTIVITY_POINTS = {
  // Creating content (high value)
  CREATE_DEBATE: 10,
  CREATE_POST: 5,
  CREATE_IDEA: 8,
  CREATE_ISSUE: 8,

  // Engagement (medium value)
  VOTE_ON_DEBATE: 2,
  POST_ARGUMENT: 5,
  POST_COMMENT: 3,
  LIKE_CONTENT: 1,
  SHARE_CONTENT: 3,

  // Deep engagement (high value)
  JOIN_SOCIETY: 5,
  JOIN_INITIATIVE: 8,
  COMPLETE_MILESTONE: 15,

  // Social (low-medium value)
  FOLLOW_USER: 1,
  GET_FOLLOWED: 2,
} as const;

// ============================================
// TYPES
// ============================================

export interface DebateUnlockStatus {
  canUnlockSociety: boolean;
  currentVotes: number;
  requiredVotes: number;
  currentAgreementPct: number;
  requiredAgreementPct: number;
  progressPct: number; // 0-100, for progress bar
}

export interface UserUnlockStatus {
  // Society unlock status
  canCreateSociety: boolean;
  societyUnlocked: boolean;
  societyUnlockedAt?: Date;
  societyProgress: {
    currentScore: number;
    requiredScore: number;
    progressPct: number;
  };

  // Initiative unlock status
  canCreateInitiative: boolean;
  initiativeUnlocked: boolean;
  initiativeUnlockedAt?: Date;
  initiativeProgress: {
    currentScore: number;
    requiredScore: number;
    debatesCreated: number;
    requiredDebates: number;
    argumentsPosted: number;
    requiredArguments: number;
    progressPct: number;
  };
}

// ============================================
// DEBATE-LEVEL UNLOCK CHECKER
// ============================================

/**
 * Check if a specific debate has reached the threshold to unlock Initiative creation
 */
export function checkDebateUnlockStatus(
  proVotes: number,
  conVotes: number
): DebateUnlockStatus {
  const totalVotes = proVotes + conVotes;
  const agreementPct = totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 0;

  const { MIN_VOTES, MIN_AGREEMENT_PCT } = UNLOCK_THRESHOLDS.INITIATIVE_FROM_DEBATE;

  const votesMetThreshold = totalVotes >= MIN_VOTES;
  const agreementMetThreshold = agreementPct >= MIN_AGREEMENT_PCT;
  const canUnlockSociety = votesMetThreshold && agreementMetThreshold;

  // Calculate overall progress (average of both criteria)
  const voteProgress = Math.min(100, (totalVotes / MIN_VOTES) * 100);
  const agreementProgress = Math.min(100, (agreementPct / MIN_AGREEMENT_PCT) * 100);
  const progressPct = Math.round((voteProgress + agreementProgress) / 2);

  return {
    canUnlockSociety,
    currentVotes: totalVotes,
    requiredVotes: MIN_VOTES,
    currentAgreementPct: agreementPct,
    requiredAgreementPct: MIN_AGREEMENT_PCT,
    progressPct,
  };
}

// ============================================
// ACTIVITY SCORE CALCULATOR
// ============================================

/**
 * Calculate a user's activity score from their engagement stats
 */
export function calculateActivityScore(userStats: {
  debatesCreated: number;
  postsCreated: number;
  ideasCreated: number;
  issuesCreated: number;
  debateVotes: number;
  argumentsPosted: number;
  commentsPosted: number;
  likes: number;
  shares: number;
  societiesMember: number;
  initiativesMember: number;
  milestonesCompleted: number;
  followers: number;
  following: number;
}): number {
  let score = 0;

  score += userStats.debatesCreated * ACTIVITY_POINTS.CREATE_DEBATE;
  score += userStats.postsCreated * ACTIVITY_POINTS.CREATE_POST;
  score += userStats.ideasCreated * ACTIVITY_POINTS.CREATE_IDEA;
  score += userStats.issuesCreated * ACTIVITY_POINTS.CREATE_ISSUE;
  score += userStats.debateVotes * ACTIVITY_POINTS.VOTE_ON_DEBATE;
  score += userStats.argumentsPosted * ACTIVITY_POINTS.POST_ARGUMENT;
  score += userStats.commentsPosted * ACTIVITY_POINTS.POST_COMMENT;
  score += userStats.likes * ACTIVITY_POINTS.LIKE_CONTENT;
  score += userStats.shares * ACTIVITY_POINTS.SHARE_CONTENT;
  score += userStats.societiesMember * ACTIVITY_POINTS.JOIN_SOCIETY;
  score += userStats.initiativesMember * ACTIVITY_POINTS.JOIN_INITIATIVE;
  score += userStats.milestonesCompleted * ACTIVITY_POINTS.COMPLETE_MILESTONE;
  score += userStats.followers * ACTIVITY_POINTS.GET_FOLLOWED;
  score += userStats.following * ACTIVITY_POINTS.FOLLOW_USER;

  return score;
}

// ============================================
// USER-LEVEL UNLOCK CHECKER
// ============================================

/**
 * Check what features a user has unlocked based on their activity
 */
export function checkUserUnlockStatus(
  activityScore: number,
  debatesCreated: number,
  argumentsPosted: number,
  canCreateSociety: boolean,
  canCreateInitiative: boolean,
  societyUnlockedAt?: Date,
  initiativeUnlockedAt?: Date
): UserUnlockStatus {
  // Society unlock (either already unlocked OR score threshold met)
  const societyScoreThresholdMet = activityScore >= UNLOCK_THRESHOLDS.SOCIETY_FROM_ACTIVITY.MIN_ACTIVITY_SCORE;
  const societyUnlocked = canCreateSociety || societyScoreThresholdMet;

  // Initiative unlock (all criteria must be met)
  const initiativeScoreThresholdMet = activityScore >= UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_ACTIVITY_SCORE;
  const debatesThresholdMet = debatesCreated >= UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_DEBATES_CREATED;
  const argumentsThresholdMet = argumentsPosted >= UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_ARGUMENTS_POSTED;
  const initiativeUnlocked = canCreateInitiative || (
    initiativeScoreThresholdMet && debatesThresholdMet && argumentsThresholdMet
  );

  return {
    canCreateSociety: societyUnlocked,
    societyUnlocked,
    societyUnlockedAt,
    societyProgress: {
      currentScore: activityScore,
      requiredScore: UNLOCK_THRESHOLDS.SOCIETY_FROM_ACTIVITY.MIN_ACTIVITY_SCORE,
      progressPct: Math.min(100, Math.round(
        (activityScore / UNLOCK_THRESHOLDS.SOCIETY_FROM_ACTIVITY.MIN_ACTIVITY_SCORE) * 100
      )),
    },

    canCreateInitiative: initiativeUnlocked,
    initiativeUnlocked,
    initiativeUnlockedAt,
    initiativeProgress: {
      currentScore: activityScore,
      requiredScore: UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_ACTIVITY_SCORE,
      debatesCreated,
      requiredDebates: UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_DEBATES_CREATED,
      argumentsPosted,
      requiredArguments: UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_ARGUMENTS_POSTED,
      progressPct: Math.min(100, Math.round(
        (
          (activityScore / UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_ACTIVITY_SCORE) +
          (debatesCreated / UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_DEBATES_CREATED) +
          (argumentsPosted / UNLOCK_THRESHOLDS.INITIATIVE_FROM_ACTIVITY.MIN_ARGUMENTS_POSTED)
        ) / 3 * 100
      )),
    },
  };
}
