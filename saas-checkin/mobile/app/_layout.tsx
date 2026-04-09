import { useEffect, useCallback } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { useAuthStore } from '@/stores/auth.store'
import { useSocket } from '@/hooks/useSocket'
import { EVENT_LABELS } from '@/constants'
import type { AccessLog } from '@/types'

SplashScreen.preventAutoHideAsync()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function NotificationBridge() {
  useSocket('access:new', useCallback((log: AccessLog) => {
    const cfg = EVENT_LABELS[log.eventType]
    const title = cfg ? `${cfg.emoji} ${cfg.label}` : 'Acesso registrado'
    const body = log.client?.name
      ? `${log.client.name} — ${log.device?.name ?? ''}`
      : `UID: ${log.cardUid}`
    Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    }).catch(() => {})
  }, []))
  return null
}

export default function RootLayout() {
  const { loadFromStorage, isLoading } = useAuthStore()

  useEffect(() => {
    loadFromStorage().then(() => SplashScreen.hideAsync())
  }, [])

  if (isLoading) return null

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationBridge />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  )
}
