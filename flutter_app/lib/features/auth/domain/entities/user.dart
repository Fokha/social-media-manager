import 'package:equatable/equatable.dart';

enum UserRole { user, admin, superAdmin }

class User extends Equatable {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? avatar;
  final UserRole role;
  final bool isActive;
  final bool isEmailVerified;
  final DateTime? lastLoginAt;
  final UserSettings settings;
  final Subscription? subscription;

  const User({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    this.avatar,
    required this.role,
    required this.isActive,
    required this.isEmailVerified,
    this.lastLoginAt,
    required this.settings,
    this.subscription,
  });

  String get fullName => [firstName, lastName].whereType<String>().join(' ').trim();
  String get displayName => fullName.isNotEmpty ? fullName : email;
  String get initials {
    if (firstName != null && firstName!.isNotEmpty) {
      return firstName![0].toUpperCase();
    }
    return email[0].toUpperCase();
  }

  bool get isAdmin => role == UserRole.admin || role == UserRole.superAdmin;
  bool get isSuperAdmin => role == UserRole.superAdmin;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      avatar: json['avatar'] as String?,
      role: _parseRole(json['role'] as String? ?? 'user'),
      isActive: json['isActive'] as bool? ?? true,
      isEmailVerified: json['isEmailVerified'] as bool? ?? false,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.parse(json['lastLoginAt'] as String)
          : null,
      settings: UserSettings.fromJson(
        json['settings'] as Map<String, dynamic>? ?? {},
      ),
      subscription: json['subscription'] != null
          ? Subscription.fromJson(json['subscription'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'avatar': avatar,
      'role': role.name,
      'isActive': isActive,
      'isEmailVerified': isEmailVerified,
      'lastLoginAt': lastLoginAt?.toIso8601String(),
      'settings': settings.toJson(),
      'subscription': subscription?.toJson(),
    };
  }

  static UserRole _parseRole(String role) {
    switch (role) {
      case 'admin':
        return UserRole.admin;
      case 'super_admin':
        return UserRole.superAdmin;
      default:
        return UserRole.user;
    }
  }

  User copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? avatar,
    UserRole? role,
    bool? isActive,
    bool? isEmailVerified,
    DateTime? lastLoginAt,
    UserSettings? settings,
    Subscription? subscription,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      avatar: avatar ?? this.avatar,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      settings: settings ?? this.settings,
      subscription: subscription ?? this.subscription,
    );
  }

  @override
  List<Object?> get props => [
        id,
        email,
        firstName,
        lastName,
        avatar,
        role,
        isActive,
        isEmailVerified,
        lastLoginAt,
        settings,
        subscription,
      ];
}

class UserSettings extends Equatable {
  final NotificationSettings notifications;
  final String timezone;
  final String language;

  const UserSettings({
    required this.notifications,
    required this.timezone,
    required this.language,
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      notifications: NotificationSettings.fromJson(
        json['notifications'] as Map<String, dynamic>? ?? {},
      ),
      timezone: json['timezone'] as String? ?? 'UTC',
      language: json['language'] as String? ?? 'en',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'notifications': notifications.toJson(),
      'timezone': timezone,
      'language': language,
    };
  }

  @override
  List<Object?> get props => [notifications, timezone, language];
}

class NotificationSettings extends Equatable {
  final bool email;
  final bool push;
  final bool sms;

  const NotificationSettings({
    required this.email,
    required this.push,
    required this.sms,
  });

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      email: json['email'] as bool? ?? true,
      push: json['push'] as bool? ?? true,
      sms: json['sms'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'push': push,
      'sms': sms,
    };
  }

  @override
  List<Object?> get props => [email, push, sms];
}

class Subscription extends Equatable {
  final String id;
  final String plan;
  final String status;
  final DateTime? currentPeriodEnd;
  final bool cancelAtPeriodEnd;
  final SubscriptionLimits limits;
  final SubscriptionUsage usage;

  const Subscription({
    required this.id,
    required this.plan,
    required this.status,
    this.currentPeriodEnd,
    required this.cancelAtPeriodEnd,
    required this.limits,
    required this.usage,
  });

  bool get isActive => status == 'active' || status == 'trialing';
  bool get isPaid => plan != 'free';

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['id'] as String,
      plan: json['plan'] as String? ?? 'free',
      status: json['status'] as String? ?? 'active',
      currentPeriodEnd: json['currentPeriodEnd'] != null
          ? DateTime.parse(json['currentPeriodEnd'] as String)
          : null,
      cancelAtPeriodEnd: json['cancelAtPeriodEnd'] as bool? ?? false,
      limits: SubscriptionLimits.fromJson(
        json['limits'] as Map<String, dynamic>? ?? {},
      ),
      usage: SubscriptionUsage.fromJson(
        json['usage'] as Map<String, dynamic>? ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'plan': plan,
      'status': status,
      'currentPeriodEnd': currentPeriodEnd?.toIso8601String(),
      'cancelAtPeriodEnd': cancelAtPeriodEnd,
      'limits': limits.toJson(),
      'usage': usage.toJson(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        plan,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        limits,
        usage,
      ];
}

class SubscriptionLimits extends Equatable {
  final int socialAccounts;
  final int postsPerMonth;
  final int aiCredits;
  final int teamMembers;
  final int scheduledPosts;

  const SubscriptionLimits({
    required this.socialAccounts,
    required this.postsPerMonth,
    required this.aiCredits,
    required this.teamMembers,
    required this.scheduledPosts,
  });

  factory SubscriptionLimits.fromJson(Map<String, dynamic> json) {
    return SubscriptionLimits(
      socialAccounts: json['socialAccounts'] as int? ?? 2,
      postsPerMonth: json['postsPerMonth'] as int? ?? 20,
      aiCredits: json['aiCredits'] as int? ?? 50,
      teamMembers: json['teamMembers'] as int? ?? 1,
      scheduledPosts: json['scheduledPosts'] as int? ?? 5,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'socialAccounts': socialAccounts,
      'postsPerMonth': postsPerMonth,
      'aiCredits': aiCredits,
      'teamMembers': teamMembers,
      'scheduledPosts': scheduledPosts,
    };
  }

  @override
  List<Object?> get props => [
        socialAccounts,
        postsPerMonth,
        aiCredits,
        teamMembers,
        scheduledPosts,
      ];
}

class SubscriptionUsage extends Equatable {
  final int socialAccounts;
  final int postsThisMonth;
  final int aiCreditsUsed;
  final int teamMembers;

  const SubscriptionUsage({
    required this.socialAccounts,
    required this.postsThisMonth,
    required this.aiCreditsUsed,
    required this.teamMembers,
  });

  factory SubscriptionUsage.fromJson(Map<String, dynamic> json) {
    return SubscriptionUsage(
      socialAccounts: json['socialAccounts'] as int? ?? 0,
      postsThisMonth: json['postsThisMonth'] as int? ?? 0,
      aiCreditsUsed: json['aiCreditsUsed'] as int? ?? 0,
      teamMembers: json['teamMembers'] as int? ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'socialAccounts': socialAccounts,
      'postsThisMonth': postsThisMonth,
      'aiCreditsUsed': aiCreditsUsed,
      'teamMembers': teamMembers,
    };
  }

  @override
  List<Object?> get props => [
        socialAccounts,
        postsThisMonth,
        aiCreditsUsed,
        teamMembers,
      ];
}
