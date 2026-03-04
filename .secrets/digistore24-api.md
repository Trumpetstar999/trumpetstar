# DigiStore24 API Configuration
# Last updated: 2026-02-22

## Credentials
- Seller ID: 1598819
- API Key: geBjb9gMS3Qe9lOiwjV93y9lfsOTK7ty9CuQQMON
- Full Key: 1598819-geBjb9gMS3Qe9lOiwjV93y9lfsOTK7ty9CuQQMON

## Storage
- API Key stored in: ~/.openclaw/agent/digistore24-credentials (secure, chmod 600)
- Do NOT commit this file to git

## API Endpoints (to be confirmed)
DigiStore24 API documentation needed. Current attempts:
- https://www.digistore24.com/api/getPurchaseList - 404
- https://api.digistore24.com/api/getPurchaseList - 404
- https://www.digistore24.com/marketplace/api/getProducts - 404

Likely correct endpoint format:
- https://www.digistore24.com/api/v1/...
- Or uses different authentication header

## Next Steps
1. Check DigiStore24 API documentation at:
   https://www.digistore24.com/en/merchant/api
2. Verify correct base URL and endpoint paths
3. Test authentication format (X-API-Key vs Authorization Bearer)

## Database Integration
Supabase table: digistore_orders
Fields: order_id, product_name, customer_name, email, address, status, shipping_status, etc.
