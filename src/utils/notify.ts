

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return \"denied\";
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return \"denied\";
  if (Notification.permission !== \"default\") return Notification.permission;
  return await Notification.requestPermission();
};

export const showPrayerNotification = (title: string, body: string) => {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== \"granted\") return null;

  try {
    return new Notification(title, {
      body,
      // use existing public assets if any; safe fallback to favicon
      icon: \"/favicon.png\",
      tag: \"prayer-azan\",
    });
  } catch {
    return null;
  }
};
