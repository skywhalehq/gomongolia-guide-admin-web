import { User } from "./users";

export interface Company {
  id: number;
  code: string;
  name: string;
  name_en: string;
  phone: string;
}

export interface Tourist {
  id: number;
  created_at: string;
  trip_id: number;
  country_id: number;
  male: number;
  female: number;
}

export interface Trip {
  id: number;
  created_at: string;
  code: string;
  guide: User;
  driver: User;
  company: Company;
  tourists: Tourist[];
  is_finished: boolean;
  is_cancelled: boolean;
  expires_at: string;
  store_id: number;
  total_amount: number;
}
