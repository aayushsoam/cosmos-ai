import React, { useState, useEffect } from 'react';
import { FiX, FiMinus, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdAttachFile,
  MdLink,
  MdInsertEmoticon,
  MdImage,
  MdDelete,
} from 'react-icons/md';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => Promise<void>;
  initialData?: Partial<EmailData>;
}

export interface EmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
}

const EmailComposeModal: React.FC<EmailComposeModalProps> = ({ isOpen, onClose, onSend, initialData = {} }) => {
  const [to, setTo] = useState(initialData.to || '');
  const [cc, setCc] = useState(initialData.cc || '');
  const [bcc, setBcc] = useState(initialData.bcc || '');
  const [subject, setSubject] = useState(initialData.subject || '');
  const [body, setBody] = useState(initialData.body || '');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Update fields when initialData changes
  useEffect(() => {
    if (initialData.to) setTo(initialData.to);
    if (initialData.cc) {
      setCc(initialData.cc);
      setShowCc(true);
    }
    if (initialData.bcc) {
      setBcc(initialData.bcc);
      setShowBcc(true);
    }
    if (initialData.subject) setSubject(initialData.subject);
    if (initialData.body) setBody(initialData.body);
  }, [initialData]);

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
      // Reset form after successful send
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setShowCc(false);
      setShowBcc(false);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (to || subject || body) {
      const confirmClose = window.confirm('Discard draft?');
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 z-50 w-80">
        <div className="flex items-center justify-between rounded-t-lg border border-gray-700 bg-gray-900 px-4 py-2">
          <span className="truncate text-sm font-medium text-white">{subject || 'New Message'}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title="Expand">
              <FiMaximize2 className="size-4" />
            </button>
            <button
              onClick={handleClose}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title="Close">
              <FiX className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 ${
        isMaximized ? 'inset-0' : 'bottom-0 right-4 h-[600px] w-[680px] max-w-[calc(100vw-2rem)]'
      }`}>
      <div className="flex h-full flex-col rounded-t-lg border border-gray-700 bg-black shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <h3 className="text-base font-semibold text-white">New Message</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title="Minimize">
              <FiMinus className="size-4" />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title={isMaximized ? 'Restore' : 'Maximize'}>
              {isMaximized ? <FiMinimize2 className="size-4" /> : <FiMaximize2 className="size-4" />}
            </button>
            <button
              onClick={handleClose}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title="Close">
              <FiX className="size-4" />
            </button>
          </div>
        </div>

        {/* Email Fields */}
        <div className="border-b border-gray-800 bg-black">
          {/* To Field */}
          <div className="flex items-center border-b border-gray-800 px-4 py-2">
            <label className="w-16 text-sm text-gray-400">To</label>
            <input
              type="text"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="Recipients"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
            <div className="flex gap-2 text-sm text-blue-400">
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

          {/* CC Field */}
          {showCc && (
            <div className="flex items-center border-b border-gray-800 px-4 py-2">
              <label className="w-16 text-sm text-gray-400">Cc</label>
              <input
                type="text"
                value={cc}
                onChange={e => setCc(e.target.value)}
                placeholder="Carbon copy"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
            </div>
          )}

          {/* BCC Field */}
          {showBcc && (
            <div className="flex items-center border-b border-gray-800 px-4 py-2">
              <label className="w-16 text-sm text-gray-400">Bcc</label>
              <input
                type="text"
                value={bcc}
                onChange={e => setBcc(e.target.value)}
                placeholder="Blind carbon copy"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
            </div>
          )}

          {/* Subject Field */}
          <div className="flex items-center px-4 py-2">
            <label className="w-16 text-sm text-gray-400">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-black px-4 py-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Compose your email..."
            className="h-full w-full resize-none bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
        </div>

        {/* Footer with Toolbar */}
        <div className="border-t border-gray-800 bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isSending || !to.trim() || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {isSending ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </button>

            {/* Toolbar Icons */}
            <div className="flex items-center gap-1">
              <button
                className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Bold">
                <MdFormatBold className="size-5" />
              </button>
              <button
                className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Italic">
                <MdFormatItalic className="size-5" />
              </button>
              <button
                className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Underline">
                <MdFormatUnderlined className="size-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-gray-700" />
              <button
                className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Attach file">
                <MdAttachFile className="size-5" />
              </button>
              <button
                className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Insert link">
                <MdLink className="size-5" />
              </button>
              <button
                className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Insert emoji">
                <MdInsertEmoticon className="size-5" />
              </button>
              <button
                className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Insert image">
                <MdImage className="size-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-gray-700" />
              <button
                onClick={handleClose}
                className="rounded p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                title="Delete draft">
                <MdDelete className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposeModal;
