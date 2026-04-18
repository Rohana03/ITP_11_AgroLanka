
export const formatLKR = (value) => {
  try { return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(Number(value||0)) }
  catch(e){ return `Rs. ${Number(value||0).toFixed(2)}` }
}
