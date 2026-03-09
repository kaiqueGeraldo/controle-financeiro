export interface Usuario {
  id: string;
  nome: string;
  email: string;
  privacyMode: boolean;
  darkMode: boolean;
  notifContas: boolean;
  notifSemanal: boolean;
  dashboardConfig?: string;
}