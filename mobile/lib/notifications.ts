import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Request push notification permissions and register the device token.
 * Stores the Expo Push Token in the user's profile for server-side delivery.
 * Safe to call multiple times — compares with stored token before writing.
 */
export async function registerPushToken(userId: string): Promise<void> {
  // iOS: physical device only (simulator can't receive push)
  if (Platform.OS === 'ios') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return; // user declined
  }

  // Android: notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Fastwell',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // set in app.json / eas.json
    });
    const token = tokenData.data;

    // Only write to Supabase if the token has changed (avoids unnecessary writes)
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (profile?.push_token !== token) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    }
  } catch {
    // Gracefully ignore: push not critical to app function
  }
}

/**
 * Clear the stored push token on sign-out so notifications
 * stop being delivered to this device.
 */
export async function clearPushToken(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', userId);
}
