import type { ApiResponse, ApiPagedResponse } from '../../src/types/common.js';
import type { PassGenerationResult, BatchStatusResult, PassLookupResult, PassValidationResult, PassRedemptionResult, GlobalPassDto } from '../../src/types/passes.js';

export function mockApiResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: { traceId: 'test-trace-id', timestamp: '2026-02-25T00:00:00Z' },
  };
}

export function mockApiError(code: string, message: string, status?: number): ApiResponse<never> {
  return {
    success: false,
    error: { code, message },
  } as ApiResponse<never>;
}

export function mockPagedResponse<T>(items: T[], totalItems: number, page = 1, pageSize = 10): ApiPagedResponse<T> {
  return {
    success: true,
    items,
    pagination: {
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(totalItems / pageSize),
      totalItems,
    },
  };
}

export const mockPassGenerationResult: PassGenerationResult = {
  batchId: 'batch-001',
  templateId: 'template-001',
  generatedAt: '2026-02-25T12:00:00Z',
  totalPasses: 1,
  isAsyncProcessing: false,
  passes: [
    {
      id: 'pass-001',
      customerEmail: 'jane@example.com',
      confirmationCode: 'CONF-123',
      platforms: {
        apple: { available: true, addToWalletUrl: 'https://wallet.apple.com/pass/123', features: ['nfc'] },
        google: { available: true, addToWalletUrl: 'https://pay.google.com/pass/123', features: [] },
      },
      businessData: { section: 'A', row: '12', seat: '5', ticketType: 'VIP' },
      qrCode: 'data:image/png;base64,...',
      status: 'Active',
    },
  ],
};

export const mockBatchGenerationResult: PassGenerationResult = {
  batchId: 'batch-002',
  templateId: 'template-001',
  generatedAt: '2026-02-25T12:00:00Z',
  totalPasses: 5,
  isAsyncProcessing: true,
  batchOperation: {
    id: 'batch-002',
    status: 'Processing',
    totalRecipients: 5,
    passesGenerated: 0,
    generationFailures: 0,
    progressPercentage: 0,
    statusPollUrl: '/api/passes/batch/batch-002/status',
  },
  passes: [],
};

export const mockBatchStatusCompleted: BatchStatusResult = {
  id: 'batch-002',
  status: 'Completed',
  totalRecipients: 5,
  passesGenerated: 5,
  passesDelivered: 5,
  generationFailures: 0,
  deliveryFailures: 0,
  progressPercentage: 100,
  startedAt: '2026-02-25T12:00:00Z',
  completedAt: '2026-02-25T12:00:10Z',
  isCompleted: true,
  isActive: false,
  generatedPasses: [
    { id: 'pass-001', passNumber: 'LP-001', holderEmail: 'a@test.com', status: 'Active', hasApplePass: true, hasGooglePass: true, generatedAt: '2026-02-25T12:00:01Z' },
    { id: 'pass-002', passNumber: 'LP-002', holderEmail: 'b@test.com', status: 'Active', hasApplePass: true, hasGooglePass: true, generatedAt: '2026-02-25T12:00:02Z' },
  ],
};

export const mockBatchStatusProcessing: BatchStatusResult = {
  id: 'batch-002',
  status: 'Processing',
  totalRecipients: 5,
  passesGenerated: 2,
  passesDelivered: 1,
  generationFailures: 0,
  deliveryFailures: 0,
  progressPercentage: 40,
  startedAt: '2026-02-25T12:00:00Z',
  isCompleted: false,
  isActive: true,
};

export const mockPassLookup: PassLookupResult = {
  passId: 'pass-001',
  passNumber: 'LP-001',
  templateId: 'template-001',
  templateName: 'Summer Concert',
  templateType: 'Event',
  holderName: 'Jane Doe',
  holderEmail: 'jane@example.com',
  status: 'Active',
  isValid: true,
  canBeRedeemed: true,
  isExpired: false,
  generatedAt: '2026-02-25T12:00:00Z',
};

export const mockPassValidation: PassValidationResult = {
  passId: 'pass-001',
  passNumber: 'LP-001',
  status: 'Active',
  canBeRedeemed: true,
  isExpired: false,
  validationMessage: 'Pass is valid and can be redeemed',
  templateType: 'Event',
  holderName: 'Jane Doe',
  verificationMethods: ['qr', 'nfc'],
};

export const mockRedemptionResult: PassRedemptionResult = {
  passId: 'pass-001',
  passNumber: 'LP-001',
  redeemedAt: '2026-02-25T14:00:00Z',
  redemptionMethod: 'qr',
  previousStatus: 'Active',
  newStatus: 'Redeemed',
  alreadyRedeemed: false,
};

export const mockGlobalPass: GlobalPassDto = {
  id: 'pass-001',
  serialNumber: 'LP-001',
  platform: 'Both',
  status: 'Active',
  generatedAt: '2026-02-25T12:00:00Z',
  holderEmail: 'jane@example.com',
  templateId: 'template-001',
  templateName: 'Summer Concert',
  templateType: 'Event',
};
