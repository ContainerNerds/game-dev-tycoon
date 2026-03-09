'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRandomPuzzle, type BugPuzzle } from '@/lib/config/bugPuzzleConfig';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface BugMiniGameProps {
  open: boolean;
  bugName: string;
  fixCost: number;
  onSolve: () => void;
  onPayToFix: () => void;
  onClose: () => void;
}

export default function BugMiniGame({ open, bugName, fixCost, onSolve, onPayToFix, onClose }: BugMiniGameProps) {
  const puzzle = useMemo(() => getRandomPuzzle(), [open]);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [clickedLine, setClickedLine] = useState<number | null>(null);

  const maxAttempts = 3;

  const handleLineClick = (lineIndex: number) => {
    if (solved || attempts >= maxAttempts) return;

    setClickedLine(lineIndex);

    if (lineIndex === puzzle.bugLine) {
      setSolved(true);
      setTimeout(() => {
        onSolve();
        resetState();
      }, 800);
    } else {
      setAttempts((a) => a + 1);
    }
  };

  const resetState = () => {
    setAttempts(0);
    setSolved(false);
    setShowHint(false);
    setClickedLine(null);
  };

  const handlePayFix = () => {
    onPayToFix();
    resetState();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const failed = attempts >= maxAttempts && !solved;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Find the Bug
            <Badge variant="outline" className="text-xs">{bugName}</Badge>
          </DialogTitle>
          <DialogDescription>
            {puzzle.description} — Click the line with the bug. {maxAttempts - attempts} attempt{maxAttempts - attempts !== 1 ? 's' : ''} remaining.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border border-border bg-black/40 p-3 font-mono text-sm">
            {puzzle.lines.map((line, i) => {
              const isCorrect = clickedLine === i && i === puzzle.bugLine;
              const isWrong = clickedLine === i && i !== puzzle.bugLine;
              const isBugRevealed = (solved || failed) && i === puzzle.bugLine;

              return (
                <div
                  key={i}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    isCorrect
                      ? 'bg-green-500/20 text-green-400'
                      : isWrong
                      ? 'bg-red-500/20 text-red-400'
                      : isBugRevealed
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleLineClick(i)}
                >
                  <span className="text-muted-foreground/50 mr-3 select-none">{i + 1}</span>
                  {line}
                  {isCorrect && <CheckCircle className="inline h-4 w-4 ml-2 text-green-400" />}
                  {isWrong && <XCircle className="inline h-4 w-4 ml-2 text-red-400" />}
                </div>
              );
            })}
          </div>

          {showHint && (
            <div className="flex items-start gap-2 text-sm text-yellow-400 bg-yellow-500/10 p-2 rounded">
              <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
              {puzzle.hint}
            </div>
          )}

          {solved && (
            <div className="text-center text-green-400 font-semibold">
              Bug found! Fixed for free.
            </div>
          )}

          {failed && (
            <div className="text-center space-y-2">
              <p className="text-red-400 text-sm">Out of attempts! The bug was on line {puzzle.bugLine + 1}.</p>
              <Button
                className="cursor-pointer"
                onClick={handlePayFix}
              >
                Pay ${fixCost.toLocaleString()} to Fix
              </Button>
            </div>
          )}

          {!solved && !failed && (
            <div className="flex justify-between">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs cursor-pointer"
                onClick={() => setShowHint(true)}
                disabled={showHint}
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                {showHint ? 'Hint shown' : 'Show Hint'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs cursor-pointer"
                onClick={handlePayFix}
              >
                Skip &amp; Pay ${fixCost.toLocaleString()}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
