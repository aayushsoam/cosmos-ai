import React, { useState } from 'react';
import { MdSend, MdExpandMore, MdExpandLess, MdClose } from 'react-icons/md';
import type { EmailData } from './EmailComposeModal';

interface EmailComposeCardProps {
  emailData: Partial<EmailData>;
  onSend: (emailData: EmailData) => Promise<void>;
  onClose: () => void;
}

const EmailComposeCard: React.FC<EmailComposeCardProps> = ({ emailData: initialData, onSend, onClose }) => {
  const [to, setTo] = useState(initialData.to || '');
  const [cc, setCc] = useState(initialData.cc || '');
  const [bcc, setBcc] = useState(initialData.bcc || '');
  const [subject, setSubject] = useState(initialData.subject || '');
  const [body, setBody] = useState(initialData.body || '');
  const [showCc, setShowCc] = useState(!!initialData.cc);
  const [showBcc, setShowBcc] = useState(!!initialData.bcc);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in all required fields (To, Subject, and Body)');
      return;
    }

    setIsSending(true);
    try {
      await onSend({
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="my-3 rounded-lg border border-blue-500/30 bg-gradient-to-br from-gray-900 to-black p-4 shadow-lg">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-blue-500/20 p-2">
            <MdSend className="size-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Email Compose</h3>
            <p className="text-xs text-gray-400">Review and send your email</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            title={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? <MdExpandLess className="size-5" /> : <MdExpandMore className="size-5" />}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            title="Close">
            <MdClose className="size-5" />
          </button>
        </div>
      </div>

      {/* Email Fields - Collapsible */}
      {isExpanded && (
        <div className="space-y-2">
          {/* To Field */}
          <div className="rounded-md border border-gray-700 bg-black/50 p-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-400">To:</label>
              <input
                type="text"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
              <div className="flex gap-2 text-xs text-blue-400">
                {!showCc && (
                  <button onClick={() => setShowCc(true)} className="hover:underline">
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button onClick={() => setShowBcc(true)} className="hover:underline">
                    Bcc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CC Field */}
          {showCc && (
            <div className="rounded-md border border-gray-700 bg-black/50 p-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-400">Cc:</label>
                <input
                  type="text"
                  value={cc}
                  onChange={e => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* BCC Field */}
          {showBcc && (
            <div className="rounded-md border border-gray-700 bg-black/50 p-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-400">Bcc:</label>
                <input
                  type="text"
                  value={bcc}
                  onChange={e => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* Subject Field */}
          <div className="rounded-md border border-gray-700 bg-black/50 p-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-400">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Body Field */}
          <div className="rounded-md border border-gray-700 bg-black/50 p-2">
            <label className="mb-1 block text-xs font-medium text-gray-400">Message:</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Email body..."
              className="w-full resize-none bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              rows={6}
            />
          </div>

          {/* Send Button */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-700">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !to.trim() || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {isSending ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <MdSend className="size-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div className="text-sm text-gray-400">
          <p className="truncate">
            <span className="font-medium text-white">To:</span> {to}
          </p>
          <p className="truncate">
            <span className="font-medium text-white">Subject:</span> {subject}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailComposeCard;
