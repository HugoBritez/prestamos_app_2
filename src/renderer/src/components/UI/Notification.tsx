import {  useEffect } from 'react'

export type NotificationType = 'success' | 'error' | 'info'

interface NotificationProps {
  message: string
  type: NotificationType
  duration?: number
  onClose: () => void
}

export function Notification({ message, type, duration = 3000, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getNotificationClasses = () => {
    const baseClasses = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-xs z-50 text-white'
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-600`
      case 'error':
        return `${baseClasses} bg-red-600`
      case 'info':
        return `${baseClasses} bg-blue-600`
      default:
        return `${baseClasses} bg-gray-700`
    }
  }

  return (
    <div className={getNotificationClasses()}>
      <div className="flex items-center">
        <span className="mr-2">
          {type === 'success' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'error' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'info' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 7a1 1 0 01-1-1v-3a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        <p>{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="absolute top-1 right-1 text-white hover:text-gray-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
} 