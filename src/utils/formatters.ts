import { Conversation, Message } from '../types/chat';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function groupConversationsByDate(conversations: Conversation[]): Record<string, Conversation[]> {
  const groups: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const lastWeek = today - 86400000 * 7;

  conversations.forEach((conv) => {
    const convTime = conv.updatedAt || conv.createdAt;
    if (convTime >= today) {
      groups.Today.push(conv);
    } else if (convTime >= yesterday) {
      groups.Yesterday.push(conv);
    } else if (convTime >= lastWeek) {
      groups['Previous 7 Days'].push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  return groups;
}

export function exportConversationToMarkdown(conv: Conversation): string {
  let md = `# ${conv.title}\n\n`;
  md += `*Exported from NOVA AI on ${new Date().toLocaleString()}*\n\n`;
  md += `---\n\n`;

  for (const msg of conv.messages) {
    const roleName = msg.role === 'user' ? 'User' : 'NOVA AI';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    md += `### **${roleName}** (${time})\n\n`;

    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attachments:* ${msg.attachments.map((a) => a.name).join(', ')}\n\n`;
    }

    md += `${msg.content}\n\n`;

    if (msg.sources && msg.sources.length > 0) {
      md += `**Sources:**\n`;
      msg.sources.forEach((s) => {
        md += `- [${s.title}](${s.url || '#'}): ${s.snippet || ''}\n`;
      });
      md += '\n';
    }

    md += `---\n\n`;
  }

  return md;
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
