import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService, orderService } from '../services/api/services';
import { useAuthStore } from '../stores/authStore';

export function useCart() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  const addItemMutation = useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: string; quantity?: number }) =>
      cartService.addItem(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      cartService.updateItem(cartItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (cartItemId: string) => cartService.removeItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (shippingAddress: string) => orderService.checkout(shippingAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
    },
  });

  const cart = cartQuery.data;
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return {
    cart,
    itemCount,
    isLoading: cartQuery.isLoading,
    error: cartQuery.error as Error | null,
    refetch: cartQuery.refetch,
    addItem: addItemMutation.mutateAsync,
    isAddingItem: addItemMutation.isPending,
    updateItem: updateItemMutation.mutateAsync,
    isUpdatingItem: updateItemMutation.isPending,
    removeItem: removeItemMutation.mutateAsync,
    isRemovingItem: removeItemMutation.isPending,
    clearCart: clearCartMutation.mutateAsync,
    isClearingCart: clearCartMutation.isPending,
    checkout: checkoutMutation.mutateAsync,
    isCheckingOut: checkoutMutation.isPending,
    checkoutError: checkoutMutation.error as Error | null,
  };
}
