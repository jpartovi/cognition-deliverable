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
import { RefreshCw, Search, Filter, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchIssues } from "@/lib/github-api";
import { IssueSheet } from "./issue-sheet";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterState {
  states: string[];
  labels: string[];
  assignees: string[];
  search: string;
}

export function IssuesTable() {
  const [repo, setRepo] = useState("");
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isIssueSheetOpen, setIsIssueSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    states: ["open"],
    labels: [],
    assignees: [],
    search: "",
  });

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
      } else {
        setError(null);
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

  const uniqueLabels = useMemo(() => {
    const labelSet = new Set<string>();
    issues.forEach(issue => {
      issue.labels.forEach(label => labelSet.add(label.name));
    });
    return Array.from(labelSet).sort();
  }, [issues]);

  const uniqueAssignees = useMemo(() => {
    const assigneeSet = new Set<string>();
    issues.forEach(issue => {
      if (issue.assignee) {
        assigneeSet.add(issue.assignee.login);
      }
    });
    return Array.from(assigneeSet).sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (filters.states.length > 0 && !filters.states.includes(issue.state)) {
        return false;
      }

      if (filters.labels.length > 0) {
        const issueLabels = issue.labels.map(label => label.name);
        const hasMatchingLabel = filters.labels.some(filterLabel => 
          issueLabels.includes(filterLabel)
        );
        if (!hasMatchingLabel) return false;
      }

      if (filters.assignees.length > 0) {
        if (!issue.assignee || !filters.assignees.includes(issue.assignee.login)) {
          return false;
        }
      }

      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(searchTerm);
        const matchesBody = issue.body?.toLowerCase().includes(searchTerm) || false;
        const matchesNumber = issue.number.toString().includes(searchTerm);
        const matchesAuthor = issue.user.login.toLowerCase().includes(searchTerm);
        
        if (!matchesTitle && !matchesBody && !matchesNumber && !matchesAuthor) {
          return false;
        }
      }

      return true;
    });
  }, [issues, filters]);

  const updateFilter = (key: keyof FilterState, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilterValue = (key: 'states' | 'labels' | 'assignees', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      states: ["open"],
      labels: [],
      assignees: [],
      search: "",
    });
  };

  const hasActiveFilters = filters.labels.length > 0 || 
    filters.assignees.length > 0 || 
    filters.search.trim() !== "" ||
    (filters.states.length !== 1 || !filters.states.includes("open"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Issues</h2>
      </div>
      <div className="flex flex-col gap-4">
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
          <span className="text-sm text-muted-foreground">
            {filteredIssues.length} of {issues.length} issues
          </span>
        </div>

        {isValidRepo && issues.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    State
                    {filters.states.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                        {filters.states.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Filter by state</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.states.includes("open")}
                    onCheckedChange={() => toggleFilterValue('states', 'open')}
                  >
                    Open
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.states.includes("closed")}
                    onCheckedChange={() => toggleFilterValue('states', 'closed')}
                  >
                    Closed
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {uniqueLabels.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Labels
                      {filters.labels.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                          {filters.labels.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                    <DropdownMenuLabel>Filter by labels</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {uniqueLabels.map(label => (
                      <DropdownMenuCheckboxItem
                        key={label}
                        checked={filters.labels.includes(label)}
                        onCheckedChange={() => toggleFilterValue('labels', label)}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {uniqueAssignees.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Assignees
                      {filters.assignees.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                          {filters.assignees.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                    <DropdownMenuLabel>Filter by assignees</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {uniqueAssignees.map(assignee => (
                      <DropdownMenuCheckboxItem
                        key={assignee}
                        checked={filters.assignees.includes(assignee)}
                        onCheckedChange={() => toggleFilterValue('assignees', assignee)}
                      >
                        {assignee}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        )}
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
              {filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No issues match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues.map((issue) => (
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
                ))
              )}
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