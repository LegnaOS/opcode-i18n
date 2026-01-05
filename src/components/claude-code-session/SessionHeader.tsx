import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Terminal,
  FolderOpen,
  Copy,
  GitBranch,
  Settings,
  Hash,
  Command,
  Code,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getIDEPreference, getIDECommand } from '@/components/ClickableFilePath';
import { useToast } from '@/hooks/use-toast';

interface SessionHeaderProps {
  projectPath: string;
  claudeSessionId: string | null;
  totalTokens: number;
  isStreaming: boolean;
  hasMessages: boolean;
  showTimeline: boolean;
  copyPopoverOpen: boolean;
  onBack: () => void;
  onSelectPath: () => void;
  onCopyAsJsonl: () => void;
  onCopyAsMarkdown: () => void;
  onToggleTimeline: () => void;
  onProjectSettings?: () => void;
  onSlashCommandsSettings?: () => void;
  setCopyPopoverOpen: (open: boolean) => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = React.memo(({
  projectPath,
  claudeSessionId,
  totalTokens,
  isStreaming,
  hasMessages,
  showTimeline,
  copyPopoverOpen,
  onBack,
  onSelectPath,
  onCopyAsJsonl,
  onCopyAsMarkdown,
  onToggleTimeline,
  onProjectSettings,
  onSlashCommandsSettings,
  setCopyPopoverOpen
}) => {
  const { toast } = useToast();

  // Open project in IDE
  const handleOpenInEditor = useCallback(async () => {
    if (!projectPath) return;
    try {
      const ide = getIDEPreference();
      const ideCommand = getIDECommand(ide);

      const { Command } = await import("@tauri-apps/plugin-shell");
      const command = Command.create(ideCommand, [projectPath]);
      await command.execute();

      toast({
        title: "Opening in IDE",
        description: `Opening project in ${ide}...`,
      });
    } catch (error) {
      console.error("Failed to open in IDE:", error);
      toast({
        title: "Error",
        description: "Failed to open project in IDE",
        variant: "destructive",
      });
    }
  }, [projectPath, toast]);

  // Open project in terminal
  const handleOpenInTerminal = useCallback(async () => {
    if (!projectPath) return;
    try {
      const { Command } = await import("@tauri-apps/plugin-shell");

      const platform = navigator.platform.toLowerCase();
      let command;

      if (platform.includes('mac') || platform.includes('darwin')) {
        command = Command.create("open", ["-a", "Terminal", projectPath]);
      } else if (platform.includes('win')) {
        command = Command.create("cmd", ["/c", "start", "cmd", "/k", `cd /d "${projectPath}"`]);
      } else {
        command = Command.create("x-terminal-emulator", ["--working-directory", projectPath]);
      }

      await command.execute();

      toast({
        title: "Opening Terminal",
        description: "Opening project directory in terminal...",
      });
    } catch (error) {
      console.error("Failed to open terminal:", error);
      toast({
        title: "Error",
        description: "Failed to open terminal",
        variant: "destructive",
      });
    }
  }, [projectPath, toast]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/95 backdrop-blur-sm border-b px-4 py-3 sticky top-0 z-40"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-semibold">Claude Code Session</span>
          </div>

          
          {!projectPath && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectPath}
              className="flex items-center gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              Select Project
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {claudeSessionId && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {claudeSessionId.slice(0, 8)}
              </Badge>
              {totalTokens > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalTokens.toLocaleString()} tokens
                </Badge>
              )}
            </div>
          )}

          {hasMessages && !isStreaming && (
            <Popover
              open={copyPopoverOpen}
              onOpenChange={setCopyPopoverOpen}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              }
              content={
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onCopyAsJsonl}
                  >
                    Copy as JSONL
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onCopyAsMarkdown}
                  >
                    Copy as Markdown
                  </Button>
                </div>
              }
              className="w-48 p-2"
            />
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTimeline}
            className={cn(
              "h-8 w-8 transition-colors",
              showTimeline && "bg-accent text-accent-foreground"
            )}
          >
            <GitBranch className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {projectPath && (
                <>
                  <DropdownMenuItem onClick={handleOpenInEditor}>
                    <Code className="h-4 w-4 mr-2" />
                    Open in Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenInTerminal}>
                    <Terminal className="h-4 w-4 mr-2" />
                    Open in Terminal
                  </DropdownMenuItem>
                </>
              )}
              {onProjectSettings && projectPath && (
                <DropdownMenuItem onClick={onProjectSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Project Settings
                </DropdownMenuItem>
              )}
              {onSlashCommandsSettings && projectPath && (
                <DropdownMenuItem onClick={onSlashCommandsSettings}>
                  <Command className="h-4 w-4 mr-2" />
                  Slash Commands
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
});