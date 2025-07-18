"use client";

import * as React from "react";
import { GitHubIssue } from "@/types/github";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, X, Brain, Loader2, Play } from "lucide-react";
import { useState } from "react";
import { createDevinSession, generateIssueScopingPrompt, sendMessageToSession, pollSessionUntilComplete, stringifyIssue, generateIssueCompletingPrompt } from "@/lib/devin-api";

interface IssueSheetProps {
  issue: GitHubIssue | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueSheet({ issue, isOpen, onOpenChange }: IssueSheetProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devinStatus, setDevinStatus] = useState<string>("");

  const getStateColor = (state: string) => {
    return state === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const handleDevinRequest = async (mode: "scope" | "complete") => {
    if (sessionId) {
      const noContextPrompt = mode === "scope"
        ? generateIssueScopingPrompt()
        : generateIssueCompletingPrompt();
      await sendMessageToSession(sessionId, noContextPrompt);
      // Start polling for status
      setDevinStatus("Polling Devin session status...");
      pollSessionUntilComplete(sessionId, (status) => setDevinStatus(`Devin status: ${status}`))
        .catch(() => setDevinStatus("Unable to get session status"));
      return { session_id: sessionId, url: sessionUrl };
    }
    if (!issue) throw new Error("No issue selected");
    let prompt: string;
    if (mode === "scope") {
      prompt = generateIssueScopingPrompt(issue);
    } else {
      prompt = generateIssueCompletingPrompt(issue);
    }
    const session = await createDevinSession(prompt, `GitHub Issue #${issue.number}: ${issue.title}`);
    setSessionId(session.session_id);
    setSessionUrl(session.url);
    // Start polling for status
    setDevinStatus("Polling Devin session status...");
    pollSessionUntilComplete(session.session_id, (status) => setDevinStatus(`Devin is ${status}`))
      .catch(() => setDevinStatus("Unable to get session status"));
    return session;
  };

  const handleScopeWithDevin = async () => {
    setError(null);
    try {
      await handleDevinRequest("scope");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create session");
    }
  };

  const handleCompleteWithDevin = async () => {
    setError(null);
    try {
      await handleDevinRequest("complete");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to complete with Devin");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="h-screen w-full max-w-xl">
        <SheetHeader className="pb-4">
          <div className="flex-1 min-w-0 text-center">
            <SheetTitle className="text-xl font-semibold mb-2">
              {issue?.title}
            </SheetTitle>
            <SheetDescription className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">#{issue?.number}</span>
              <span>•</span>
              <span>opened {issue && formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })} by {issue?.user.login}</span>
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="px-4 pb-4 flex-1 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={issue ? getStateColor(issue.state) : ""}
              >
                {issue?.state}
              </Badge>
              {issue && issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map((label) => (
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
                </div>
              )}
            </div>

            {issue?.assignee && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Assignee</h4>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={issue.assignee.avatar_url} />
                    <AvatarFallback>
                      {issue.assignee.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{issue.assignee.login}</span>
                </div>
              </div>
            )}

            {issue?.body && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Description</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3 max-h-60 overflow-y-auto">
                  {issue.body}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Comments:</span> {issue?.comments}
              </div>
              <div>
                <span className="font-medium">Created:</span> {issue && formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
              </div>
              <div>
                <span className="font-medium">Updated:</span> {issue && formatDistanceToNow(new Date(issue.updated_at), { addSuffix: true })}
              </div>
              {issue?.milestone && (
                <div>
                  <span className="font-medium">Milestone:</span> {issue.milestone.title}
                </div>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4">
          {(sessionUrl || error) && (
            <div className="space-y-3">

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <div className="font-medium">Session Error</div>
                    <div className="mt-1">{error}</div>
                  </div>
                </div>
              )}

              {sessionUrl && (
                <div className="text-center">
                  <a 
                    href={sessionUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 text-sm"
                  >
                    {devinStatus
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <ExternalLink className="h-3 w-3" />
                    }
                    {devinStatus ? `Session: ${devinStatus}` : "Devin Session"}
                  </a>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 w-full mb-2">
            <Button
              onClick={handleScopeWithDevin}
              disabled={!issue}
              className="flex-1"
              variant="default"
            >
              <><Brain className="h-4 w-4 mr-2" />Scope with Devin</>
            </Button>
            <Button
              onClick={handleCompleteWithDevin}
              disabled={!issue}
              className="flex-1"
              variant="secondary"
            >
              <><Play className="h-4 w-4 mr-2" />Complete with Devin</>
            </Button>
          </div>
          
          <Button asChild variant="outline" className="flex-1">
            <a 
              href={issue?.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
