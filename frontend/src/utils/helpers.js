export const formatSats = (sats) => {
  return Number(sats).toLocaleString()
}

export const formatDate = (timestamp) => {
  return new Date(Number(timestamp) / 1000000).toLocaleDateString()
}

export const getIntervalText = (interval) => {
  if (interval.Daily) return 'day'
  if (interval.Weekly) return 'week'
  if (interval.Monthly) return 'month'
  if (interval.Yearly) return 'year'
  return 'month'
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    return false
  }
}

export const truncateAddress = (address, length = 8) => {
  if (!address) return ''
  return `...${address.slice(-length)}`
}