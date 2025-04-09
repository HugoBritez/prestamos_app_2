import { useState } from 'react'
import type { NotificationType } from '../components/UI/Notification'

export function useNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false,
  })

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({
      message,
      type,
      visible: true,
    })
  }

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      visible: false,
    }))
  }

  return {
    notification,
    showSuccess: (message: string) => showNotification(message, 'success'),
    showError: (message: string) => showNotification(message, 'error'),
    showInfo: (message: string) => showNotification(message, 'info'),
    hideNotification,
  }
} 