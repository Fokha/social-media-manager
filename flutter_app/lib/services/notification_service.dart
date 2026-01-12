import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    tz.initializeTimeZones();

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    _initialized = true;
  }

  void _onNotificationTap(NotificationResponse response) {
    // Handle notification tap - navigate to relevant screen
    final payload = response.payload;
    if (payload != null) {
      // Parse payload and navigate
      // Example: payload = 'post:123' -> navigate to post detail
    }
  }

  Future<void> requestPermissions() async {
    await _notifications
        .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(alert: true, badge: true, sound: true);

    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
  }

  // Show immediate notification
  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'social_media_manager',
      'Social Media Manager',
      channelDescription: 'Notifications from Social Media Manager',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(id, title, body, details, payload: payload);
  }

  // Schedule notification for future
  Future<void> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledTime,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'scheduled_posts',
      'Scheduled Posts',
      channelDescription: 'Notifications for scheduled posts',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.zonedSchedule(
      id,
      title,
      body,
      tz.TZDateTime.from(scheduledTime, tz.local),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      payload: payload,
    );
  }

  // Cancel notification
  Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }

  // Cancel all notifications
  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }

  // Notify when post is published
  Future<void> notifyPostPublished(String postId, String platform) async {
    await showNotification(
      id: postId.hashCode,
      title: 'Post Published!',
      body: 'Your post was successfully published to $platform',
      payload: 'post:$postId',
    );
  }

  // Notify when scheduled post is about to publish
  Future<void> notifyScheduledPost(String postId, String platform, DateTime publishTime) async {
    final reminderTime = publishTime.subtract(const Duration(minutes: 15));
    if (reminderTime.isAfter(DateTime.now())) {
      await scheduleNotification(
        id: postId.hashCode,
        title: 'Scheduled Post Reminder',
        body: 'Your $platform post will be published in 15 minutes',
        scheduledTime: reminderTime,
        payload: 'post:$postId',
      );
    }
  }

  // Notify new message received
  Future<void> notifyNewMessage(String senderName, String preview) async {
    await showNotification(
      id: DateTime.now().millisecondsSinceEpoch,
      title: 'New message from $senderName',
      body: preview.length > 50 ? '${preview.substring(0, 50)}...' : preview,
      payload: 'messages',
    );
  }

  // Notify AI credits running low
  Future<void> notifyLowCredits(int remaining) async {
    await showNotification(
      id: 'credits'.hashCode,
      title: 'AI Credits Running Low',
      body: 'You have $remaining AI credits remaining. Consider upgrading your plan.',
      payload: 'subscription',
    );
  }
}
