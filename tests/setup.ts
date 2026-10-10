// tests/setup.ts
import { vi } from 'vitest'


vi.mock('~/stores/toaster', () => ({
    useToaster: () => ({
        serverError: vi.fn(),
        connectionError: vi.fn(),
        serverNotification: vi.fn(),
        leftGame: vi.fn(),
        showDirectMessage: vi.fn(),
        modifier: vi.fn(),
    }),
}))