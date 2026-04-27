import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Send, RefreshCw, Eye, Users, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AIEmailComposer = ({
  recipientOptions,
  selectedRecipients,
  onRecipientsChange,
  templates,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  recipientCount,
  isSending,
  onSend,
  onRegenerate,
  toneOptions = true,
  selectedTone = "formal",
  onToneChange,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSelectTemplate = (template) => {
    onSubjectChange(template.subject);
    onBodyChange(template.body);
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      setIsRegenerating(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      onRegenerate();
      setIsRegenerating(false);
    }
  };

  const tones = [
    { value: "formal", label: "Formal" },
    { value: "friendly", label: "Friendly" },
    { value: "short", label: "Short & Direct" },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Recipient Selection */}
        <div>
          <Label className="mb-2 block">Recipients</Label>
          <Select value={selectedRecipients} onValueChange={onRecipientsChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select recipients" />
            </SelectTrigger>
            <SelectContent>
              {recipientOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tone Options */}
        {toneOptions && onToneChange && (
          <div>
            <Label className="mb-2 block">Tone</Label>
            <div className="flex gap-2">
              {tones.map((tone) => (
                <Button
                  key={tone.value}
                  type="button"
                  variant={selectedTone === tone.value ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    selectedTone === tone.value
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => onToneChange(tone.value)}
                >
                  {tone.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* AI Templates */}
        <Card className="border border-[#5b3b6f]/25 bg-[#5b3b6f]/6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} className="text-[#5b3b6f]" />
              AI Recommended Templates
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 gap-1 text-xs hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  Regenerate
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {templates.map((template, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-auto py-2 px-3 text-left justify-start",
                    subject === template.subject
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm [&_p]:text-white"
                      : "hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white hover:[&_p]:text-white"
                  )}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div>
                    <p className="font-medium text-xs">{template.type}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {template.subject}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject */}
        <div>
          <Label className="mb-2 block">Subject *</Label>
          <Input
            placeholder="Email subject..."
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
          />
        </div>

        {/* Body */}
        <div>
          <Label className="mb-2 block">Message *</Label>
          <Textarea
            placeholder="Compose your message..."
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            rows={10}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Users size={14} />
            <span>{recipientCount} recipient{recipientCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2 hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
              onClick={() => setShowPreview(true)}
              disabled={!subject || !body}
            >
              <Eye size={16} />
              Preview
            </Button>
            <Button
              type="button"
              variant="brand"
              className="gap-2"
              onClick={onSend}
              disabled={isSending || !subject || !body || !selectedRecipients}
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Review your email before sending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium w-20">To:</span>
              <Badge variant="secondary" className="gap-1">
                <Users size={12} />
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="font-medium w-20 shrink-0">Subject:</span>
              <span className="font-semibold">{subject}</span>
            </div>
            <div className="border-t pt-4">
              <div className="bg-secondary rounded-lg p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                  {body}
                </pre>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
              onClick={() => setShowPreview(false)}
            >
              Edit
            </Button>
            <Button
              variant="brand"
              className="gap-2"
              onClick={() => {
                setShowPreview(false);
                onSend();
              }}
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIEmailComposer;
