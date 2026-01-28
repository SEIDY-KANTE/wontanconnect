export type OfferStatus = 'active' | 'completed' | 'cancelled';
export type StatusTagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const statusVariants: Record<OfferStatus, StatusTagVariant> = {
  active: 'success',
  completed: 'info',
  cancelled: 'error',
};

export const getStatusTagVariant = (status: OfferStatus): StatusTagVariant => {
  return statusVariants[status] ?? 'default';
};
