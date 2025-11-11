// src/lib/fetch-and-validate.ts
import { Logger } from '@/lib/logger';
import { ZodSchema } from 'zod';
import { parseWith, ValidationError } from './validation.utils';

type ApiResponse<TRaw> = { status: number; data: TRaw };

export interface SafeFetchOptions<TData, TRaw = unknown> {
  /** API çağrısını yapan thunk */
  fetcher: () => Promise<ApiResponse<TRaw>>;

  /** Yanıt şeması */
  schema: ZodSchema<TData>;

  /** Log bağlamı */
  context: string;

  /** Başarılı sayılacak durumlar (default: 2xx) */
  expectedStatus?: number[] | ((status: number) => boolean);

  /** Doğrulama/HTTP hata davranışı:
   *  - 'graceful': hata atmaz, `defaultData` döndürür
   *  - 'strict': hata atar (Error Boundary veya try/catch yakalar)
   */
  mode?: 'graceful' | 'strict';

  /** Graceful modda dönecek varsayılan veri */
  defaultData?: TData;

  /** Zaman aşımı ve iptal desteği (opsiyonel) */
  signal?: AbortSignal;
  timeoutMs?: number;
}

function isExpected(
  status: number,
  expected?: SafeFetchOptions<unknown>['expectedStatus']
): boolean {
  if (!expected) return status >= 200 && status < 300;
  return Array.isArray(expected) ? expected.includes(status) : expected(status);
}

export async function fetchAndValidate<TData, TRaw = unknown>(
  opts: SafeFetchOptions<TData, TRaw>
): Promise<TData> {
  const {
    fetcher,
    schema,
    context,
    expectedStatus,
    mode = 'graceful',
    defaultData,
    timeoutMs,
    // signal
  } = opts;

  // Default timeout: 30 saniye (build time için)
  const defaultTimeout = 30_000;
  const effectiveTimeout = timeoutMs ?? defaultTimeout;

  try {
    const startedAt = Date.now();

    // Timeout wrapper - fetcher'ı timeout ile sarmalıyoruz
    const fetcherPromise = fetcher();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Request timeout after ${effectiveTimeout}ms`)),
        effectiveTimeout
      );
    });

    const response = await Promise.race([fetcherPromise, timeoutPromise]);
    const durationMs = Date.now() - startedAt;

    if (!isExpected(response.status, expectedStatus)) {
      Logger.apiError(context, response.status, response.data, { durationMs });
      if (mode === 'strict') {
        throw new Error(`HTTP ${response.status}`);
      }
      if (defaultData !== undefined) return defaultData;
      // Graceful ama default yoksa güvenli boş dönüş tercih edin:
      throw new Error(`HTTP ${response.status} (no defaultData provided)`);
    }

    try {
      return parseWith(schema, response.data, context);
    } catch (e) {
      if (e instanceof ValidationError) {
        Logger.validationError(context, e.issues, e.raw);
      } else {
        Logger.error(`Unexpected validation error: ${context}`, {
          error: String(e),
        });
      }
      if (mode === 'strict') throw e;
      if (defaultData !== undefined) return defaultData;
      throw new Error('Validation failed and no defaultData provided');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    Logger.error(`Safe fetch failed: ${context}`, { error: msg });
    if (mode === 'strict')
      throw error instanceof Error ? error : new Error(msg);
    if (defaultData !== undefined) return defaultData;
    // Graceful + default yok → yine de “boş güvenli” davranış istiyorsanız burada üretin:
    throw new Error('Fetch failed and no defaultData provided');
  } finally {
    // Cleanup handled by Promise.race timeout
  }
}
