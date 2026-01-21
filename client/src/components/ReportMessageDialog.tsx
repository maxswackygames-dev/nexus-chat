import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ReportMessageDialogProps {
  messageId: number;
  messageContent: string;
  authorName: string;
  onReportSuccess?: () => void;
}

const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Hate speech",
  "Inappropriate content",
  "Misinformation",
  "Other",
];

export default function ReportMessageDialog({
  messageId,
  messageContent,
  authorName,
  onReportSuccess,
}: ReportMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reportMutation = trpc.moderation.reportMessage.useMutation();

  const handleSubmitReport = async () => {
    if (!reason.trim()) {
      toast.error("Please select a reason");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve, reject) => {
        reportMutation.mutate(
          {
            messageId,
            reason,
            description: description.trim() || undefined,
          },
          { onSuccess: resolve, onError: reject }
        );
      });

      toast.success("Message reported successfully");
      setOpen(false);
      setReason("");
      setDescription("");
      onReportSuccess?.();
    } catch (error) {
      toast.error("Failed to report message");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="w-4 h-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Message</DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Message Preview */}
          <div className="p-3 rounded-lg bg-muted border border-border">
            <p className="text-xs text-muted-foreground mb-1">From {authorName}</p>
            <p className="text-sm text-foreground truncate">{messageContent}</p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report</Label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isLoading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about why you're reporting this message..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitReport}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
