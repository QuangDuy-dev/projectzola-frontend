import { describe, it, expect } from 'vitest';

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  votedByCurrentUser: boolean;
}

function calculatePercentages(options: PollOption[]): { id: string; percent: number }[] {
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  return options.map((o) => ({
    id: o.id,
    percent: total > 0 ? Math.round((o.voteCount / total) * 100) : 0,
  }));
}

function toggleSingleChoice(currentSelectedId: string | null, clickedId: string): string[] {
  if (currentSelectedId === clickedId) {
    return [];
  }
  return [clickedId];
}

function toggleMultipleChoice(currentSelectedIds: string[], clickedId: string): string[] {
  if (currentSelectedIds.includes(clickedId)) {
    return currentSelectedIds.filter((id) => id !== clickedId);
  }
  return [...currentSelectedIds, clickedId];
}

describe('chatPoll logic and calculations (M7)', () => {
  it('calculates correct percentages for poll options', () => {
    const options: PollOption[] = [
      { id: '1', text: 'Option A', voteCount: 3, votedByCurrentUser: false },
      { id: '2', text: 'Option B', voteCount: 1, votedByCurrentUser: false },
    ];
    const results = calculatePercentages(options);
    expect(results[0].percent).toBe(75);
    expect(results[1].percent).toBe(25);
  });

  it('handles 0 total votes without division by zero', () => {
    const options: PollOption[] = [
      { id: '1', text: 'A', voteCount: 0, votedByCurrentUser: false },
      { id: '2', text: 'B', voteCount: 0, votedByCurrentUser: false },
    ];
    const results = calculatePercentages(options);
    expect(results[0].percent).toBe(0);
    expect(results[1].percent).toBe(0);
  });

  it('toggles single choice selection correctly', () => {
    // selecting first time
    expect(toggleSingleChoice(null, 'opt1')).toEqual(['opt1']);
    // switching to another option
    expect(toggleSingleChoice('opt1', 'opt2')).toEqual(['opt2']);
    // clicking same option unselects
    expect(toggleSingleChoice('opt1', 'opt1')).toEqual([]);
  });

  it('toggles multiple choice selections correctly', () => {
    let selected: string[] = [];
    selected = toggleMultipleChoice(selected, 'opt1');
    expect(selected).toEqual(['opt1']);

    selected = toggleMultipleChoice(selected, 'opt2');
    expect(selected).toEqual(['opt1', 'opt2']);

    selected = toggleMultipleChoice(selected, 'opt1');
    expect(selected).toEqual(['opt2']);
  });
});
