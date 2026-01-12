import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsState {
  final ThemeMode themeMode;
  final bool notifications;
  final bool emailNotifications;
  final bool pushNotifications;
  final String language;
  final String timezone;

  const SettingsState({
    this.themeMode = ThemeMode.light,
    this.notifications = true,
    this.emailNotifications = true,
    this.pushNotifications = false,
    this.language = 'English',
    this.timezone = 'UTC-5 (EST)',
  });

  SettingsState copyWith({
    ThemeMode? themeMode,
    bool? notifications,
    bool? emailNotifications,
    bool? pushNotifications,
    String? language,
    String? timezone,
  }) {
    return SettingsState(
      themeMode: themeMode ?? this.themeMode,
      notifications: notifications ?? this.notifications,
      emailNotifications: emailNotifications ?? this.emailNotifications,
      pushNotifications: pushNotifications ?? this.pushNotifications,
      language: language ?? this.language,
      timezone: timezone ?? this.timezone,
    );
  }
}

class SettingsCubit extends Cubit<SettingsState> {
  SettingsCubit() : super(const SettingsState()) {
    _loadSettings();
  }

  static const _themeModeKey = 'theme_mode';
  static const _notificationsKey = 'notifications';
  static const _emailNotificationsKey = 'email_notifications';
  static const _pushNotificationsKey = 'push_notifications';
  static const _languageKey = 'language';
  static const _timezoneKey = 'timezone';

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();

    final themeModeIndex = prefs.getInt(_themeModeKey) ?? 1; // Default to light
    final themeMode = ThemeMode.values[themeModeIndex];

    emit(state.copyWith(
      themeMode: themeMode,
      notifications: prefs.getBool(_notificationsKey) ?? true,
      emailNotifications: prefs.getBool(_emailNotificationsKey) ?? true,
      pushNotifications: prefs.getBool(_pushNotificationsKey) ?? false,
      language: prefs.getString(_languageKey) ?? 'English',
      timezone: prefs.getString(_timezoneKey) ?? 'UTC-5 (EST)',
    ));
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_themeModeKey, mode.index);
    emit(state.copyWith(themeMode: mode));
  }

  Future<void> toggleDarkMode(bool isDark) async {
    await setThemeMode(isDark ? ThemeMode.dark : ThemeMode.light);
  }

  Future<void> setNotifications(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notificationsKey, value);
    emit(state.copyWith(notifications: value));
  }

  Future<void> setEmailNotifications(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_emailNotificationsKey, value);
    emit(state.copyWith(emailNotifications: value));
  }

  Future<void> setPushNotifications(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_pushNotificationsKey, value);
    emit(state.copyWith(pushNotifications: value));
  }

  Future<void> setLanguage(String language) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languageKey, language);
    emit(state.copyWith(language: language));
  }

  Future<void> setTimezone(String timezone) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_timezoneKey, timezone);
    emit(state.copyWith(timezone: timezone));
  }

  Future<void> resetSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_themeModeKey);
    await prefs.remove(_notificationsKey);
    await prefs.remove(_emailNotificationsKey);
    await prefs.remove(_pushNotificationsKey);
    await prefs.remove(_languageKey);
    await prefs.remove(_timezoneKey);
    emit(const SettingsState());
  }
}
