export type NotificationType =
  | 'new_review'
  | 'artisan_response'
  | 'order_update'
  | 'review_reported';

export type RecipientRole = 'artisan' | 'customer' | 'admin';

export interface InAppNotification {
  id: string;
  userId: string;
  recipientRole: RecipientRole;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

