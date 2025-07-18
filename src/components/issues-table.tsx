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
import { RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchIssues } from "@/lib/github-api";
import { IssueDrawer } from "./issue-drawer";

export function IssuesTable() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedIssues = await fetchIssues();
      setIssues(fetchedIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);


  const getStateColor = (state: string) => {
    return state === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const handleRowClick = (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading issues...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>Error loading issues</span>
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={loadIssues} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No issues found</p>
          <Button onClick={loadIssues} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {issues.length} issues
          </span>
          <Button onClick={loadIssues} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
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

      <IssueDrawer 
        issue={selectedIssue}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}           