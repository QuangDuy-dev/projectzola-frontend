import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/api/services';
import { useAuthStore } from '../stores/authStore';

export function useMyOrders(status?: string, page = 1, pageSize = 20) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const ordersQuery = useQuery({
    queryKey: ['orders', 'my', status, page, pageSize],
    queryFn: () => orderService.getMyOrders(status || undefined, { page, pageSize }),
    enabled: isAuthenticated,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
    },
  });

  return {
    ordersData: ordersQuery.data,
    orders: ordersQuery.data?.items ?? [],
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error as Error | null,
    refetch: ordersQuery.refetch,
    cancelOrder: cancelOrderMutation.mutateAsync,
    isCancelling: cancelOrderMutation.isPending,
  };
}

export function useOrderDetail(orderId?: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => (orderId ? orderService.getById(orderId) : Promise.reject('No ID')),
    enabled: !!orderId,
  });
}
