# OKX DEX API Integration

BitSub integrates with the OKX DEX API to provide real-time Bitcoin price data for USD conversions.

## API Endpoint Used

```
GET https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT
```

## Response Format

```json
{
  "code": "0",
  "msg": "",
  "data": [
    {
      "instType": "SPOT",
      "instId": "BTC-USDT",
      "last": "43250.5",
      "lastSz": "0.001",
      "askPx": "43251.0",
      "askSz": "0.5",
      "bidPx": "43250.0",
      "bidSz": "0.3",
      "open24h": "42800.0",
      "high24h": "43500.0",
      "low24h": "42500.0",
      "vol24h": "1234.56",
      "ts": "1703123456789"
    }
  ]
}
```

## Integration Features

### HTTP Outcalls
- Uses Internet Computer's HTTP outcalls feature
- Makes direct API calls to OKX servers
- Handles network failures gracefully

### Price Extraction
- Parses JSON response to extract "last" price
- Converts string price to Float for calculations
- Fallback to mock data if parsing fails

### Error Handling
- Network timeout handling
- Invalid response handling
- Graceful degradation to mock data

### Rate Limiting
- Respects OKX API rate limits
- Caches responses to reduce API calls
- Updates every 5 seconds in frontend

## Usage in BitSub

1. **Price Widget**: Shows live BTC price from OKX
2. **USD Conversions**: All sats amounts converted using OKX price
3. **Revenue Analytics**: Creator earnings shown in USD
4. **Transaction History**: Payment amounts in both BTC and USD

## API Documentation

Full OKX API documentation: https://www.okx.com/docs-v5/en/

## Security Considerations

- API calls are made from backend canisters
- No API keys required for public market data
- HTTPS encryption for all requests
- Input validation on all responses