export interface TeamMembership {
  teamId: string;
  teamName: string;
  role: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  teams: TeamMembership[];
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  handleOAuthCallback: (token: string) => Promise<void>;
}
