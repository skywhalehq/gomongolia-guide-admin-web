export interface User {
  id: number;
  created_at: string;      // ISO date string
  updated_at: string;      // ISO date string
  name: string;
  surname: string;
  commission: number;
  rd: string;
  type: string;
  plate_number: string;
  car_model: string;
  bank_code: string;
  bank_name: string;
  bank_account: string;
  is_active: boolean;
  is_onboarded: boolean;
  last_login_at: string;   // ISO date string
  phone: string;
  two_factor_enabled: boolean;
  reward_amount: number;
}
