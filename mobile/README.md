# Pharmacy Mobile

Expo mobile client for the pharmacy system.

## Run

```bash
cd mobile
npm start
```

## Backend URL

Set `EXPO_PUBLIC_API_BASE_URL` when the backend is not reachable at the default simulator URLs.

Examples:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:5000/api
```

If you are running the backend on a Windows PC and opening the app with Expo Go on a physical Android device, use the Windows PC's LAN IP address. `localhost` will point to the phone, not the PC.

Windows examples:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.x.x:5001/api"
npm start
```

```bat
set EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:5001/api && npm start
```

If you use an Android emulator on the same PC, `http://10.0.2.2:5001/api` will usually work.

## Included flows

- Customer login and registration
- Medicine browsing and detail view
- Cart management and checkout
- Order history and order details
- Profile editing and logout
