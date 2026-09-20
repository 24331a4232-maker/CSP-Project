import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, fullName?: string, role?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        fullName: fullName || '',
        role: role || 'donor',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(fullName ? { fullName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed in getOrCreateUser:", error);
    throw new Error("Failed to create or retrieve user.", { cause: error });
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Database query failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
