import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../../common/enums';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get notifications grouped by time period:
   * Today / Yesterday / Earlier
   */
  async findGroupedByUserId(userId: string): Promise<{
    today: Notification[];
    yesterday: Notification[];
    earlier: Notification[];
  }> {
    const all = await this.findByUserId(userId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];

    for (const n of all) {
      const created = new Date(n.createdAt);
      if (created >= todayStart) {
        today.push(n);
      } else if (created >= yesterdayStart) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    }

    return { today, yesterday, earlier };
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string): Promise<void> {
    await this.notificationsRepository.update(id, { isRead: true });
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * Create a notification for a specific user.
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    venueId?: string;
    offerId?: string;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create(data);
    return this.notificationsRepository.save(notification);
  }

  /**
   * Create a welcome notification for a new user.
   */
  async createWelcomeNotification(userId: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.WELCOME,
      title: 'Welcome to REKI! 🎉',
      message: "Start exploring Manchester's best vibes. Save your favourite venues to get live alerts!",
      icon: '🎉',
    });
  }

  /**
   * Get all notifications (admin).
   */
  async findAll(): Promise<{ notifications: Notification[]; count: number }> {
    const notifications = await this.notificationsRepository.find({
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return { notifications, count: notifications.length };
  }
}
