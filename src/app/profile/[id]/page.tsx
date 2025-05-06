'use server';

import React from 'react';
import { ProfileClient } from './profile-client';
// Added Milestone, Step, StepStatus types
import { UserProfile, Initiative, GeneralPost, ContributionItem, Milestone, Step, StepStatus } from '@/lib/types'; 
import { Timestamp } from 'firebase/firestore';

// Mock data helper function - In a real app, you'd fetch from a database
const getMockUserProfile = (id: string): UserProfile => {
  // Always return a fleshed out profile for demo
  return {
    id,
    name: 'Jordan Taylor',
    bio: 'Full-stack developer and community leader passionate about open source, education, and sustainability. Loves hackathons and mentoring.',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'UI/UX Design', 'GraphQL', 'Docker'],
    interests: ['Open Source', 'Community Building', 'Education', 'Sustainability', 'Hackathons', 'Mentoring'],
    profession: 'Full-Stack Developer',
    organization: 'Civic Tech Collective',
    institution: 'Tech University',
    participatingInitiativeIds: [`init-${id}-1`, `init-${id}-2`]
  };
};

// Mock initiatives data - In a real app, you'd fetch from a database
const getMockInitiatives = (userId: string): Initiative[] => {
  return [
    {
      id: `init-1`,
      title: 'Community Tech Workshop',
      description: 'A workshop to teach basic programming skills to community members.',
      imageUrl: 'https://picsum.photos/seed/workshop/300/200',
      roles: ['Instructor', 'Assistant', 'Content Creator'],
      status: 'In Progress',
      createdAt: Timestamp.fromDate(new Date('2025-03-15')),
      creatorId: userId,
      memberIds: ['1', '2', '3']
    },
    {
      id: `init-2`,
      title: 'Local Park Cleanup',
      description: 'Organizing volunteers to clean up the neighborhood park.',
      imageUrl: 'https://picsum.photos/seed/cleanup/300/200',
      roles: ['Coordinator', 'Volunteer'],
      status: 'Planning',
      createdAt: Timestamp.fromDate(new Date('2025-04-10')),
      creatorId: userId,
      memberIds: ['2', '4', userId]
    }
  ];
};

// Mock posts data - In a real app, you'd fetch from a database
const getMockPosts = (userId: string): GeneralPost[] => {
  const userName = getMockUserProfile(userId).name;
  return [
    {
      id: `post-${userId}-1`,
      creatorId: userId,
      creatorName: userName,
      creatorAvatar: `https://i.pravatar.cc/150?u=${userId}-1`,
      content: "Just launched a new initiative for community learning. Join us!",
      background: 'linear-gradient(to right, #6a11cb, #2575fc)',
      timestamp: Timestamp.fromDate(new Date('2025-04-25')),
      linkedInitiativeId: `init-${userId}-1`
    },
    {
      id: `post-${userId}-2`,
      creatorId: userId,
      creatorName: userName,
      creatorAvatar: `https://i.pravatar.cc/150?u=${userId}-1`,
      content: "Looking for volunteers to help with the park cleanup this weekend.",
      background: 'linear-gradient(to right, #11998e, #38ef7d)',
      timestamp: Timestamp.fromDate(new Date('2025-04-20'))
    }
  ];
};

// Mock contributions data - In a real app, you'd fetch from a database
const getMockContributions = (userId: string): ContributionItem[] => {
  return [
    {
      id: 'contrib-1',
      type: 'pull_request',
      title: 'Added real-time chat feature',
      link: 'https://github.com/example/repo/pull/101',
      date: Timestamp.fromDate(new Date('2025-04-10')),
      details: 'Implemented socket.io-based chat for instant messaging.'
    },
    {
      id: 'contrib-2',
      type: 'issue_comment',
      title: 'Reviewed accessibility improvements',
      link: 'https://github.com/example/repo/issues/202#issuecomment-456',
      date: Timestamp.fromDate(new Date('2025-04-12')),
      details: 'Provided feedback and suggestions for better screen reader support.'
    },
    {
      id: 'contrib-3',
      type: 'code_commit',
      title: 'Refactored authentication module',
      link: 'https://github.com/example/repo/commit/abcdef123',
      date: Timestamp.fromDate(new Date('2025-04-15')),
      details: 'Improved security and modularity of the auth system.'
    },
    {
      id: 'contrib-4',
      type: 'initiative_creation',
      title: 'Started the Community Garden Project',
      link: '/initiatives/init-garden',
      date: Timestamp.fromDate(new Date('2025-03-10')),
      details: 'Organizing the setup and planting for the new garden.'
    },
    {
      id: 'contrib-5',
      type: 'post_creation',
      title: 'Shared update about Tech Workshop progress',
      date: Timestamp.fromDate(new Date('2025-04-28')),
      details: 'Posted a summary of the first successful youth coding workshop.'
    },
    {
      id: 'contrib-6',
      type: 'step_completion',
      title: 'Completed "Survey Community Needs" step',
      date: Timestamp.fromDate(new Date('2025-04-18')),
      details: 'Gathered feedback from 50+ residents.'
    },
    {
      id: 'contrib-7',
      type: 'resource_share',
      title: 'Shared "Open Source Guide" resource',
      link: 'https://opensource.guide',
      date: Timestamp.fromDate(new Date('2025-04-20')),
      details: 'Recommended best practices for new contributors.'
    }
  ];
};

// --- NEW: Mock Milestones & Steps ---
const getMockMilestones = (initiativeId: string): Milestone[] => {
  // Always return 4 milestones for demo
  return [
    { id: `m-${initiativeId}-1`, initiativeId, title: "Kickoff & Planning", status: "Completed", order: 1, createdAt: Timestamp.fromDate(new Date('2025-01-10')), creatorId: 'user1' },
    { id: `m-${initiativeId}-2`, initiativeId, title: "Initial Development", status: "Completed", order: 2, createdAt: Timestamp.fromDate(new Date('2025-02-01')), creatorId: 'user1' },
    { id: `m-${initiativeId}-3`, initiativeId, title: "Community Testing", status: "In Progress", order: 3, createdAt: Timestamp.fromDate(new Date('2025-03-01')), creatorId: 'user1' },
    { id: `m-${initiativeId}-4`, initiativeId, title: "Launch & Outreach", status: "Planned", order: 4, createdAt: Timestamp.fromDate(new Date('2025-04-01')), creatorId: 'user1' },
  ];
};

const getMockSteps = (milestoneId: string): Step[] => {
  // Always return 4-5 steps for demo, with a mix of statuses
  const initiativeId = milestoneId.split('-')[1];
  return [
    { id: `s-${milestoneId}-1`, initiativeId, milestoneId, title: "Define project goals", status: "Done", createdAt: Timestamp.fromDate(new Date('2025-01-12')), creatorId: 'user1', assigneeId: 'user3', completedAt: Timestamp.fromDate(new Date('2025-01-15')) },
    { id: `s-${milestoneId}-2`, initiativeId, milestoneId, title: "Gather requirements from community", status: "Done", createdAt: Timestamp.fromDate(new Date('2025-01-16')), creatorId: 'user1', assigneeId: 'user4', completedAt: Timestamp.fromDate(new Date('2025-01-20')) },
    { id: `s-${milestoneId}-3`, initiativeId, milestoneId, title: "Develop MVP features", status: "In Progress", createdAt: Timestamp.fromDate(new Date('2025-02-05')), creatorId: 'user1', assigneeId: 'user3' },
    { id: `s-${milestoneId}-4`, initiativeId, milestoneId, title: "Test with pilot users", status: "To Do", createdAt: Timestamp.fromDate(new Date('2025-03-10')), creatorId: 'user1' },
    { id: `s-${milestoneId}-5`, initiativeId, milestoneId, title: "Collect feedback & iterate", status: "To Do", createdAt: Timestamp.fromDate(new Date('2025-03-15')), creatorId: 'user1' },
  ];
};
// --- END NEW MOCK DATA ---

// --- NEW: Mock Background Data ---
const getMockBackground = (id: string) => ([
  {
    type: 'work',
    title: 'Senior Software Engineer',
    organization: 'Civic Tech Collective',
    description: 'Led a team of 5 in building open-source civic engagement tools. Mentored junior devs and managed project sprints.',
    startDate: '2022-01',
    endDate: '2024-03',
  },
  {
    type: 'work',
    title: 'Frontend Developer',
    organization: 'Green Neighborhoods',
    description: 'Developed interactive dashboards for sustainability initiatives. Collaborated with designers and data scientists.',
    startDate: '2020-06',
    endDate: '2021-12',
  },
  {
    type: 'degree',
    title: 'B.Sc. in Computer Science',
    institution: 'Tech University',
    description: 'Graduated with honors. Led the coding club and organized hackathons.',
    startDate: '2016-09',
    endDate: '2020-05',
  },
  {
    type: 'accolade',
    title: 'Google Code-in Finalist',
    description: 'Recognized for outstanding contributions to open source projects.',
    date: '2019-12',
  },
]);

// Helper function to convert Firestore Timestamps to ISO strings
// Ensure this handles nested objects if necessary, or create specific converters
const convertTimestamps = (obj: any): any => {
  if (!obj) return obj;
  // Handle Firestore Timestamp directly
  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString();
  }
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item));
  }
  // Handle plain objects
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertTimestamps(obj[key]); // Recursively convert
      }
    }
    return newObj;
  }
  // Return primitives as is
  return obj;
};


export default async function ProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Determine if this is the current user's profile
  const isCurrentUser = id === 'me';

  const user = getMockUserProfile(id);
  const initiatives = getMockInitiatives(id);
  const posts = getMockPosts(id);
  const contributions = getMockContributions(id);
  
  // Fetch mock milestones for all initiatives this user participates in
  const userInitiativeIds = user.participatingInitiativeIds; 
  const allMilestones = userInitiativeIds.flatMap(initId => getMockMilestones(initId));
  
  // Fetch mock steps for all fetched milestones
  const allSteps = allMilestones.flatMap(milestone => getMockSteps(milestone.id));

  // Convert Timestamps
  const safeUser = convertTimestamps(user);
  const safeInitiatives = convertTimestamps(initiatives); // Use helper for array
  const safePosts = convertTimestamps(posts); // Use helper for array
  const safeContributions = convertTimestamps(contributions); // Use helper for array
  const safeMilestones = convertTimestamps(allMilestones); // Use helper for array
  const safeSteps = convertTimestamps(allSteps); // Use helper for array

  const background = getMockBackground(id);

  return (
    <>
      <ProfileClient 
        userId={id} 
        user={safeUser} 
        initiatives={safeInitiatives} 
        posts={safePosts} 
        contributions={safeContributions}
        milestones={safeMilestones} 
        steps={safeSteps} 
        isCurrentUser={isCurrentUser}
        background={background}
      />
    </>
  );
}