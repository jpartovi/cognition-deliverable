"use client";

import * as React from "react";
import { GitHubIssue } from "@/types/github";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";

interface IssueDrawerProps {
  issue: GitHubIssue | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueDrawer({ issue, isOpen, onOpenChange }: IssueDrawerProps) {
  const getStateColor = (state: string) => {
    return state === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-4">
          <div className="flex items-start justify-center">
            <div className="flex-1 min-w-0 text-center">
              <DrawerTitle className="text-xl font-semibold mb-2">
                {issue?.title}
              </DrawerTitle>
              <DrawerDescription className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">#{issue?.number}</span>
                <span>•</span>
                <span>opened {issue && formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })} by {issue?.user.login}</span>
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

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

        <DrawerFooter className="pt-4">
          <Button asChild variant="outline" className="w-full">
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
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
