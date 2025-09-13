-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."InitiativeStatus" AS ENUM ('Idea', 'Planning', 'SeekingMembers', 'InProgress', 'Completed');

-- CreateEnum
CREATE TYPE "public"."MilestoneStatus" AS ENUM ('Planned', 'InProgress', 'Completed', 'OnHold');

-- CreateEnum
CREATE TYPE "public"."StepStatus" AS ENUM ('ToDo', 'InProgress', 'Blocked', 'InReview', 'Done');

-- CreateEnum
CREATE TYPE "public"."UpdateType" AS ENUM ('join', 'status', 'post', 'role_add', 'milestone', 'step_creation', 'step_completion', 'endorsement', 'resource_share', 'milestone_creation', 'milestone_status');

-- CreateEnum
CREATE TYPE "public"."ContributionType" AS ENUM ('commit', 'post_contribution', 'comment', 'initiative_join', 'initiative_creation', 'pull_request', 'issue_comment', 'code_commit', 'post_creation', 'step_completion', 'resource_share');

-- CreateEnum
CREATE TYPE "public"."GoalStatus" AS ENUM ('NotStarted', 'InProgress', 'Completed', 'Blocked');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('Low', 'Medium', 'High');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "public"."InitiativeRoleType" AS ENUM ('ADMIN', 'MEMBER', 'CONTRIBUTOR', 'GUEST', 'SPONSOR', 'MENTOR');

-- CreateEnum
CREATE TYPE "public"."DebateSide" AS ENUM ('PRO', 'CON');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('DIRECT_MESSAGE', 'FOLLOW', 'INITIATIVE_INVITE', 'GOAL_COMPLETED', 'MILESTONE_REACHED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "profession" TEXT,
    "organization" TEXT,
    "institution" TEXT,
    "bannerImageUrl" TEXT,
    "gender" TEXT,
    "username" TEXT,
    "websites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryIntent" TEXT,
    "location" TEXT,
    "city" TEXT,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Initiative" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."InitiativeStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    "aiGuidance" TEXT,
    "updatedAt" TIMESTAMP(3),
    "location" TEXT,
    "progress" INTEGER,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "societyId" TEXT,
    "originatingIdeaId" TEXT,
    "originatingIssueId" TEXT,

    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Milestone" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."MilestoneStatus" NOT NULL,
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Step" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."StepStatus" NOT NULL,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiverId" TEXT,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MediaItem" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "public"."MediaType" NOT NULL,
    "updateId" TEXT,
    "postId" TEXT,
    "ideaId" TEXT,
    "issueId" TEXT,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Update" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "type" "public"."UpdateType" NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" TEXT,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneralPost" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "creatorAvatar" TEXT,
    "content" TEXT NOT NULL,
    "background" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedInitiativeId" TEXT,
    "linkPreviewId" TEXT,
    "linkUrl" TEXT,

    CONSTRAINT "GeneralPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneralPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneralPostShare" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralPostShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneralPostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentCommentId" TEXT,

    CONSTRAINT "GeneralPostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContributionItem" (
    "id" TEXT NOT NULL,
    "type" "public"."ContributionType" NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link" TEXT,
    "details" TEXT,
    "relatedInitiativeId" TEXT,
    "relatedMilestoneId" TEXT,
    "relatedStepId" TEXT,
    "userId" TEXT,

    CONSTRAINT "ContributionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Goal" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "status" "public"."GoalStatus" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "priority" "public"."Priority",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownerAvatar" TEXT,
    "ownerName" TEXT,
    "progress" INTEGER,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Action" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "goalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."StepStatus" NOT NULL,
    "assigneeId" TEXT,
    "assigneeName" TEXT,
    "assigneeAvatar" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "priority" "public"."Priority",
    "creatorId" TEXT,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InitiativeMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "role" "public"."InitiativeRoleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customRole" TEXT,

    CONSTRAINT "InitiativeMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Issue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "championedByInitiativeId" TEXT,
    "championCount" INTEGER NOT NULL DEFAULT 0,
    "championedById" TEXT,
    "addressedByInitiativeId" TEXT,
    "societyId" TEXT,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Idea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "championedByInitiativeId" TEXT,
    "championCount" INTEGER NOT NULL DEFAULT 0,
    "championedById" TEXT,
    "addressingIssueId" TEXT,
    "implementedAsInitiativeId" TEXT,
    "societyId" TEXT,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IssueLike" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IssueShare" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IssueComment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IdeaLike" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IdeaShare" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IdeaComment" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Society" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Society_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocietyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "role" TEXT,
    "customRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocietyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocietyPost" (
    "id" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT,
    "linkPreviewId" TEXT,
    "linkUrl" TEXT,

    CONSTRAINT "SocietyPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocietyPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocietyPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocietyPostShare" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocietyPostShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocietyPostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentCommentId" TEXT,

    CONSTRAINT "SocietyPostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LinkPreview" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image" TEXT,
    "siteName" TEXT,
    "favicon" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkPreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocietyPostLink" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "linkPreviewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocietyPostLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneralPostLink" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "linkPreviewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralPostLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "extension" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocietyPostDocument" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocietyPostDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneralPostDocument" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralPostDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DebateTopic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebateTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DebateVote" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" "public"."DebateSide" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebateVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DebateArgument" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" "public"."DebateSide" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "DebateArgument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DebateArgumentVote" (
    "id" TEXT NOT NULL,
    "argumentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isUpvote" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebateArgumentVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Initiative_originatingIdeaId_key" ON "public"."Initiative"("originatingIdeaId");

-- CreateIndex
CREATE UNIQUE INDEX "Initiative_originatingIssueId_key" ON "public"."Initiative"("originatingIssueId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralPostLike_postId_userId_key" ON "public"."GeneralPostLike"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralPostShare_postId_userId_key" ON "public"."GeneralPostShare"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "public"."UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "InitiativeMembership_userId_initiativeId_key" ON "public"."InitiativeMembership"("userId", "initiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_championedByInitiativeId_key" ON "public"."Issue"("championedByInitiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_addressedByInitiativeId_key" ON "public"."Issue"("addressedByInitiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "Idea_championedByInitiativeId_key" ON "public"."Idea"("championedByInitiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "Idea_implementedAsInitiativeId_key" ON "public"."Idea"("implementedAsInitiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueLike_issueId_userId_key" ON "public"."IssueLike"("issueId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueShare_issueId_userId_key" ON "public"."IssueShare"("issueId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaLike_ideaId_userId_key" ON "public"."IdeaLike"("ideaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaShare_ideaId_userId_key" ON "public"."IdeaShare"("ideaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocietyMembership_userId_societyId_key" ON "public"."SocietyMembership"("userId", "societyId");

-- CreateIndex
CREATE UNIQUE INDEX "SocietyPostLike_postId_userId_key" ON "public"."SocietyPostLike"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocietyPostShare_postId_userId_key" ON "public"."SocietyPostShare"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkPreview_url_key" ON "public"."LinkPreview"("url");

-- CreateIndex
CREATE INDEX "SocietyPostLink_postId_order_idx" ON "public"."SocietyPostLink"("postId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SocietyPostLink_postId_linkPreviewId_key" ON "public"."SocietyPostLink"("postId", "linkPreviewId");

-- CreateIndex
CREATE INDEX "GeneralPostLink_postId_order_idx" ON "public"."GeneralPostLink"("postId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralPostLink_postId_linkPreviewId_key" ON "public"."GeneralPostLink"("postId", "linkPreviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_url_key" ON "public"."Document"("url");

-- CreateIndex
CREATE INDEX "SocietyPostDocument_postId_order_idx" ON "public"."SocietyPostDocument"("postId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SocietyPostDocument_postId_documentId_key" ON "public"."SocietyPostDocument"("postId", "documentId");

-- CreateIndex
CREATE INDEX "GeneralPostDocument_postId_order_idx" ON "public"."GeneralPostDocument"("postId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralPostDocument_postId_documentId_key" ON "public"."GeneralPostDocument"("postId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateVote_topicId_userId_key" ON "public"."DebateVote"("topicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateArgumentVote_argumentId_userId_key" ON "public"."DebateArgumentVote"("argumentId", "userId");

-- AddForeignKey
ALTER TABLE "public"."Initiative" ADD CONSTRAINT "Initiative_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Initiative" ADD CONSTRAINT "Initiative_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "public"."Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Milestone" ADD CONSTRAINT "Milestone_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Milestone" ADD CONSTRAINT "Milestone_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "public"."Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Step" ADD CONSTRAINT "Step_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Step" ADD CONSTRAINT "Step_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Step" ADD CONSTRAINT "Step_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "public"."Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Step" ADD CONSTRAINT "Step_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "public"."Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "public"."Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaItem" ADD CONSTRAINT "MediaItem_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "public"."Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaItem" ADD CONSTRAINT "MediaItem_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaItem" ADD CONSTRAINT "MediaItem_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."GeneralPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaItem" ADD CONSTRAINT "MediaItem_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "public"."Update"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Update" ADD CONSTRAINT "Update_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "public"."Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Update" ADD CONSTRAINT "Update_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "public"."Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Update" ADD CONSTRAINT "Update_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPost" ADD CONSTRAINT "GeneralPost_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPost" ADD CONSTRAINT "GeneralPost_linkPreviewId_fkey" FOREIGN KEY ("linkPreviewId") REFERENCES "public"."LinkPreview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPost" ADD CONSTRAINT "GeneralPost_linkedInitiativeId_fkey" FOREIGN KEY ("linkedInitiativeId") REFERENCES "public"."Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostLike" ADD CONSTRAINT "GeneralPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."GeneralPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostLike" ADD CONSTRAINT "GeneralPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostShare" ADD CONSTRAINT "GeneralPostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."GeneralPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostShare" ADD CONSTRAINT "GeneralPostShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostComment" ADD CONSTRAINT "GeneralPostComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "public"."GeneralPostComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostComment" ADD CONSTRAINT "GeneralPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."GeneralPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostComment" ADD CONSTRAINT "GeneralPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "public"."Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "public"."Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "public"."Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InitiativeMembership" ADD CONSTRAINT "InitiativeMembership_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "public"."Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InitiativeMembership" ADD CONSTRAINT "InitiativeMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_addressedByInitiativeId_fkey" FOREIGN KEY ("addressedByInitiativeId") REFERENCES "public"."Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_championedById_fkey" FOREIGN KEY ("championedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_championedByInitiativeId_fkey" FOREIGN KEY ("championedByInitiativeId") REFERENCES "public"."Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "public"."Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Idea" ADD CONSTRAINT "Idea_addressingIssueId_fkey" FOREIGN KEY ("addressingIssueId") REFERENCES "public"."Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Idea" ADD CONSTRAINT "Idea_championedById_fkey" FOREIGN KEY ("championedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Idea" ADD CONSTRAINT "Idea_championedByInitiativeId_fkey" FOREIGN KEY ("championedByInitiativeId") REFERENCES "public"."Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Idea" ADD CONSTRAINT "Idea_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Idea" ADD CONSTRAINT "Idea_implementedAsInitiativeId_fkey" FOREIGN KEY ("implementedAsInitiativeId") REFERENCES "public"."Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Idea" ADD CONSTRAINT "Idea_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "public"."Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueLike" ADD CONSTRAINT "IssueLike_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueLike" ADD CONSTRAINT "IssueLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueShare" ADD CONSTRAINT "IssueShare_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueShare" ADD CONSTRAINT "IssueShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueComment" ADD CONSTRAINT "IssueComment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueComment" ADD CONSTRAINT "IssueComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaLike" ADD CONSTRAINT "IdeaLike_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "public"."Idea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaLike" ADD CONSTRAINT "IdeaLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaShare" ADD CONSTRAINT "IdeaShare_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "public"."Idea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaShare" ADD CONSTRAINT "IdeaShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaComment" ADD CONSTRAINT "IdeaComment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "public"."Idea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaComment" ADD CONSTRAINT "IdeaComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Society" ADD CONSTRAINT "Society_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyMembership" ADD CONSTRAINT "SocietyMembership_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "public"."Society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyMembership" ADD CONSTRAINT "SocietyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPost" ADD CONSTRAINT "SocietyPost_linkPreviewId_fkey" FOREIGN KEY ("linkPreviewId") REFERENCES "public"."LinkPreview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPost" ADD CONSTRAINT "SocietyPost_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "public"."Society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPost" ADD CONSTRAINT "SocietyPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostLike" ADD CONSTRAINT "SocietyPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."SocietyPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostLike" ADD CONSTRAINT "SocietyPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostShare" ADD CONSTRAINT "SocietyPostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."SocietyPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostShare" ADD CONSTRAINT "SocietyPostShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostComment" ADD CONSTRAINT "SocietyPostComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "public"."SocietyPostComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostComment" ADD CONSTRAINT "SocietyPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."SocietyPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostComment" ADD CONSTRAINT "SocietyPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostLink" ADD CONSTRAINT "SocietyPostLink_linkPreviewId_fkey" FOREIGN KEY ("linkPreviewId") REFERENCES "public"."LinkPreview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostLink" ADD CONSTRAINT "SocietyPostLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."SocietyPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostLink" ADD CONSTRAINT "GeneralPostLink_linkPreviewId_fkey" FOREIGN KEY ("linkPreviewId") REFERENCES "public"."LinkPreview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostLink" ADD CONSTRAINT "GeneralPostLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."GeneralPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostDocument" ADD CONSTRAINT "SocietyPostDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocietyPostDocument" ADD CONSTRAINT "SocietyPostDocument_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."SocietyPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostDocument" ADD CONSTRAINT "GeneralPostDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneralPostDocument" ADD CONSTRAINT "GeneralPostDocument_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."GeneralPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateTopic" ADD CONSTRAINT "DebateTopic_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateVote" ADD CONSTRAINT "DebateVote_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."DebateTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateVote" ADD CONSTRAINT "DebateVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateArgument" ADD CONSTRAINT "DebateArgument_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."DebateArgument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateArgument" ADD CONSTRAINT "DebateArgument_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."DebateTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateArgument" ADD CONSTRAINT "DebateArgument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateArgumentVote" ADD CONSTRAINT "DebateArgumentVote_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "public"."DebateArgument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateArgumentVote" ADD CONSTRAINT "DebateArgumentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

