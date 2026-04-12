// Push notification utilities

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported')
    return null
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key not configured')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check current permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return null
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push:', error)
    return null
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      return true
    }

    return false
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error)
    return false
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch (error) {
    console.error('Failed to get push subscription:', error)
    return null
  }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

// Send subscription to server
export async function saveSubscriptionToServer(
  sessionId: string,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        subscription: subscription.toJSON(),
      }),
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Failed to save subscription:', error)
    return false
  }
}

// Remove subscription from server
export async function removeSubscriptionFromServer(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/push-subscribe?sessionId=${sessionId}`, {
      method: 'DELETE',
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Failed to remove subscription:', error)
    return false
  }
}
