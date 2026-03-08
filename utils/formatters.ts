export const formatAgentId = (num: number) => {
  // padStart(3, '0') makes sure '1' becomes '001', and '12' becomes '012'
  return `AGENT_${String(num).padStart(3, '0')}`; 
};