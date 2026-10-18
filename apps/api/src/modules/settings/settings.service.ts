import { prisma } from '../../shared/database';
import { outboxService } from '../outbox/outbox.service';

export class SettingsService {
  async getPublicBranding() {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'branding' },
    });

    const val = (setting?.value as Record<string, string>) || {};
    return {
      companyName: val.companyName || 'instOS Operations',
      primaryColor: val.primaryColor || '#4f46e5',
      logoUrl: val.logoUrl || '',
      supportEmail: val.supportEmail || 'support@instos.internal',
    };
  }

  async updateSetting(category: string, key: string, value: Record<string, unknown>, userId: string) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: value as any,
        category,
        updatedBy: userId,
      },
      create: {
        key,
        category,
        value: value as any,
        updatedBy: userId,
      },
    });
  }

  async getOutboxStats() {
    return outboxService.getQueueStats();
  }

  async getRecentOutboxJobs() {
    return prisma.outboxJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async retryJob(jobId: string) {
    return outboxService.retryJob(jobId);
  }
}

export const settingsService = new SettingsService();
