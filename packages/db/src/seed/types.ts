export interface SeedClinic {
  id: string;
  name: string;
}

export interface SeedContext {
  clinics: SeedClinic[];
  now: Date;
}
