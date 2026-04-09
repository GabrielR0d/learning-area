import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/auth.store'

export default function Index() {
  const token = useAuthStore((s) => s.accessToken)
  return <Redirect href={token ? '/(tabs)/' : '/(auth)/login'} />
}
