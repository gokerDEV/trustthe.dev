import { Logger } from '@/lib/logger';
import type { z } from 'zod';
import { validateApiResponse } from './validation.utils';

interface SafeFetchOptions<TData> {
  /**
   * Çağrılacak API isteğini içeren bir "thunk" (wrapper fonksiyon).
   * Bu, utility'mizin argümanlar hakkında BİLGİSİ OLMAMASINI sağlar.
   */
  fetcher: () => Promise<{
    status: number;
    data: unknown; // Veriyi 'unknown' olarak al, Zod zaten doğrulayacak
  }>;

  /** Yanıt verisini doğrulamak için Zod şeması */
  schema: z.ZodType<TData>;

  /** Hata durumunda log'lama için bağlam */
  context: string;

  /** Default value for when the response is null */
  defaultData: TData;
}

/**
 * API hatalarını zarifçe yakalar ve doğrular.
 * Asla hata fırlatmaz (throw); veri veya null döndürür.
 *
 * @returns Doğrulanmış veri, ham fallback veri veya `default.
 */
export async function fetchAndValidate<TData>({
  fetcher,
  schema,
  context,
  defaultData,
}: SafeFetchOptions<TData>): Promise<TData> {
  try {
    // 1. Bize verilen fonksiyonu çağır. Artık ...args veya 'any' yok.
    const response = await fetcher();

    // 2. HTTP durumunu zarifçe ele al
    if (response.status !== 200) {
      Logger.apiError(context, response.status, response.data, {});
      return defaultData;
    }

    // 3. Yanıtı doğrula
    const validationResult = validateApiResponse(
      response.data,
      schema,
      context
    );

    // 4. Başarı veya "graceful fallback" durumunu ele al
    if (validationResult.success) {
      return validationResult.data;
    }

    // Doğrulama başarısız olursa ham veriyi (cast ederek) döndür
    return (response.data as TData) ?? defaultData;
  } catch (error) {
    // 5. Fetch'in tamamen (örn: network hatası) başarısız olmasını yakala
    Logger.error(`Safe fetch failed: ${context}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return defaultData;
  }
}
