export const generateAISuggestions = (client, breakdown) => {
  const suggestions = [];
  
  if (breakdown?.lateReplies > 0) {
    suggestions.push({
      type: 'warning',
      title: 'Delayed Response Pattern Detected',
      description: `${client?.name || 'This client'} has ${breakdown.lateReplies} unreplied messages averaging ${Math.round(breakdown.lateReplies * 2.5)} days response time. Consider a phone call for urgent matters.`,
      action: 'Schedule Call'
    });
  }

  if (breakdown?.missingDocs > 0) {
    suggestions.push({
      type: 'action',
      title: 'Missing Documents Detected',
      description: `GSTR-3B returns and bank statements are pending. Auto-generate a document request message for quick follow-up.`,
      action: 'Request Docs'
    });
  }

  if (breakdown?.delays > 0) {
    suggestions.push({
      type: 'warning',
      title: 'Filing Deadline Approaching',
      description: `ITR filing is ${breakdown.delays} days overdue. Generate an urgency reminder to avoid penalties.`,
      action: 'Send Reminder'
    });
  }

  if (breakdown?.pendingFees > 0) {
    suggestions.push({
      type: 'action',
      title: 'Pending Payment Alert',
      description: `Outstanding fees of ₹${(breakdown.pendingFees * 5000).toLocaleString('en-IN')} detected. Send payment link via WhatsApp.`,
      action: 'Send Payment Link'
    });
  }

  if (breakdown?.inactivity > 0) {
    suggestions.push({
      type: 'action',
      title: 'Communication Gap',
      description: `No activity from ${client?.name || 'this client'} for ${breakdown.inactivity * 7} days. Re-engage with a check-in message.`,
      action: 'Send Check-in'
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'success',
      title: 'All Clear!',
      description: `${client?.name || 'This client'} is in good standing. Continue regular follow-ups.`,
      action: 'View Summary'
    });
  }

  suggestions.push({
    type: 'insight',
    title: 'Voice to Task',
    description: 'Convert voice notes into tasks. Try: "Rohit ka GST pending hai" → Task auto-created.',
    action: 'Try Voice'
  });

  return suggestions;
};

export const generatePendingTasks = (client, breakdown) => {
  const tasks = [];

  if (breakdown?.missingDocs > 0) {
    tasks.push({
      title: 'Request Bank Statements',
      description: 'April 2024 statement missing for GST filing',
      urgent: breakdown.missingDocs > 2,
      completed: false
    });
    tasks.push({
      title: 'Collect Purchase Invoices',
      description: 'Q4 invoices pending for return filing',
      urgent: false,
      completed: false
    });
  }

  if (breakdown?.delays > 0) {
    tasks.push({
      title: 'Complete ITR Filing',
      description: 'FY 2023-24 return overdue by ' + breakdown.delays + ' days',
      urgent: true,
      completed: false
    });
  }

  if (breakdown?.pendingFees > 0) {
    tasks.push({
      title: 'Follow up on Payment',
      description: 'Outstanding fees for Q1 consultation',
      urgent: breakdown.pendingFees > 1,
      completed: false
    });
  }

  if (breakdown?.lateReplies > 0) {
    tasks.push({
      title: 'Schedule Follow-up Call',
      description: 'Discuss pending documents and deadlines',
      urgent: false,
      completed: false
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      title: 'Routine Check-in',
      description: 'Monthly status update call',
      urgent: false,
      completed: false
    });
    tasks.push({
      title: 'Document Review',
      description: 'Review submitted documents for completeness',
      urgent: false,
      completed: true
    });
  }

  return tasks;
};

export const analyzeNotice = (noticeText) => {
  const riskPatterns = {
    high: ['penalty', 'prosecution', ' summon', ' prosecution', 'offence', 'default'],
    medium: ['interest', 'late fee', 'penalty', 'demand', 'assessment'],
    low: ['notice', 'intimation', 'query', 'information', 'request']
  };

  let riskLevel = 'low';
  let riskScore = 20;

  Object.entries(riskPatterns).forEach(([level, patterns]) => {
    patterns.forEach(pattern => {
      if (noticeText.toLowerCase().includes(pattern)) {
        if (level === 'high' && riskScore < 80) {
          riskLevel = 'high';
          riskScore = 90;
        } else if (level === 'medium' && riskScore < 60) {
          riskLevel = 'medium';
          riskScore = 60;
        }
      }
    });
  });

  return {
    riskLevel,
    riskScore,
    explanation: getExplanation(noticeText),
    actions: getRecommendedActions(noticeText, riskLevel),
    documents: getRequiredDocuments(noticeText)
  };
};

const getExplanation = (noticeText) => {
  if (noticeText.toLowerCase().includes('gst')) {
    return 'This appears to be a GST notice regarding compliance or filing requirements. In simple terms: "Tax department wants more information about your business transactions."';
  }
  if (noticeText.toLowerCase().includes('income tax') || noticeText.toLowerCase().includes('itr')) {
    return 'This is an Income Tax notice related to your returns. In simple terms: "Please verify your income tax filing or provide additional documents."';
  }
  return 'This is a tax compliance notice. It is recommended to consult with your CA for proper guidance.';
};

const getRecommendedActions = (noticeText, riskLevel) => {
  const actions = [
    'Do not ignore this notice - respond within the deadline',
    'Gather all relevant documents and records',
    'Consult with your CA immediately',
    'Prepare a detailed response with supporting documents'
  ];

  if (riskLevel === 'high') {
    actions.unshift('⚠️ PRIORITY: Seek professional help within 48 hours');
  }

  return actions;
};

const getRequiredDocuments = (noticeText) => {
  const docs = [
    'Form 16 / Salary Slips',
    'Bank Statements (all accounts)',
    'Investment Proofs',
    'Property Documents (if applicable)'
  ];

  if (noticeText.toLowerCase().includes('gst')) {
    docs.push('GSTR-3B Returns', 'Invoice Records', 'E-way Bills');
  }

  return docs;
};

export const generateReply = (context, type) => {
  const templates = {
    reminder: {
      english: `Dear Client,

This is a friendly reminder regarding pending documents/filings for your account.

Required: ${context?.documents || 'Updated documents'}
Due Date: ${context?.dueDate || 'As soon as possible'}

Please submit at your earliest convenience to avoid delays and penalties.

Best regards,
Your CA Team`,
      hindi: `नमस्ते,

यह आपके खाते में लंबित दस्तावेज़/फाइलिंग के बारे में एक अनुस्मारक है।

आवश्यक: ${context?.documents || 'अपडेटेड दस्तावेज़'}
नियत तारीख: ${context?.dueDate || 'जितनी जल्दी हो सके'}

कृपया सुविधा हो तो जल्दी जमा करें।

धन्यवाद`
    },
    noticeReply: {
      english: `To,
The Concerned Authority

Subject: Reply to Notice

Dear Sir/Madam,

With reference to the notice received, I am submitting this reply along with the required documents as listed below:

1. [Document 1]
2. [Document 2]
3. [Document 3]

I kindly request you to consider this reply and close the matter.

Thanking you,
${context?.name || 'Client Name'}`,
      hindi: `सेवा में,
संबंधित अधिकारी

विषय: नोटिस का जवाब

महोदय/महोदया,

प्राप्त नोटिस के संदर्भ में, मैं नीचे सूचीबद्ध आवश्यक दस्तावेज़ों के साथ यह जवाब प्रस्तुत कर रहा/रही हूं।

कृपया इस जवाब पर विचार करें और मामला बंद करें।

धन्यवाद`
    },
    followUp: {
      english: `Dear ${context?.name || 'Client'},

Hope you are doing well!

This is a follow-up regarding our previous communication about your pending documents/filings.

Our team is available to assist you. Please let us know if you need any help.

Best regards,
Your CA Team`,
      hindi: `नमस्ते,

उम्मीद है आप अच्छे होंगे!

यह आपके लंबित दस्तावेज़ों के बारे में हमारी पिछली बातचीत का अनुवर्ती संदेश है।

हमारी टीम आपकी सहायता के लिए उपलब्ध है।`
    }
  };

  return templates[type] || templates.reminder;
};

export const voiceToTask = (transcript) => {
  const patterns = [
    { regex: /gst\s+(pending|ka|ki|file)/i, task: 'GST Filing', priority: 'high' },
    { regex: /itr\s+(file|filing|pending)/i, task: 'ITR Filing', priority: 'high' },
    { regex: /bank\s+(statement|report)/i, task: 'Request Bank Statement', priority: 'medium' },
    { regex: /invoice\s+(missing|incomplete)/i, task: 'Collect Invoices', priority: 'medium' },
    { regex: /remind|call|phone/i, task: 'Schedule Call', priority: 'low' },
    { regex: /payment|fee|dues/i, task: 'Payment Follow-up', priority: 'high' },
    { regex: /document|docs|papers/i, task: 'Document Request', priority: 'medium' },
  ];

  const matchedTasks = [];

  patterns.forEach(({ regex, task, priority }) => {
    if (regex.test(transcript)) {
      matchedTasks.push({
        title: task,
        description: `Voice note: "${transcript}"`,
        priority,
        createdAt: new Date()
      });
    }
  });

  if (matchedTasks.length === 0) {
    matchedTasks.push({
      title: 'General Task',
      description: `Voice note: "${transcript}"`,
      priority: 'medium',
      createdAt: new Date()
    });
  }

  return matchedTasks;
};
