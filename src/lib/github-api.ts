import { GitHubIssue, GitHubIssueSearchResponse } from '@/types/github';

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'jpartovi';
const REPO_NAME = 'cognition-deliverable';

export async function fetchIssues(): Promise<GitHubIssue[]> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'cognition-deliverable-app'
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const issues = await response.json();
    return issues as GitHubIssue[];
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
}

export async function searchIssues(query: string): Promise<GitHubIssueSearchResponse> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+${encodeURIComponent(query)}&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'cognition-deliverable-app'
        },
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const searchResponse = await response.json();
    return searchResponse as GitHubIssueSearchResponse;
  } catch (error) {
    console.error('Error searching issues:', error);
    throw error;
  }
} 