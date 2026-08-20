export const globalForMock = global as unknown as {
  mockDb: {
    users: Record<string, any>;
    posts: any[];
    reactions: Set<string>;
    groups: any[];
    group_members: any[];
    profiles: Record<string, any>;
  }
};

export function initMockStore() {
  if (!globalForMock.mockDb) {
    const oneYearFuture = new Date();
    oneYearFuture.setFullYear(oneYearFuture.getFullYear() + 1);

    const oneDayPast = new Date();
    oneDayPast.setDate(oneDayPast.getDate() - 1);

    globalForMock.mockDb = {
      users: {
        member_user: { user_id: 'member_user', role: 'member', expires_at: oneYearFuture.toISOString() },
        admin_user: { user_id: 'admin_user', role: 'admin', expires_at: oneYearFuture.toISOString() },
        expired_user: { user_id: 'expired_user', role: 'member', expires_at: oneDayPast.toISOString() },
        user_a: { user_id: 'user_a', role: 'member', expires_at: oneYearFuture.toISOString() },
        user_b: { user_id: 'user_b', role: 'member', expires_at: oneYearFuture.toISOString() },
        user_c: { user_id: 'user_c', role: 'member', expires_at: oneYearFuture.toISOString() },
        user_d: { user_id: 'user_d', role: 'member', expires_at: oneYearFuture.toISOString() },
        user_e: { user_id: 'user_e', role: 'member', expires_at: oneYearFuture.toISOString() },
        user_f: { user_id: 'user_f', role: 'member', expires_at: oneYearFuture.toISOString() },
        user_g: { user_id: 'user_g', role: 'member', expires_at: oneYearFuture.toISOString() },
        user_h: { user_id: 'user_h', role: 'member', expires_at: oneYearFuture.toISOString() },
      },
      profiles: {},
      posts: [
        {
          id: 'post-1',
          user_id: 'admin_user',
          user_name: 'システム管理者 (佐藤)',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
          content: '【業務連絡】本日よりビジネスSNSベースキットのテスト運用を開始します。フィードバックをお願いいたします。',
          media_urls: [],
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'post-2',
          user_id: 'member_user',
          user_name: '一般ユーザー (山田)',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=User',
          content: '承知いたしました！UIの動作も非常にスムーズです。画像をテスト添付してみます。',
          media_urls: ['https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop'],
          created_at: new Date(Date.now() - 1800000).toISOString(),
        }
      ],
      reactions: new Set<string>(['member_user:post-1']),
      groups: [],
      group_members: [],
    };
  }

  const mockStore = globalForMock.mockDb;

  // HMR等で既に存在する場合でも、新しいプロパティやユーザーが欠落している可能性があるのでフォールバック
  if (mockStore) {
    if (!mockStore.profiles) {
      mockStore.profiles = {};
    }
    if (!mockStore.users['user_a']) {
      const oneYearFuture = new Date();
      oneYearFuture.setFullYear(oneYearFuture.getFullYear() + 1);
      const futureIso = oneYearFuture.toISOString();
      ['user_a', 'user_b', 'user_c', 'user_d', 'user_e', 'user_f', 'user_g', 'user_h'].forEach(uid => {
        mockStore.users[uid] = { user_id: uid, role: 'member', expires_at: futureIso };
      });
    }
  }

  return mockStore;
}

export function createMockSupabase() {
  const mockStore = initMockStore();
  console.log('[Supabase Mock] Active in-memory mockup mode');
  
  return {
    channel: (name: string) => ({
      on: function(event: string, filter: any, callback: any) { return this; },
      subscribe: () => ({}),
      send: async (payload: any) => { return 'ok'; }
    }),
    removeChannel: () => ({}),
    
    from: (table: string) => {
      if (table === 'plugin_user_ext_status') {
        return {
          select: (fields?: string) => ({
            eq: (field: string, val: string) => ({
              single: async () => {
                const user = mockStore.users[val];
                if (user) {
                  return { data: user, error: null };
                }
                return { data: null, error: { message: 'User not found' } };
              }
            }),
            order: () => ({ data: Object.values(mockStore.users), error: null })
          }),
          update: (data: any) => ({
            eq: async (field: string, val: string) => {
              if (field === 'user_id' && mockStore.users[val]) {
                mockStore.users[val] = { ...mockStore.users[val], ...data };
                return { error: null };
              }
              return { error: { message: 'User not found' } };
            }
          }),
          delete: () => ({
            eq: async (field: string, val: string) => {
              if (field === 'user_id') {
                delete mockStore.users[val];
                return { error: null };
              }
              return { error: { message: 'Invalid field' } };
            }
          })
        };
      }
      if (table === 'plugin_sns_reactions') {
        return {
          select: (fields: string, options: any) => ({
            eq: (field: string, val: string) => {
              const count = Array.from(mockStore.reactions).filter(r => r.endsWith(`:${val}`)).length;
              return {
                data: null,
                count,
                error: null
              };
            }
          })
        };
      }
      if (table === 'plugin_audit_logs') {
        return {
          select: () => ({
            order: () => ({
              limit: () => ({ data: [], error: null })
            })
          })
        };
      }
      if (table === 'plugin_note_auth_config') {
        return {
          select: (fields: string) => ({
            eq: (field: string, val: string) => ({
              maybeSingle: async () => {
                // note123 をデモ用有効コードとする
                if (val === 'note123') {
                  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  return { data: { code_token: 'note123', target_month: 'monthly', valid_until: future.toISOString() }, error: null };
                }
                return { data: null, error: null };
              }
            })
          })
        };
      }
      if (table === 'plugin_sns_groups') {
        return {
          select: () => ({
            order: () => ({ data: mockStore.groups, error: null }),
            in: (field: string, values: any[]) => {
              const filtered = mockStore.groups.filter(g => values.includes(g.id));
              return { data: filtered, error: null };
            }
          }),
          insert: (data: any) => ({
            select: () => ({
              single: async () => {
                const newGroup = { id: `group-${Date.now()}`, ...data[0], created_at: new Date().toISOString() };
                mockStore.groups.push(newGroup);
                return { data: newGroup, error: null };
              }
            })
          })
        };
      }
      if (table === 'plugin_sns_group_members') {
        return {
          select: () => ({
            eq: (field: string, val: string) => {
              if (field === 'user_id') {
                const filtered = mockStore.group_members.filter(m => m.user_id === val);
                return { data: filtered, error: null };
              }
              return { data: [], error: null };
            }
          }),
          insert: async (data: any) => {
            mockStore.group_members.push(...data);
            return { error: null };
          }
        };
      }
      if (table === 'plugin_sns_profiles') {
        return {
          select: () => ({ eq: (col: string, val: string) => ({ 
            single: async () => {
              const profile = mockStore.profiles[val];
              if (profile) return { data: profile, error: null };
              return { data: null, error: { code: 'PGRST116' } };
            }
          })})
        };
      }
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: 'Not implemented' }), maybeSingle: async () => ({ data: null, error: null }) }) })
      };
    },
    
    rpc: async (name: string, args: any) => {
      if (name === 'plugin_get_groups') {
        return { data: mockStore.groups, error: null };
      }
      if (name === 'plugin_create_group') {
        const newGroup = {
          id: `group-${Date.now()}`,
          name: args.p_name,
          created_by: args.p_user_id,
          created_at: new Date().toISOString()
        };
        mockStore.groups.push(newGroup);
        if (args.p_members && Array.isArray(args.p_members)) {
          args.p_members.forEach((m: string) => {
            mockStore.group_members.push({ group_id: newGroup.id, user_id: m });
          });
        }
        return { data: newGroup, error: null };
      }
      if (name === 'plugin_delete_group') {
        const initialLength = mockStore.groups.length;
        mockStore.groups = mockStore.groups.filter(g => g.id !== args.p_group_id);
        mockStore.group_members = mockStore.group_members.filter(m => m.group_id !== args.p_group_id);
        return { data: mockStore.groups.length < initialLength, error: null };
      }

      if (name === 'plugin_get_posts') {
        const userId = args.p_user_id;
        let postsWithMyReaction = mockStore.posts.map(p => {
          const hasReacted = mockStore.reactions.has(`${userId}:${p.id}`);
          const count = Array.from(mockStore.reactions).filter(r => r.endsWith(`:${p.id}`)).length;
          
          // プロフィール情報で上書き
          const prof = mockStore.profiles[p.user_id];
          const displayName = prof ? prof.display_name : p.user_name;
          const avatarUrl = prof && prof.avatar_url ? prof.avatar_url : p.avatar_url;
          const userObj = mockStore.users[p.user_id];
          const userRole = userObj ? userObj.role : 'member';
          
          return {
            ...p,
            user_name: displayName,
            avatar_url: avatarUrl,
            user_role: userRole,
            reactions_count: count,
            my_reaction: hasReacted
          };
        });
        
        // Filter by target_user_id or target_group_id
        postsWithMyReaction = postsWithMyReaction.filter(p => {
          if (!p.target_user_id && !p.target_group_id) return true;
          if (p.target_user_id === userId || p.user_id === userId) return true;
          if (p.target_group_id) {
            const isMember = mockStore.group_members.some(m => m.group_id === p.target_group_id && m.user_id === userId);
            if (isMember) return true;
          }
          return false;
        });
        
        postsWithMyReaction.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { data: postsWithMyReaction, error: null };
      }
      
      if (name === 'plugin_create_post') {
        const newPost = {
          id: `post-${Date.now()}`,
          user_id: args.p_user_id,
          user_name: args.p_user_name,
          avatar_url: args.p_avatar_url || ('https://api.dicebear.com/7.x/initials/svg?seed=' + args.p_user_id),
          content: args.p_content,
          media_urls: args.p_media_urls || [],
          target_user_id: args.p_target_user_id || null,
          target_group_id: args.p_target_group_id || null,
          created_at: new Date().toISOString()
        };
        mockStore.posts.unshift(newPost);
        return { data: newPost, error: null };
      }
      
      if (name === 'plugin_delete_post') {
        const postId = args.p_post_id;
        const initialLength = mockStore.posts.length;
        mockStore.posts = mockStore.posts.filter(p => p.id !== postId);
        return { data: mockStore.posts.length < initialLength, error: null };
      }
      
      if (name === 'plugin_toggle_reaction') {
        const userId = args.p_user_id;
        const postId = args.p_post_id;
        const key = `${userId}:${postId}`;
        let active = false;
        if (mockStore.reactions.has(key)) {
          mockStore.reactions.delete(key);
          active = false;
        } else {
          mockStore.reactions.add(key);
          active = true;
        }
        return { data: active, error: null };
      }
      
      if (name === 'plugin_update_user_expiry') {
        const userId = args.p_user_id;
        const expiresAt = args.p_expires_at;
        const operator = args.p_operator || userId;
        if (mockStore.users[userId]) {
          mockStore.users[userId].expires_at = expiresAt;
          mockStore.users[userId].updated_by = operator;
        } else {
          mockStore.users[userId] = {
            user_id: userId,
            role: 'member',
            expires_at: expiresAt,
            updated_by: operator
          };
        }
        return { data: true, error: null };
      }
      
      if (name === 'plugin_update_profile') {
        const userId = args.p_user_id;
        const displayName = args.p_display_name;
        const avatarUrl = args.p_avatar_url;
        
        mockStore.profiles[userId] = {
          user_id: userId,
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        };
        return { data: true, error: null };
      }
      
      return { data: null, error: 'Unknown RPC' };
    },
    
    storage: {
      from: (bucket: string) => ({
        upload: async (filePath: string, fileData: any, options: any) => {
          return { data: { path: filePath }, error: null };
        },
        getPublicUrl: (filePath: string) => {
          const isDoc = filePath.endsWith('.pdf') || filePath.endsWith('.txt') || filePath.endsWith('.zip');
          const mockUrl = isDoc 
            ? ('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
            : ('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop');
          return { data: { publicUrl: mockUrl } };
        }
      })
    }
  };
}
