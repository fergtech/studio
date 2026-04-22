import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/** Find or create a Society+ user by the hub email header, then ensure they're a society member. */
export async function ensureSocietyMember(
  req: { headers: { get(name: string): string | null } },
  societyId: string,
  role = 'MEMBER',
): Promise<void> {
  const email = req.headers.get('x-hub-user-email');
  if (!email) return;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const hash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
    user = await prisma.user.create({
      data: { email, name: email.split('@')[0], passwordHash: hash },
    });
  }

  await prisma.societyMembership.upsert({
    where: { userId_societyId: { userId: user.id, societyId } },
    update: {},
    create: { userId: user.id, societyId, role },
  });
}

/** Find or create a Society+ user by email. Returns the user record. */
export async function findOrCreateUser(email: string, name?: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const hash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
    user = await prisma.user.create({
      data: { email, name: name ?? email.split('@')[0], passwordHash: hash },
    });
  }
  return user;
}

/** Strip the @hub.citinet suffix Citinet adds to user emails. */
export function toUsername(email: string) {
  return email.replace(/@hub\.citinet$/, '').replace(/@.*$/, '');
}

/** Map a society + optional caller email → HubSpace shape. */
export function toHubSpace(society: any, callerEmail?: string | null) {
  const callerMembership = callerEmail
    ? society.memberships?.find((m: any) => m.user?.email === callerEmail)
    : null;

  return {
    id: society.id,
    slug: society.id,
    name: society.name,
    description: society.description ?? null,
    visibility: 'public' as const,
    banner_mode: society.image ? 'image' : null,
    banner_color: null,
    banner_gradient_from: null,
    banner_gradient_to: null,
    banner_image_file_name: null,
    banner_image_url: society.image ?? null,
    created_by: society.creatorId ?? null,
    created_at: society.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: society.createdAt?.toISOString() ?? new Date().toISOString(),
    member_count: society.memberships?.length ?? society._count?.memberships ?? 0,
    my_role: callerMembership
      ? (callerMembership.role === 'admin' ? 'owner' : 'member')
      : null,
    my_status: callerMembership ? 'active' : null,
    web_public: true,
  };
}

/** Map a SocietyPost → HubPost shape. */
export function toHubPost(post: any) {
  const content = post.content ?? '';
  const title = content.length > 79 ? content.slice(0, 79) + '…' : content;
  const categoryMap: Record<string, string> = {
    GENERAL: 'DISCUSSION',
    IDEA: 'PROJECT',
    ISSUE: 'ANNOUNCEMENT',
  };
  const username = toUsername(post.user?.email ?? '') || post.user?.name || 'unknown';
  return {
    id: post.id,
    category: categoryMap[post.type] ?? 'DISCUSSION',
    title,
    body: content,
    author_id: post.userId,
    author_username: username,
    media_file_name: undefined,
    media_url: post.imageUrl ?? null,
    reply_count: post._count?.comments ?? 0,
    created_at: post.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: post.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

/** Map a SocietyMembership → HubSpaceMember shape. */
export function toHubMember(m: any) {
  const email = m.user?.email ?? '';
  return {
    user_id: m.userId,
    username: toUsername(email) || m.user?.name || m.userId,
    display_name: m.user?.name ?? null,
    avatar_url: m.user?.image ?? null,
    profile_headline: null,
    role: m.role === 'admin' ? 'owner' : 'member',
    status: 'active',
    joined_at: m.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}
