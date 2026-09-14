import { IDENTIFICATION_TYPES } from '@/constants/identification-types';
import { request } from '@/lib/http';

export type IdentificationTypeOption = {
  id: number;
  name: string | null;
};

type IdentificationTypesResponse = {
  ok: boolean;
  identificationTypes: IdentificationTypeOption[];
};

export const catalogService = {
  /**
   * GET /app/identification-types. Si el API no responde se usa la copia local
   * del seeder para que el registro no quede bloqueado.
   */
  async identificationTypes(): Promise<IdentificationTypeOption[]> {
    try {
      const response = await request<IdentificationTypesResponse>('/app/identification-types');

      if (response.identificationTypes?.length) {
        return response.identificationTypes;
      }
    } catch {
      // Silencioso a propósito: el respaldo local cubre el caso.
    }

    return IDENTIFICATION_TYPES.map((type) => ({ id: type.id, name: type.name }));
  },
};
