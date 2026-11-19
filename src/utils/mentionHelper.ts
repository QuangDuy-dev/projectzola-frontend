import type { ConversationMemberDto } from '../types';

export interface MentionSuggestion {
  id: string;
  displayName: string;
  username: string;
  isAll?: boolean;
}

/**
 * Checks if the text cursor is currently at a mention trigger '@'.
 */
export function getMentionQuery(
  text: string,
  cursorPosition: number
): { isMentioning: boolean; query: string; startIndex: number } {
  const textBeforeCursor = text.slice(0, cursorPosition);
  const match = /(?:^|\s)@([^\s@]*)$/.exec(textBeforeCursor);

  if (!match) {
    return { isMentioning: false, query: '', startIndex: -1 };
  }

  const query = match[1];
  const startIndex = textBeforeCursor.lastIndexOf('@');
  return { isMentioning: true, query, startIndex };
}

/**
 * Filters group members matching the mention query, plus '@Tất cả' for group chats.
 */
export function getMentionSuggestions(
  members: ConversationMemberDto[],
  query: string,
  isGroup: boolean
): MentionSuggestion[] {
  const q = query.toLowerCase().trim();
  const suggestions: MentionSuggestion[] = [];

  if (isGroup && ('tất cả'.includes(q) || 'all'.includes(q) || q === '')) {
    suggestions.push({
      id: 'ALL',
      displayName: 'Tất cả',
      username: 'all',
      isAll: true,
    });
  }

  for (const m of members) {
    const name = (m.nickname || m.displayName).toLowerCase();
    const username = m.username.toLowerCase();
    if (!q || name.includes(q) || username.includes(q)) {
      suggestions.push({
        id: m.userId,
        displayName: m.nickname || m.displayName,
        username: m.username,
      });
    }
  }

  return suggestions;
}

/**
 * Replaces the '@query' at startIndex with '@DisplayName ' and returns the new text and cursor position.
 */
export function insertMention(
  text: string,
  startIndex: number,
  queryLength: number,
  suggestion: MentionSuggestion
): { newText: string; newCursor: number } {
  const insertText = suggestion.isAll ? '@Tất cả ' : `@${suggestion.displayName} `;
  const before = text.slice(0, startIndex);
  let after = text.slice(startIndex + 1 + queryLength);
  if (after.startsWith(' ')) {
    after = after.slice(1);
  }
  const newText = before + insertText + after;
  const newCursor = before.length + insertText.length;
  return { newText, newCursor };
}
