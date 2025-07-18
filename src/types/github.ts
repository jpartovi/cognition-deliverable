export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
  default: boolean;
}

export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description?: string;
  state: 'open' | 'closed';
  due_on?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  locked: boolean;
  assignee?: GitHubUser;
  assignees: GitHubUser[];
  milestone?: GitHubMilestone;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  author_association: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  repository_url: string;
  html_url: string;
  url: string;
  node_id: string;
  active_lock_reason?: string;
  body_html?: string;
  body_text?: string;
  timeline_url?: string;
  performed_via_github_app?: boolean;
  reactions?: {
    url: string;
    total_count: number;
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface GitHubIssueSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

export interface GitHubIssueCreateRequest {
  title: string;
  body?: string;
  assignees?: string[];
  milestone?: number;
  labels?: string[];
}

export interface GitHubIssueUpdateRequest {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  assignees?: string[];
  milestone?: number | null;
  labels?: string[];
}
