"use client";

import { GitHubIssue } from "@/types/github";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchIssues } from "@/lib/github-api";
import { IssueSheet } from "./issue-sheet";
import { Input } from "@/components/ui/input";

export function IssuesTable() {
  const [repo, setRepo] = useState("");
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isIssueSheetOpen, setIsIssueSheetOpen] = useState(false);

  const isValidRepo = repo.includes("/") && repo.split("/").length === 2;

  const loadIssues = async () => {
    if (!isValidRepo) {
      setIssues([]);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedIssues = await fetchIssues(repo);
      setIssues(fetchedIssues);
      if (fetchedIssues.length === 0) {
        setError("No issues found or invalid public repo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem("devinRepo") : null;
    if (stored) {
      setRepo(stored);
    }
  }, []);

  const handleRepoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepo(e.target.value);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("devinRepo", e.target.value);
    }
  };

  useEffect(() => {
    if (isValidRepo) {
      loadIssues();
    } else {
      setIssues([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo]);


  const getStateColor = (state: string) => {
    return state === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const handleRowClick = (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    setIsIssueSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Issues</h2>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 w-full max-w-md">
          <Input
            placeholder="Enter public repo that is connected to Devin (owner/repo)"
            value={repo}
            onChange={handleRepoChange}
            className="min-w-[420px]"
          />
          <Button onClick={loadIssues} variant="outline" size="sm" disabled={!isValidRepo || loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">{issues.length} issues</span>
      </div>
      {/* Error or prompt for valid repo */}
      {!isValidRepo && (
        <div className="text-center text-muted-foreground py-4">Add a valid public repo (owner/repo)</div>
      )}
      {error && isValidRepo && (
        <div className="text-center text-red-600 py-4">{error}</div>
      )}
      {/* Table only if valid repo and issues exist */}
      {isValidRepo && !loading && issues.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="min-w-[300px]">Title</TableHead>
                <TableHead className="w-[100px]">State</TableHead>
                <TableHead className="w-[120px]">Assignee</TableHead>
                <TableHead className="w-[150px]">Labels</TableHead>
                <TableHead className="w-[100px]">Comments</TableHead>
                <TableHead className="w-[120px]">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow 
                  key={issue.id} 
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(issue)}
                >
                  <TableCell className="font-mono text-sm">
                    {issue.number}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-sm text-muted-foreground">
                        by {issue.user.login}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={getStateColor(issue.state)}
                    >
                      {issue.state}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {issue.assignee ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={issue.assignee.avatar_url} />
                          <AvatarFallback>
                            {issue.assignee.login.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{issue.assignee.login}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {issue.labels.slice(0, 3).map((label) => (
                        <Badge
                          key={label.id}
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: `#${label.color}`,
                            color: parseInt(label.color, 16) > 0x888888 ? 'white' : 'black',
                            borderColor: `#${label.color}`,
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                      {issue.labels.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{issue.labels.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{issue.comments}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading issues...</span>
          </div>
        </div>
      )}
      {/* IssueSheet remains unchanged */}
      <IssueSheet 
        issue={selectedIssue}
        isOpen={isIssueSheetOpen}
        onOpenChange={setIsIssueSheetOpen}
      />
    </div>
  );
}           