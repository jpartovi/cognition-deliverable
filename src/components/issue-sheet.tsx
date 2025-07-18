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
import { ExternalLink, X, Brain, Loader2, Play, CheckCircle } from "lucide-react";
import { useState } from "react";
import { createDevinSession, generateIssueScopingPrompt, sendImplementationMessage, pollSessionUntilComplete } from "@/lib/devin-api";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface IssueSheetProps {
  issue: GitHubIssue | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueSheet({ issue, isOpen, onOpenChange }: IssueSheetProps) {
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImplementing, setIsImplementing] = useState(false);
  const [isScopingComplete, setIsScopingComplete] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingStatus, setPollingStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const getStateColor = (state: string) => {
    return state === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const handleScopeWithDevin = async () => {
    if (!issue) return;
    try {
      setIsCreatingSession(true);
      setError(null);
      setIsScopingComplete(false);
      setPollingStatus("");
      setDialogOpen(true);

      const prompt = generateIssueScopingPrompt({
        title: issue.title,
        body: issue.body,
        number: issue.number,
        html_url: issue.html_url,
        labels: issue.labels,
      });
      const session = await createDevinSession(prompt, `GitHub Issue #${issue.number}: ${issue.title}`);
      setSessionId(session.session_id);
      setSessionUrl(session.url);

      setIsPolling(true);
      setPollingStatus("Devin is analyzing the issue...");
      try {
        await pollSessionUntilComplete(session.session_id, (status) => {
          setPollingStatus(`Devin is ${status}...`);
        });
        setIsScopingComplete(true);
        setPollingStatus("");
      } catch (pollError) {
        console.error("Failed to poll session:", pollError);
        setError("Session polling failed. You can still manually check the session.");
      } finally {
        setIsPolling(false);
      }
    } catch (error) {
      console.error("Failed to create Devin session:", error);
      setError(error instanceof Error ? error.message : "Failed to create session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleImplementWithDevin = async () => {
    if (!sessionId) return;

    try {
      setIsImplementing(true);
      setError(null);

      await sendImplementationMessage(sessionId);


    } catch (error) {
      console.error('Failed to send implementation message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send implementation message');
    } finally {
      setIsImplementing(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[90vh]">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-center">
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

            {(sessionUrl || error) && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Devin Session
                </h4>

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
                  <div className="space-y-3">
                    <div className="text-sm">
                      <a 
                        href={sessionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Devin Session
                      </a>
                    </div>

                    {sessionId && (
                      <Button
                        onClick={handleImplementWithDevin}
                        disabled={isImplementing}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {isImplementing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending Implementation Request...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Implement Solution
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="pt-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleScopeWithDevin}
                disabled={!issue || isCreatingSession}
                className="flex-1"
              >
                {isCreatingSession ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Scope with Devin
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Devin Session</DialogTitle>
                <DialogDescription>
                  Use the link below to open the Devin session. Once scoping is complete, you can complete the issue with Devin.
                </DialogDescription>
              </DialogHeader>
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-2">
                  <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <div className="font-medium">Session Error</div>
                    <div className="mt-1">{error}</div>
                  </div>
                </div>
              )}
              {sessionUrl ? (
                <div className="space-y-4">
                  <a
                    href={sessionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                  >
                    Open Devin Session
                  </a>
                  <Button
                    onClick={handleImplementWithDevin}
                    disabled={!isScopingComplete || isImplementing}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isImplementing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending Implementation Request...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Complete Issue with Devin
                      </>
                    )}
                  </Button>
                  {isPolling && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {pollingStatus}
                    </div>
                  )}
                  {isScopingComplete && !isPolling && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Scoping complete! You can now complete the issue.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Creating session...</div>
              )}
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
