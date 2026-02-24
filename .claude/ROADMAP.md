# BestLife Financial Freedom Module — Roadmap (Post-MVP)

## Future Features

- Native mobile app (React Native + shared API)
- Real-time sync (WebSockets)
- Bank integration (Plaid equivalent for Brazil)
- AI-powered transaction inference (OpenAI API — MVP uses rule-based parsing)
- Multi-currency support
- Collaborative features (shared goals)
- Export/backup data
- Dark mode
- Offline support (PWA service worker)
- Google OAuth provider (MVP uses email magic link only)

---

## Mobile Integration (React Native)

When building the React Native client, it shares the same types and validation schemas as the web app.

### API Client
```typescript
// mobile/src/lib/api.ts
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
  baseURL: 'https://lifeos.app/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) navigation.navigate('Login')
    return Promise.reject(error)
  }
)

export default api
```

### Shared Types & Validation
```typescript
// mobile uses the same types and schemas as the web app
import { CreateTransactionInput, Transaction } from '@/types/transaction'
import { CreateTransactionSchema } from '@/lib/validations/transaction'
```

---

## Scheduled Jobs (Cron — Vercel Cron)

### Daily (9 PM user local time)
- Check daily reminder notifications
- Create due recurring transactions
- Update streaks

### Weekly (user's preferred day/time)
- Send weekly review notifications
- Generate weekly reports
- Award weekly badges

### Monthly (1st of month)
- Generate monthly reports
- Send monthly insights
- Recalculate lifestyle costs
- Update FI projections
