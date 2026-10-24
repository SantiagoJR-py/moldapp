import { request } from '@/lib/http';

export type AssetTypeRef = {
  id: number;
  name: string | null;
};

export type AssetBrand = {
  id: number;
  name: string | null;
  types: AssetTypeRef[];
};

type BrandsResponse = { ok: boolean; brands: AssetBrand[] };

export const assetService = {
  /** GET /app/asset-brands — marcas con tipos para el formulario de portería. */
  async brands(): Promise<AssetBrand[]> {
    const response = await request<BrandsResponse>('/app/asset-brands', { auth: true });
    return response.brands;
  },
};
