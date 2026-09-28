import { describe, it, expect } from 'vitest';
import type { OrderStatus } from '../types';

/**
 * Business rules helper for order status validation on the client
 */
export function canCancelOrder(status: OrderStatus | string): boolean {
  return status === 'Pending';
}

export function isOrderDelivered(status: OrderStatus | string, deliveredAt?: string | null): boolean {
  return status === 'Delivered' && !!deliveredAt;
}

export function getOrderStatusProgressionIndex(status: OrderStatus): number {
  const flow: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Preparing',
    'WaitingForPickup',
    'Shipping',
    'Delivered',
  ];
  return flow.indexOf(status);
}

describe('OrderStatus Business Rules', () => {
  describe('canCancelOrder', () => {
    it('allows cancellation ONLY for Pending orders', () => {
      expect(canCancelOrder('Pending')).toBe(true);
    });

    it('rejects cancellation for Confirmed orders', () => {
      expect(canCancelOrder('Confirmed')).toBe(false);
    });

    it('rejects cancellation for Preparing orders', () => {
      expect(canCancelOrder('Preparing')).toBe(false);
    });

    it('rejects cancellation for WaitingForPickup orders', () => {
      expect(canCancelOrder('WaitingForPickup')).toBe(false);
    });

    it('rejects cancellation for Shipping orders', () => {
      expect(canCancelOrder('Shipping')).toBe(false);
    });

    it('rejects cancellation for Delivered orders', () => {
      expect(canCancelOrder('Delivered')).toBe(false);
    });

    it('rejects cancellation for already Cancelled orders', () => {
      expect(canCancelOrder('Cancelled')).toBe(false);
    });
  });

  describe('isOrderDelivered for revenue calculation', () => {
    it('returns true when Delivered and DeliveredAt is non-null', () => {
      expect(isOrderDelivered('Delivered', '2026-03-22T10:00:00Z')).toBe(true);
    });

    it('returns false when Delivered but DeliveredAt is null or empty', () => {
      expect(isOrderDelivered('Delivered', null)).toBe(false);
      expect(isOrderDelivered('Delivered', '')).toBe(false);
    });

    it('returns false for any non-Delivered status even if timestamp is present', () => {
      expect(isOrderDelivered('Shipping', '2026-03-22T10:00:00Z')).toBe(false);
      expect(isOrderDelivered('Pending', '2026-03-22T10:00:00Z')).toBe(false);
      expect(isOrderDelivered('Confirmed', '2026-03-22T10:00:00Z')).toBe(false);
    });
  });

  describe('getOrderStatusProgressionIndex', () => {
    it('maps lifecycle correctly sequentially', () => {
      expect(getOrderStatusProgressionIndex('Pending')).toBe(0);
      expect(getOrderStatusProgressionIndex('Confirmed')).toBe(1);
      expect(getOrderStatusProgressionIndex('Preparing')).toBe(2);
      expect(getOrderStatusProgressionIndex('WaitingForPickup')).toBe(3);
      expect(getOrderStatusProgressionIndex('Shipping')).toBe(4);
      expect(getOrderStatusProgressionIndex('Delivered')).toBe(5);
    });

    it('returns -1 for Cancelled since it breaks progression flow', () => {
      expect(getOrderStatusProgressionIndex('Cancelled')).toBe(-1);
    });
  });
});
