import React, { useState } from 'react';
import { X, Copy, CheckCheck, Mail, ExternalLink } from 'lucide-react';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  businessName?: string;
  subject?: string;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
  isOpen,
  onClose,
  studentName = 'Student',
  businessName = 'EduSteps Coaching',
  subject = 'your course'
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'welcome' | 'reminder' | 'invoice'>('welcome');

  const templates = {
    welcome: {
      subject: `Welcome to ${businessName}! 🎉`,
      body: `Dear ${studentName},

Welcome aboard ${businessName}! 🎉

We are thrilled to have you as a student. Your journey towards excellence in ${subject} begins today!

Here are a few things to get you started:
✅ Your enrollment has been confirmed.
✅ Classes begin as per the schedule shared with you.
✅ Please ensure you have the required study materials.
✅ Feel free to reach out anytime for any queries.

We look forward to guiding you every step of the way.

Warm Regards,
${businessName} Team`,
    },
    reminder: {
      subject: `Friendly Reminder – Payment Due | ${businessName}`,
      body: `Dear ${studentName},

Hope this message finds you well!

This is a gentle reminder that your payment for ${subject} is due soon.

Kindly make the payment at your earliest convenience to avoid any interruption in your classes.

If you have already made the payment, please ignore this message.

For any queries, feel free to contact us.

Regards,
${businessName}`,
    },
    invoice: {
      subject: `Payment Receipt – ${businessName}`,
      body: `Dear ${studentName},

Thank you for your payment! 🙏

We have received your payment for ${subject} at ${businessName}.

Your enrollment is now confirmed and active. You can download your invoice receipt from our portal.

If you face any issues, feel free to reach out to us.

Best Wishes,
${businessName} Team`,
    }
  } as const;

  const current = templates[selectedTemplate];

  const handleCopy = async () => {
    const fullText = `Subject: ${current.subject}\n\n${current.body}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(current.subject)}&body=${encodeURIComponent(current.body)}`;
    window.open(gmailUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Email Templates</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {(['welcome', 'reminder', 'invoice'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedTemplate(type)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                  selectedTemplate === type
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {type === 'welcome' ? '🎉 Welcome' : type === 'reminder' ? '⏰ Reminder' : '🧾 Receipt'}
              </button>
            ))}
          </div>
        </div>

        {/* Template Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</label>
            <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-medium">
              {current.subject}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Body</label>
            <pre className="mt-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed overflow-y-auto max-h-52">
              {current.body}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-all"
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleOpenGmail}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Gmail
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateModal;
