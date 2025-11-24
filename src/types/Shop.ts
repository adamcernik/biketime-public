export interface Shop {
    id: string;
    name: string;
    address: string;
    url?: string;
    website?: string;
    map: string;
    lat?: number;
    lng?: number;
    isActive?: boolean;
    updatedAt: number;
    updatedBy: string;
    order?: number;
}
