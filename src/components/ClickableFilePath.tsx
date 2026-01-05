import React, { useState, useCallback } from "react";
import { ExternalLink, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// IDE configurations
export const IDE_OPTIONS = [
  { id: "vscode", name: "VS Code", command: "code" },
  { id: "cursor", name: "Cursor", command: "cursor" },
  { id: "windsurf", name: "Windsurf", command: "windsurf" },
  { id: "zed", name: "Zed", command: "zed" },
  { id: "sublime", name: "Sublime Text", command: "subl" },
  { id: "webstorm", name: "WebStorm", command: "webstorm" },
  { id: "idea", name: "IntelliJ IDEA", command: "idea" },
  { id: "nvim", name: "Neovim", command: "nvim" },
  { id: "vim", name: "Vim", command: "vim" },
] as const;

export type IDEOption = (typeof IDE_OPTIONS)[number]["id"];

// Get IDE preference from localStorage
export const getIDEPreference = (): IDEOption => {
  if (typeof window === "undefined") return "vscode";
  return (localStorage.getItem("ide_preference") as IDEOption) || "vscode";
};

// Save IDE preference to localStorage
export const setIDEPreference = (ide: IDEOption) => {
  localStorage.setItem("ide_preference", ide);
};

// Get the IDE command for a given IDE
export const getIDECommand = (ide: IDEOption): string => {
  const option = IDE_OPTIONS.find((o) => o.id === ide);
  return option?.command || "code";
};

interface ClickableFilePathProps {
  /** The file path to display */
  filePath: string;
  /** Optional project root path for context */
  projectPath?: string;
  /** Optional line number to jump to */
  lineNumber?: number;
  /** Optional className for styling */
  className?: string;
  /** Whether to show the full path or just the filename */
  showFullPath?: boolean;
  /** Custom display text (if different from filePath) */
  displayText?: string;
}

/**
 * A clickable file path component that opens files in the user's preferred IDE
 */
export const ClickableFilePath: React.FC<ClickableFilePathProps> = ({
  filePath,
  projectPath,
  lineNumber,
  className,
  showFullPath = false,
  displayText,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const { toast } = useToast();

  // Get display name (filename or full path)
  const displayName = displayText || (showFullPath ? filePath : filePath.split("/").pop() || filePath);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const ide = getIDEPreference();
    const ideCommand = getIDECommand(ide);

    // Build the file path with optional line number
    let targetPath = filePath;
    if (lineNumber) {
      // Most IDEs support :lineNumber suffix
      targetPath = `${filePath}:${lineNumber}`;
    }

    try {
      // Use Tauri shell plugin to open in IDE
      const { Command } = await import("@tauri-apps/plugin-shell");
      
      // Build command arguments
      const args: string[] = [];
      
      // Add project path first if available (to open the project folder)
      if (projectPath) {
        args.push(projectPath);
      }
      
      // Add the file path with optional line number
      args.push(targetPath);
      
      // Execute the command
      const command = Command.create(ideCommand, args);
      await command.execute();
    } catch (error) {
      console.error("Failed to open in IDE:", error);
      // Fallback: copy path to clipboard
      try {
        await navigator.clipboard.writeText(filePath);
        toast({
          title: "Path copied",
          description: `Could not open IDE. Path copied to clipboard: ${filePath}`,
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to open file in IDE",
          variant: "destructive",
        });
      }
    }
  }, [filePath, projectPath, lineNumber, toast]);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(filePath);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      console.error("Failed to copy path");
    }
  }, [filePath]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs cursor-pointer",
        "bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded transition-colors",
        "text-primary hover:text-primary/80 hover:underline",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`Click to open in IDE: ${filePath}${lineNumber ? `:${lineNumber}` : ""}`}
    >
      <span className="truncate max-w-[300px]">{displayName}</span>
      {lineNumber && <span className="text-muted-foreground">:{lineNumber}</span>}
      {isHovered && (
        <>
          <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-70" />
          <button
            onClick={handleCopy}
            className="p-0.5 hover:bg-background/50 rounded"
            title="Copy path"
          >
            {justCopied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 opacity-70" />
            )}
          </button>
        </>
      )}
    </span>
  );
};

