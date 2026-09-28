import { UserAccount, Profile } from "@/types";
import { DEFAULT_PROFILES } from "./constants";

const USERS_DB_KEY = "filmflex_all_users_db";
const SESSIONS_PREFIX = "filmflex_sessions_";

// Predefined initial seed accounts
const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: "usr_admin",
    email: "admin@filmflex.tv",
    password: "admin123",
    name: "Administrateur FilmFlex",
    role: "admin",
    isSubscribed: true,
    subscriptionPlan: "VIP_ANNUAL",
    subscriptionStatus: "active",
    subscriptionStartedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: DEFAULT_PROFILES,
    activeProfileId: DEFAULT_PROFILES[0].id,
    maxScreens: 4,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "usr_vip_client",
    email: "subscriber@filmflex.tv",
    password: "filmflex2026",
    name: "Client VIP Standard",
    role: "user",
    isSubscribed: true,
    subscriptionPlan: "VIP_MONTHLY",
    subscriptionStatus: "active",
    subscriptionStartedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: DEFAULT_PROFILES,
    activeProfileId: DEFAULT_PROFILES[0].id,
    maxScreens: 2,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "usr_expired_demo",
    email: "expire@filmflex.tv",
    password: "123456",
    name: "Abonné Expiré (Test)",
    role: "user",
    isSubscribed: false,
    subscriptionPlan: "VIP_MONTHLY",
    subscriptionStatus: "expired",
    subscriptionStartedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    subscriptionExpiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: DEFAULT_PROFILES,
    activeProfileId: DEFAULT_PROFILES[0].id,
    maxScreens: 2,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Retrieve all registered users from database / localStorage
 */
export function getAllUsers(): UserAccount[] {
  if (typeof window === "undefined") return INITIAL_ACCOUNTS;
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (!raw) {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    const parsed: UserAccount[] = JSON.parse(raw);
    // Auto check expiration for all users
    return parsed.map((u) => checkSubscriptionValidity(u));
  } catch {
    return INITIAL_ACCOUNTS;
  }
}

/**
 * Save users list to database
 */
export function saveAllUsers(users: UserAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save users database", e);
  }
}

/**
 * Automatically verify if subscription is active or expired.
 * If expired, immediately cuts access (isSubscribed = false).
 */
export function checkSubscriptionValidity(user: UserAccount): UserAccount {
  if (user.role === "admin") {
    return {
      ...user,
      isSubscribed: true,
      subscriptionStatus: "active",
    };
  }

  if (!user.subscriptionExpiresAt) {
    return {
      ...user,
      isSubscribed: false,
      subscriptionStatus: "expired",
    };
  }

  const now = Date.now();
  const expireTime = new Date(user.subscriptionExpiresAt).getTime();

  if (expireTime <= now) {
    return {
      ...user,
      isSubscribed: false,
      subscriptionStatus: "expired",
    };
  }

  return {
    ...user,
    isSubscribed: true,
    subscriptionStatus: "active",
  };
}

/**
 * Calculate remaining days or how long ago it expired
 */
export function getRemainingDays(expiresAt?: string): {
  days: number;
  isExpired: boolean;
  text: string;
} {
  if (!expiresAt) {
    return { days: 0, isExpired: true, text: "Aucun abonnement" };
  }

  const now = Date.now();
  const expireTime = new Date(expiresAt).getTime();
  const diffMs = expireTime - now;
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (days > 0) {
    return { days, isExpired: false, text: `${days} jours restants` };
  } else if (days === 0) {
    return { days: 0, isExpired: false, text: "Expire aujourd'hui" };
  } else {
    return { days: Math.abs(days), isExpired: true, text: `Expiré depuis ${Math.abs(days)} j` };
  }
}

/**
 * Login user by email & password
 */
export function loginUser(
  email: string,
  password?: string
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();

  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    return { success: false, error: "Adresse e-mail introuvable." };
  }

  if (password && found.password && found.password !== password) {
    return { success: false, error: "Mot de passe incorrect." };
  }

  const refreshedUser = checkSubscriptionValidity(found);
  return { success: true, user: refreshedUser };
}

/**
 * Register a new user
 */
export function registerUser(
  email: string,
  password: string,
  name: string
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: "Cette adresse e-mail est déjà inscrite." };
  }

  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    email: cleanEmail,
    password,
    name: name.trim() || "Nouveau Membre",
    role: "user",
    isSubscribed: true, // Free 7-day trial on registration
    subscriptionPlan: "FREE_TRIAL",
    subscriptionStatus: "active",
    subscriptionStartedAt: new Date().toISOString(),
    subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: [
      {
        id: `prof_${Date.now()}_1`,
        name: name.trim() || "Profil Principal",
        avatar: "/avatars/avatar1.png",
      },
      {
        id: `prof_${Date.now()}_2`,
        name: "Kids",
        avatar: "/avatars/avatar2.png",
        isKids: true,
      },
    ],
    activeProfileId: `prof_${Date.now()}_1`,
    maxScreens: 2,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveAllUsers(users);
  return { success: true, user: newUser };
}

/**
 * ADMIN: Update or prolong user subscription
 */
export function adminUpdateSubscription(
  userId: string,
  daysToAdd: number
): UserAccount | null {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  const target = users[idx];
  const currentExpiry = target.subscriptionExpiresAt
    ? new Date(target.subscriptionExpiresAt).getTime()
    : Date.now();

  const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
  const newExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

  users[idx] = {
    ...target,
    isSubscribed: true,
    subscriptionStatus: "active",
    subscriptionExpiresAt: newExpiry,
    subscriptionStartedAt: target.subscriptionStartedAt || new Date().toISOString(),
  };

  saveAllUsers(users);
  return users[idx];
}

/**
 * ADMIN: Immediately cut subscription (y9oss 3lih direct)
 */
export function adminCutSubscription(userId: string): UserAccount | null {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    isSubscribed: false,
    subscriptionStatus: "expired",
    subscriptionExpiresAt: new Date(Date.now() - 1000).toISOString(),
  };

  saveAllUsers(users);
  return users[idx];
}

/**
 * ADMIN: Create account with custom subscription period
 */
export function adminCreateUser(data: {
  email: string;
  password?: string;
  name?: string;
  role?: "user" | "admin";
  days: number;
  maxScreens?: number;
}): UserAccount {
  const users = getAllUsers();
  const cleanEmail = data.email.trim().toLowerCase();

  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    email: cleanEmail,
    password: data.password || "filmflex123",
    name: data.name?.trim() || cleanEmail.split("@")[0],
    role: data.role || "user",
    isSubscribed: data.days > 0,
    subscriptionPlan: data.days >= 360 ? "VIP_ANNUAL" : "VIP_MONTHLY",
    subscriptionStatus: data.days > 0 ? "active" : "expired",
    subscriptionStartedAt: new Date().toISOString(),
    subscriptionExpiresAt:
      data.days > 0
        ? new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 1000).toISOString(),
    profiles: [
      {
        id: `prof_${Date.now()}_1`,
        name: data.name?.trim() || "Profil 1",
        avatar: "/avatars/avatar1.png",
      },
      {
        id: `prof_${Date.now()}_2`,
        name: "Profil 2",
        avatar: "/avatars/avatar2.png",
      },
    ],
    activeProfileId: `prof_${Date.now()}_1`,
    maxScreens: data.maxScreens || 2,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveAllUsers(users);
  return newUser;
}

/**
 * ADMIN: Delete user
 */
export function adminDeleteUser(userId: string): boolean {
  let users = getAllUsers();
  const initialLength = users.length;
  users = users.filter((u) => u.id !== userId);
  if (users.length !== initialLength) {
    saveAllUsers(users);
    return true;
  }
  return false;
}

// =========================================================================
// CONCURRENT STREAM / DEVICE LIMIT TRACKING (MAX 2 ECRANS SIMULTANES)
// =========================================================================

function getDeviceId(): string {
  if (typeof window === "undefined") return "server_device";
  let id = sessionStorage.getItem("filmflex_device_session_id");
  if (!id) {
    id = `dev_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    sessionStorage.setItem("filmflex_device_session_id", id);
  }
  return id;
}

interface ActiveSession {
  deviceId: string;
  lastHeartbeat: number;
}

/**
 * Get active watching sessions count for a user
 */
export function getActiveSessionsCount(userId: string): number {
  if (typeof window === "undefined" || !userId) return 0;
  try {
    const raw = localStorage.getItem(`${SESSIONS_PREFIX}${userId}`);
    if (!raw) return 0;
    const list: ActiveSession[] = JSON.parse(raw);
    const now = Date.now();
    // Sessions older than 25 seconds are expired / inactive
    const active = list.filter((s) => now - s.lastHeartbeat < 25000);
    return active.length;
  } catch {
    return 0;
  }
}

/**
 * Start watching session and enforce MAX 2 SCREENS
 */
export function startWatchingSession(
  userId: string,
  maxScreens = 2
): { allowed: boolean; activeCount: number; maxScreens: number } {
  if (typeof window === "undefined" || !userId) {
    return { allowed: true, activeCount: 1, maxScreens };
  }

  const deviceId = getDeviceId();
  const key = `${SESSIONS_PREFIX}${userId}`;
  const now = Date.now();

  try {
    const raw = localStorage.getItem(key);
    let list: ActiveSession[] = raw ? JSON.parse(raw) : [];

    // Filter out stale sessions (> 25 seconds without heartbeat)
    list = list.filter((s) => now - s.lastHeartbeat < 25000);

    const isAlreadyActive = list.some((s) => s.deviceId === deviceId);

    if (!isAlreadyActive && list.length >= maxScreens) {
      // Exceeded max concurrent screens limit!
      return { allowed: false, activeCount: list.length, maxScreens };
    }

    // Register or renew device heartbeat
    const updated = list.filter((s) => s.deviceId !== deviceId);
    updated.push({ deviceId, lastHeartbeat: now });
    localStorage.setItem(key, JSON.stringify(updated));

    return { allowed: true, activeCount: updated.length, maxScreens };
  } catch {
    return { allowed: true, activeCount: 1, maxScreens };
  }
}

/**
 * Stop watching session
 */
export function stopWatchingSession(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  const deviceId = getDeviceId();
  const key = `${SESSIONS_PREFIX}${userId}`;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const list: ActiveSession[] = JSON.parse(raw);
    const remaining = list.filter((s) => s.deviceId !== deviceId);
    localStorage.setItem(key, JSON.stringify(remaining));
  } catch {}
}

/**
 * ADMIN: Reset active sessions for a user
 */
export function adminResetSessions(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.removeItem(`${SESSIONS_PREFIX}${userId}`);
  } catch {}
}
