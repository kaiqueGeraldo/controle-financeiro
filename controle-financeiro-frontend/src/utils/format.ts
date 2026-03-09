export const formatCurrency = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatDate = (dateString: string) => 
  new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });