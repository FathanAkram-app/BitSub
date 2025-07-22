export const formatSats = (sats: number | bigint): string => {
  return Number(sats).toLocaleString();
};

export const formatDate = (timestamp: number | bigint): string => {
  return new Date(Number(timestamp) / 1000000).toLocaleDateString();
};

export const getIntervalText = (interval: { Daily?: null; Weekly?: null; Monthly?: null; Yearly?: null }): string => {
  if (interval.Daily !== undefined) return 'day';
  if (interval.Weekly !== undefined) return 'week';
  if (interval.Monthly !== undefined) return 'month';
  if (interval.Yearly !== undefined) return 'year';
  return 'month';
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

export const truncateAddress = (address: string, length: number = 8): string => {
  if (!address) return '';
  return `...${address.slice(-length)}`;
};