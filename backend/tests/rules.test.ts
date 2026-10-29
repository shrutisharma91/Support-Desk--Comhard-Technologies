import { describe, expect, it } from 'vitest';
import {
  diffTicketChanges,
  isOverdue,
  isSlaBreached,
  resolvedAtFor,
} from '../src/domain/rules.js';

const now = new Date('2026-10-29T12:00:00.000Z');

describe('isOverdue', () => {
  it('true when not resolved and 25h old', () => {
    const createdAt = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(isOverdue({ status: 'OPEN', createdAt }, now)).toBe(true);
  });

  it('false when 23h old', () => {
    const createdAt = new Date(now.getTime() - 23 * 60 * 60 * 1000);
    expect(isOverdue({ status: 'OPEN', createdAt }, now)).toBe(false);
  });

  it('false when RESOLVED even if 72h old', () => {
    const createdAt = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    expect(isOverdue({ status: 'RESOLVED', createdAt }, now)).toBe(false);
  });
});

describe('isSlaBreached', () => {
  const createdAt = new Date(now.getTime() - 5 * 60 * 60 * 1000);

  it('true when no reply past SLA', () => {
    expect(
      isSlaBreached({ status: 'OPEN', createdAt, firstResponseAt: null }, 4, now),
    ).toBe(true);
  });

  it('false when reply exists', () => {
    expect(
      isSlaBreached(
        { status: 'OPEN', createdAt, firstResponseAt: new Date(now.getTime() - 1000) },
        4,
        now,
      ),
    ).toBe(false);
  });

  it('false when resolved', () => {
    expect(
      isSlaBreached(
        { status: 'RESOLVED', createdAt, firstResponseAt: null },
        4,
        now,
      ),
    ).toBe(false);
  });
});

describe('diffTicketChanges', () => {
  const base = {
    subject: 'Subject',
    customerName: 'A',
    customerEmail: 'a@example.com',
    description: 'Desc',
    status: 'OPEN',
    priority: 'MEDIUM',
    assigneeId: 1 as number | null,
  };

  it('status+priority change → 2 drafts', () => {
    const drafts = diffTicketChanges(
      base,
      { ...base, status: 'RESOLVED', priority: 'HIGH' },
      { beforeName: 'A', afterName: 'A' },
    );
    expect(drafts).toHaveLength(2);
    expect(drafts.map((d) => d.type).sort()).toEqual([
      'PRIORITY_CHANGED',
      'STATUS_CHANGED',
    ]);
  });

  it('assignee A→null → names "A"→null', () => {
    const drafts = diffTicketChanges(
      base,
      { ...base, assigneeId: null },
      { beforeName: 'A', afterName: null },
    );
    expect(drafts).toEqual([
      {
        type: 'ASSIGNEE_CHANGED',
        fromValue: 'A',
        toValue: null,
      },
    ]);
  });

  it('subject+description → one DETAILS_UPDATED', () => {
    const drafts = diffTicketChanges(
      base,
      { ...base, subject: 'New', description: 'New desc' },
      { beforeName: 'A', afterName: 'A' },
    );
    expect(drafts).toEqual([
      {
        type: 'DETAILS_UPDATED',
        fromValue: null,
        toValue: 'subject, description',
      },
    ]);
  });

  it('identical → []', () => {
    expect(
      diffTicketChanges(base, { ...base }, { beforeName: 'A', afterName: 'A' }),
    ).toEqual([]);
  });
});

describe('resolvedAtFor', () => {
  it('OPEN→RESOLVED sets date', () => {
    expect(resolvedAtFor('OPEN', 'RESOLVED', now)).toEqual(now);
  });

  it('RESOLVED→OPEN clears', () => {
    expect(resolvedAtFor('RESOLVED', 'OPEN', now)).toBeNull();
  });
});
