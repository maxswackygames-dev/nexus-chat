import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Download, Eye } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface FileAttachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

interface FileUploadPreviewProps {
  files: FileAttachment[];
  onRemove?: (fileId: number) => void;
  isLoading?: boolean;
}

export default function FileUploadPreview({
  files,
  onRemove,
  isLoading,
}: FileUploadPreviewProps) {
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  const isImage = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  const isPDF = (fileType: string) => {
    return fileType === "application/pdf";
  };

  const getFileIcon = (fileType: string) => {
    if (isImage(fileType)) return "🖼️";
    if (isPDF(fileType)) return "📄";
    if (fileType.includes("video")) return "🎥";
    if (fileType.includes("audio")) return "🎵";
    return "📎";
  };

  if (files.length === 0) return null;

  return (
    <>
      <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
        <p className="text-xs font-semibold text-foreground">
          Attachments ({files.length})
        </p>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 rounded bg-background border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0">
                  {getFileIcon(file.fileType)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {(isImage(file.fileType) || isPDF(file.fileType)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewFile(file)}
                    disabled={isLoading}
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <a
                  href={file.fileUrl}
                  download={file.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(file.id)}
                    disabled={isLoading}
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.fileName}</DialogTitle>
            <DialogDescription>
              {formatBytes(previewFile?.fileSize || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center overflow-auto">
            {previewFile && isImage(previewFile.fileType) ? (
              <img
                src={previewFile.fileUrl}
                alt={previewFile.fileName}
                className="max-w-full max-h-full object-contain"
              />
            ) : previewFile && isPDF(previewFile.fileType) ? (
              <iframe
                src={previewFile.fileUrl}
                className="w-full h-full"
                title={previewFile.fileName}
              />
            ) : (
              <p className="text-muted-foreground">
                Preview not available for this file type
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPreviewFile(null)}
            >
              Close
            </Button>
            <a
              href={previewFile?.fileUrl}
              download={previewFile?.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
