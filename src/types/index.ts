export interface User {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface Post {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  media_urls?: string[];
  target_user_id?: string;
  target_group_id?: string;
  target_group_name?: string;
  user_role?: string;
  created_at: string;
  reactions_count: number;
  my_reaction: boolean;
}

export interface Group {
  id: string;
  name: string;
  created_by?: string;
  members?: string[];
}
