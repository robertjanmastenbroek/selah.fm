import os, hmac, hashlib, json, time, subprocess, http.client

os.chdir('/Users/motomoto/Documents/selah.fm')
result = subprocess.run(['railway', 'variables', '--json'], capture_output=True, text=True)
vars = json.loads(result.stdout)
secret = vars.get('STRIPE_WEBHOOK_SECRET', '')
if not secret:
    print('NO WEBHOOK SECRET FOUND')
    exit(1)

# Build a test payment_intent.succeeded event
payload = {
    'id': 'evt_test_' + str(int(time.time())),
    'type': 'payment_intent.succeeded',
    'data': {
        'object': {
            'id': 'pi_test_' + str(int(time.time())),
            'amount': 10000,
            'metadata': {
                'campaignId': '7a50e2fc-5d88-40b3-931a-fef6c7bbcfc5',
                'type': 'campaign_donation',
                'donorName': 'Test Donor',
                'donorEmail': 'test@selah.fm',
            }
        }
    }
}
body = json.dumps(payload)

# Sign using the webhook secret
timestamp = str(int(time.time()))
signed = f'{timestamp}.{body}'
sig = hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()
header = f't={timestamp},v1={sig}'

# Send to webhook
conn = http.client.HTTPSConnection('selah.fm', timeout=15)
conn.request('POST', '/api/stripe/webhook', body=body, headers={
    'Content-Type': 'application/json',
    'Stripe-Signature': header,
})
resp = conn.getresponse()
data = resp.read().decode()
print(f'Status: {resp.status}')
print(f'Response: {data}')
conn.close()
