import { GitHubIssue } from '@/types/github';

const GITHUB_API_BASE = 'https://api.github.com';

export async function fetchIssues(repo: string): Promise<GitHubIssue[]> {
  if (!repo || !repo.includes('/')) return [];
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repo}/issues?state=all&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'cognition-deliverable-app'
        },
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      // If repo is not found or not public, return empty array
      return [];
    }

    const issues = await response.json();
    return issues as GitHubIssue[];
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
} 