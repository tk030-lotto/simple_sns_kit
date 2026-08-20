// Browser-complete local storage manager for Business SNS Kit
export interface StoredUser {
  user_id: string;
  role: 'admin' | 'member';
  expires_at: string;
  display_name?: string;
  avatar_url?: string;
  updated_by?: string;
}

export interface StoredPost {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  content: string;
  media_urls?: string[];
  target_user_id?: string | null;
  target_group_id?: string | null;
  created_at: string;
}

export interface StoredGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface StoredGroupMember {
  group_id: string;
  user_id: string;
}

export interface StoredPassphrase {
  code_token: string;
  validity: string;
  valid_until: string;
  group_name?: string;
  created_at: string;
}

export interface StoredAuditLog {
  id: string;
  action: string;
  operator_id: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface StoredReaction {
  user_id: string;
  post_id: string;
}

const STORAGE_KEYS = {
  USERS: 'simple_sns_users',
  POSTS: 'simple_sns_posts',
  REACTIONS: 'simple_sns_reactions',
  GROUPS: 'simple_sns_groups',
  GROUP_MEMBERS: 'simple_sns_group_members',
  PASSPHRASES: 'simple_sns_passphrases',
  AUDIT_LOGS: 'simple_sns_audit_logs',
  CURRENT_USER: 'simple_sns_current_user_id',
  INITIALIZED: 'simple_sns_initialized_v2'
};

export class BrowserSnsStore {
  private static instance: BrowserSnsStore;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.ensureInitialData();
    }
  }

  public static getInstance(): BrowserSnsStore {
    if (!BrowserSnsStore.instance) {
      BrowserSnsStore.instance = new BrowserSnsStore();
    }
    return BrowserSnsStore.instance;
  }

  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Failed to get localStorage item [${key}]:`, e);
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to set localStorage item [${key}]:`, e);
    }
  }

  // 初期シードデータの投入
  public ensureInitialData(forceReset: boolean = false): void {
    if (typeof window === 'undefined') return;

    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (isInitialized && !forceReset) return;

    const oneYearFuture = new Date();
    oneYearFuture.setFullYear(oneYearFuture.getFullYear() + 1);
    const futureIso = oneYearFuture.toISOString();

    const initialUsers: Record<string, StoredUser> = {
      admin_user: {
        user_id: 'admin_user',
        role: 'admin',
        expires_at: futureIso,
        display_name: 'システム管理者 (佐藤)',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin'
      },
      member_user: {
        user_id: 'member_user',
        role: 'member',
        expires_at: futureIso,
        display_name: '一般ユーザー (山田)',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Yamada'
      },
      user_a: { user_id: 'user_a', role: 'member', expires_at: futureIso, display_name: 'Aさん', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=UserA' },
      user_b: { user_id: 'user_b', role: 'member', expires_at: futureIso, display_name: 'Bさん', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=UserB' },
      user_c: { user_id: 'user_c', role: 'member', expires_at: futureIso, display_name: 'Cさん', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=UserC' },
      user_d: { user_id: 'user_d', role: 'member', expires_at: futureIso, display_name: 'Dさん', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=UserD' },
      user_e: { user_id: 'user_e', role: 'member', expires_at: futureIso, display_name: 'Eさん', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=UserE' },
      user_f: { user_id: 'user_f', role: 'member', expires_at: futureIso, display_name: 'Fさん', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=UserF' },
      user_g: { user_id: 'user_g', role: 'member', expires_at: futureIso, display_name: 'Gさん', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=UserG' },
      user_h: { user_id: 'user_h', role: 'member', expires_at: futureIso, display_name: 'Hさん', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=UserH' },
      expired_user: {
        user_id: 'expired_user',
        role: 'member',
        expires_at: new Date(Date.now() - 86400000).toISOString(),
        display_name: '期限切れユーザー (田中)',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Tanaka'
      }
    };

    const initialGroups: StoredGroup[] = [
      {
        id: 'group-general',
        name: '全体アナウンス・連絡',
        created_by: 'admin_user',
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'group-dev',
        name: 'プロジェクト開発班',
        created_by: 'admin_user',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    const initialGroupMembers: StoredGroupMember[] = [
      { group_id: 'group-general', user_id: 'admin_user' },
      { group_id: 'group-general', user_id: 'member_user' },
      { group_id: 'group-general', user_id: 'user_a' },
      { group_id: 'group-general', user_id: 'user_b' },
      { group_id: 'group-dev', user_id: 'admin_user' },
      { group_id: 'group-dev', user_id: 'member_user' }
    ];

    const initialPosts: StoredPost[] = [
      {
        id: 'post-1',
        user_id: 'admin_user',
        user_name: 'システム管理者 (佐藤)',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
        content: '【業務連絡】業務用SNSシステム（ブラウザ完結版）の運用を開始いたします。外部サーバー接続なしで安全かつ軽快に動作します。',
        media_urls: [],
        target_group_id: 'group-general',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'post-2',
        user_id: 'member_user',
        user_name: '一般ユーザー (山田)',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Yamada',
        content: '確認いたしました。ブラウザのローカルストレージで高速に動作し、ファイル添付やリアクションもスムーズです！',
        media_urls: [],
        target_group_id: 'group-general',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    const initialReactions: StoredReaction[] = [
      { user_id: 'member_user', post_id: 'post-1' },
      { user_id: 'admin_user', post_id: 'post-2' }
    ];

    const initialPassphrases: StoredPassphrase[] = [
      {
        code_token: 'note123',
        validity: 'month',
        valid_until: futureIso,
        group_name: '一般参加グループ',
        created_at: new Date().toISOString()
      },
      {
        code_token: 'vip2026',
        validity: 'year',
        valid_until: futureIso,
        group_name: 'プロジェクト開発班',
        created_at: new Date().toISOString()
      }
    ];

    const initialLogs: StoredAuditLog[] = [
      {
        id: 'log-1',
        action: 'SYSTEM_INIT',
        operator_id: 'system',
        target_id: 'all',
        details: 'ブラウザストレージの初期化が完了しました。',
        created_at: new Date().toISOString()
      }
    ];

    this.setItem(STORAGE_KEYS.USERS, initialUsers);
    this.setItem(STORAGE_KEYS.GROUPS, initialGroups);
    this.setItem(STORAGE_KEYS.GROUP_MEMBERS, initialGroupMembers);
    this.setItem(STORAGE_KEYS.POSTS, initialPosts);
    this.setItem(STORAGE_KEYS.REACTIONS, initialReactions);
    this.setItem(STORAGE_KEYS.PASSPHRASES, initialPassphrases);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, initialLogs);
    this.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // --- Users & Profiles ---
  public getUsers(): StoredUser[] {
    const usersMap = this.getItem<Record<string, StoredUser>>(STORAGE_KEYS.USERS, {});
    return Object.values(usersMap);
  }

  public getUser(userId: string): StoredUser | null {
    const usersMap = this.getItem<Record<string, StoredUser>>(STORAGE_KEYS.USERS, {});
    return usersMap[userId] || null;
  }

  public updateUserProfile(userId: string, displayName: string, avatarUrl?: string): boolean {
    const usersMap = this.getItem<Record<string, StoredUser>>(STORAGE_KEYS.USERS, {});
    if (!usersMap[userId]) {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      usersMap[userId] = {
        user_id: userId,
        role: 'member',
        expires_at: future.toISOString(),
        display_name: displayName,
        avatar_url: avatarUrl
      };
    } else {
      usersMap[userId].display_name = displayName;
      if (avatarUrl) usersMap[userId].avatar_url = avatarUrl;
    }
    this.setItem(STORAGE_KEYS.USERS, usersMap);
    this.addAuditLog('UPDATE_PROFILE', userId, userId, `表示名を「${displayName}」に更新`);
    return true;
  }

  public updateUserRole(userId: string, newRole: 'admin' | 'member', operatorId: string = 'admin'): boolean {
    const usersMap = this.getItem<Record<string, StoredUser>>(STORAGE_KEYS.USERS, {});
    if (usersMap[userId]) {
      usersMap[userId].role = newRole;
      usersMap[userId].updated_by = operatorId;
      this.setItem(STORAGE_KEYS.USERS, usersMap);
      this.addAuditLog('UPDATE_ROLE', operatorId, userId, `権限を「${newRole}」に変更`);
      return true;
    }
    return false;
  }

  public deleteUser(userId: string, operatorId: string = 'admin'): boolean {
    const usersMap = this.getItem<Record<string, StoredUser>>(STORAGE_KEYS.USERS, {});
    if (usersMap[userId]) {
      delete usersMap[userId];
      this.setItem(STORAGE_KEYS.USERS, usersMap);
      this.addAuditLog('DELETE_USER', operatorId, userId, 'ユーザーアカウントを削除');
      return true;
    }
    return false;
  }

  public isUserActive(userId: string): boolean {
    const user = this.getUser(userId);
    if (!user) return true; // デフォルト許可
    const expires = new Date(user.expires_at).getTime();
    return expires > Date.now();
  }

  // --- Posts ---
  public getPosts(userId: string, groupId?: string | null): any[] {
    const posts = this.getItem<StoredPost[]>(STORAGE_KEYS.POSTS, []);
    const reactions = this.getItem<StoredReaction[]>(STORAGE_KEYS.REACTIONS, []);
    const usersMap = this.getItem<Record<string, StoredUser>>(STORAGE_KEYS.USERS, {});
    const groupMembers = this.getItem<StoredGroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, []);
    const groups = this.getItem<StoredGroup[]>(STORAGE_KEYS.GROUPS, []);
    const groupsMap = new Map(groups.map(g => [g.id, g.name]));

    const userGroupIds = new Set(
      groupMembers.filter(m => m.user_id === userId).map(m => m.group_id)
    );

    // 権限・フィルタリング
    let filtered = posts.filter(p => {
      // 特定グループ絞り込み
      if (groupId) {
        return p.target_group_id === groupId;
      }
      // 全体タブの場合
      if (!p.target_group_id && !p.target_user_id) return true; // パブリック
      if (p.target_user_id) {
        return p.target_user_id === userId || p.user_id === userId;
      }
      if (p.target_group_id) {
        return userGroupIds.has(p.target_group_id) || p.user_id === userId;
      }
      return true;
    });

    return filtered.map(p => {
      const user = usersMap[p.user_id];
      const reactionsCount = reactions.filter(r => r.post_id === p.id).length;
      const myReaction = reactions.some(r => r.post_id === p.id && r.user_id === userId);

      return {
        ...p,
        user_name: user?.display_name || p.user_name,
        avatar_url: user?.avatar_url || p.avatar_url,
        user_role: user?.role || 'member',
        target_group_name: p.target_group_id ? groupsMap.get(p.target_group_id) : undefined,
        reactions_count: reactionsCount,
        my_reaction: myReaction
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createPost(params: {
    userId: string;
    userName: string;
    avatarUrl?: string;
    content: string;
    mediaUrls?: string[];
    targetGroupId?: string | null;
    targetUserId?: string | null;
  }): any {
    const posts = this.getItem<StoredPost[]>(STORAGE_KEYS.POSTS, []);
    const user = this.getUser(params.userId);

    const newPost: StoredPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: params.userId,
      user_name: user?.display_name || params.userName,
      avatar_url: user?.avatar_url || params.avatarUrl,
      content: params.content,
      media_urls: params.mediaUrls || [],
      target_group_id: params.targetGroupId || null,
      target_user_id: params.targetUserId || null,
      created_at: new Date().toISOString()
    };

    posts.unshift(newPost);
    this.setItem(STORAGE_KEYS.POSTS, posts);
    return {
      ...newPost,
      user_role: user?.role || 'member',
      reactions_count: 0,
      my_reaction: false
    };
  }

  public deletePost(postId: string, userId: string): boolean {
    let posts = this.getItem<StoredPost[]>(STORAGE_KEYS.POSTS, []);
    const target = posts.find(p => p.id === postId);
    if (!target) return false;

    const user = this.getUser(userId);
    const isAdmin = user?.role === 'admin';
    if (target.user_id !== userId && !isAdmin) {
      return false;
    }

    posts = posts.filter(p => p.id !== postId);
    this.setItem(STORAGE_KEYS.POSTS, posts);

    // リアクションもクリーンアップ
    let reactions = this.getItem<StoredReaction[]>(STORAGE_KEYS.REACTIONS, []);
    reactions = reactions.filter(r => r.post_id !== postId);
    this.setItem(STORAGE_KEYS.REACTIONS, reactions);

    return true;
  }

  public toggleReaction(postId: string, userId: string): { myReaction: boolean; reactionsCount: number } {
    let reactions = this.getItem<StoredReaction[]>(STORAGE_KEYS.REACTIONS, []);
    const existingIndex = reactions.findIndex(r => r.post_id === postId && r.user_id === userId);
    let myReaction = false;

    if (existingIndex > -1) {
      reactions.splice(existingIndex, 1);
      myReaction = false;
    } else {
      reactions.push({ user_id: userId, post_id: postId });
      myReaction = true;
    }

    this.setItem(STORAGE_KEYS.REACTIONS, reactions);
    const count = reactions.filter(r => r.post_id === postId).length;
    return { myReaction, reactionsCount: count };
  }

  // --- Groups ---
  public getGroups(userId: string): StoredGroup[] {
    const groups = this.getItem<StoredGroup[]>(STORAGE_KEYS.GROUPS, []);
    const members = this.getItem<StoredGroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, []);
    const userGroupIds = new Set(members.filter(m => m.user_id === userId).map(m => m.group_id));

    return groups.filter(g => userGroupIds.has(g.id) || g.created_by === userId);
  }

  public createGroup(name: string, creatorId: string, memberIds: string[]): StoredGroup {
    const groups = this.getItem<StoredGroup[]>(STORAGE_KEYS.GROUPS, []);
    const members = this.getItem<StoredGroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, []);

    const newGroup: StoredGroup = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      created_by: creatorId,
      created_at: new Date().toISOString()
    };

    groups.push(newGroup);
    this.setItem(STORAGE_KEYS.GROUPS, groups);

    // 作成者と選択メンバーを追加
    const allMembers = Array.from(new Set([creatorId, ...memberIds]));
    allMembers.forEach(uid => {
      members.push({ group_id: newGroup.id, user_id: uid });
    });
    this.setItem(STORAGE_KEYS.GROUP_MEMBERS, members);

    this.addAuditLog('CREATE_GROUP', creatorId, newGroup.id, `グループ「${name}」を作成`);
    return newGroup;
  }

  public deleteGroup(groupId: string, userId: string): boolean {
    let groups = this.getItem<StoredGroup[]>(STORAGE_KEYS.GROUPS, []);
    const target = groups.find(g => g.id === groupId);
    if (!target) return false;

    const user = this.getUser(userId);
    if (target.created_by !== userId && user?.role !== 'admin') {
      return false;
    }

    groups = groups.filter(g => g.id !== groupId);
    this.setItem(STORAGE_KEYS.GROUPS, groups);

    let members = this.getItem<StoredGroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, []);
    members = members.filter(m => m.group_id !== groupId);
    this.setItem(STORAGE_KEYS.GROUP_MEMBERS, members);

    this.addAuditLog('DELETE_GROUP', userId, groupId, `グループ「${target.name}」を削除`);
    return true;
  }

  public leaveGroup(groupId: string, userId: string): boolean {
    let members = this.getItem<StoredGroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, []);
    members = members.filter(m => !(m.group_id === groupId && m.user_id === userId));
    this.setItem(STORAGE_KEYS.GROUP_MEMBERS, members);
    return true;
  }

  // --- Passphrases & Verification ---
  public getPassphrases(): StoredPassphrase[] {
    return this.getItem<StoredPassphrase[]>(STORAGE_KEYS.PASSPHRASES, []);
  }

  public createPassphrase(code: string, validity: string, groupName?: string, operatorId: string = 'admin'): StoredPassphrase {
    const passphrases = this.getItem<StoredPassphrase[]>(STORAGE_KEYS.PASSPHRASES, []);
    const validUntil = new Date();

    if (validity === 'day') validUntil.setDate(validUntil.getDate() + 1);
    else if (validity === 'week') validUntil.setDate(validUntil.getDate() + 7);
    else if (validity === 'year') validUntil.setFullYear(validUntil.getFullYear() + 1);
    else validUntil.setMonth(validUntil.getMonth() + 1); // default 1 month

    const newPass: StoredPassphrase = {
      code_token: code.trim(),
      validity,
      valid_until: validUntil.toISOString(),
      group_name: groupName?.trim() || undefined,
      created_at: new Date().toISOString()
    };

    passphrases.push(newPass);
    this.setItem(STORAGE_KEYS.PASSPHRASES, passphrases);

    // グループ名が指定されていたらグループも作成
    if (groupName?.trim()) {
      const groups = this.getItem<StoredGroup[]>(STORAGE_KEYS.GROUPS, []);
      if (!groups.some(g => g.name === groupName.trim())) {
        this.createGroup(groupName.trim(), operatorId, []);
      }
    }

    this.addAuditLog('CREATE_PASSPHRASE', operatorId, code, `合言葉「${code}」を作成 (有効期限: ${validUntil.toLocaleDateString()})`);
    return newPass;
  }

  public deletePassphrase(code: string, operatorId: string = 'admin'): boolean {
    let passphrases = this.getItem<StoredPassphrase[]>(STORAGE_KEYS.PASSPHRASES, []);
    passphrases = passphrases.filter(p => p.code_token !== code);
    this.setItem(STORAGE_KEYS.PASSPHRASES, passphrases);
    this.addAuditLog('DELETE_PASSPHRASE', operatorId, code, `合言葉「${code}」を削除`);
    return true;
  }

  public verifyCode(code: string, userId: string, displayName?: string): { success: boolean; expiresAt?: string; error?: string } {
    const passphrases = this.getItem<StoredPassphrase[]>(STORAGE_KEYS.PASSPHRASES, []);
    const target = passphrases.find(p => p.code_token.toLowerCase() === code.trim().toLowerCase());

    if (!target) {
      return { success: false, error: '合言葉が無効または見つかりません。' };
    }

    const validDate = new Date(target.valid_until);
    if (validDate.getTime() < Date.now()) {
      return { success: false, error: 'この合言葉は有効期限が切れています。' };
    }

    const usersMap = this.getItem<Record<string, StoredUser>>(STORAGE_KEYS.USERS, {});
    const existing = usersMap[userId];

    if (existing) {
      existing.expires_at = target.valid_until;
      if (displayName) existing.display_name = displayName;
    } else {
      usersMap[userId] = {
        user_id: userId,
        role: 'member',
        expires_at: target.valid_until,
        display_name: displayName || userId,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || userId)}`
      };
    }
    this.setItem(STORAGE_KEYS.USERS, usersMap);

    // 対象グループがある場合、参加
    if (target.group_name) {
      const groups = this.getItem<StoredGroup[]>(STORAGE_KEYS.GROUPS, []);
      const matchedGroup = groups.find(g => g.name === target.group_name);
      if (matchedGroup) {
        const members = this.getItem<StoredGroupMember[]>(STORAGE_KEYS.GROUP_MEMBERS, []);
        if (!members.some(m => m.group_id === matchedGroup.id && m.user_id === userId)) {
          members.push({ group_id: matchedGroup.id, user_id: userId });
          this.setItem(STORAGE_KEYS.GROUP_MEMBERS, members);
        }
      }
    }

    this.addAuditLog('VERIFY_SUCCESS', userId, code, `合言葉「${code}」で認証成功`);
    return { success: true, expiresAt: target.valid_until };
  }

  // --- Audit Logs ---
  public getAuditLogs(): StoredAuditLog[] {
    return this.getItem<StoredAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public addAuditLog(action: string, operatorId: string, targetId: string, details: string): void {
    const logs = this.getItem<StoredAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      operator_id: operatorId,
      target_id: targetId,
      details,
      created_at: new Date().toISOString()
    });
    // 最大100件保持
    if (logs.length > 100) logs.length = 100;
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // --- Backup & Restore ---
  public exportAllData(): string {
    const payload = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      users: this.getItem(STORAGE_KEYS.USERS, {}),
      posts: this.getItem(STORAGE_KEYS.POSTS, []),
      reactions: this.getItem(STORAGE_KEYS.REACTIONS, []),
      groups: this.getItem(STORAGE_KEYS.GROUPS, []),
      group_members: this.getItem(STORAGE_KEYS.GROUP_MEMBERS, []),
      passphrases: this.getItem(STORAGE_KEYS.PASSPHRASES, []),
      audit_logs: this.getItem(STORAGE_KEYS.AUDIT_LOGS, [])
    };
    return JSON.stringify(payload, null, 2);
  }

  public importData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.users) this.setItem(STORAGE_KEYS.USERS, data.users);
      if (data.posts) this.setItem(STORAGE_KEYS.POSTS, data.posts);
      if (data.reactions) this.setItem(STORAGE_KEYS.REACTIONS, data.reactions);
      if (data.groups) this.setItem(STORAGE_KEYS.GROUPS, data.groups);
      if (data.group_members) this.setItem(STORAGE_KEYS.GROUP_MEMBERS, data.group_members);
      if (data.passphrases) this.setItem(STORAGE_KEYS.PASSPHRASES, data.passphrases);
      if (data.audit_logs) this.setItem(STORAGE_KEYS.AUDIT_LOGS, data.audit_logs);
      this.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  }
}

export const browserStore = BrowserSnsStore.getInstance();
