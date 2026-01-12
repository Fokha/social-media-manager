import 'package:flutter/material.dart';
import '../../../../services/oauth_service.dart';

/// Social sign-in provider types
enum SocialProvider {
  google,
  apple,
  microsoft,
  facebook,
}

/// Configuration for social provider buttons
class SocialProviderConfig {
  final String name;
  final Color backgroundColor;
  final Color textColor;
  final Color iconColor;
  final String? iconAsset;
  final IconData? iconData;

  const SocialProviderConfig({
    required this.name,
    required this.backgroundColor,
    required this.textColor,
    this.iconColor = Colors.white,
    this.iconAsset,
    this.iconData,
  });
}

/// Social sign-in button widget with consistent styling
class SocialSignInButton extends StatelessWidget {
  final SocialProvider provider;
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isOutlined;
  final double height;
  final double? width;
  final double borderRadius;
  final String? customText;

  const SocialSignInButton({
    super.key,
    required this.provider,
    required this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.height = 52,
    this.width,
    this.borderRadius = 12,
    this.customText,
  });

  /// Provider configurations
  static const Map<SocialProvider, SocialProviderConfig> _configs = {
    SocialProvider.google: SocialProviderConfig(
      name: 'Google',
      backgroundColor: Colors.white,
      textColor: Color(0xFF757575),
      iconColor: Color(0xFF4285F4),
    ),
    SocialProvider.apple: SocialProviderConfig(
      name: 'Apple',
      backgroundColor: Colors.black,
      textColor: Colors.white,
      iconColor: Colors.white,
      iconData: Icons.apple,
    ),
    SocialProvider.microsoft: SocialProviderConfig(
      name: 'Microsoft',
      backgroundColor: Color(0xFF2F2F2F),
      textColor: Colors.white,
      iconColor: Colors.white,
    ),
    SocialProvider.facebook: SocialProviderConfig(
      name: 'Facebook',
      backgroundColor: Color(0xFF1877F2),
      textColor: Colors.white,
      iconColor: Colors.white,
      iconData: Icons.facebook,
    ),
  };

  SocialProviderConfig get _config => _configs[provider]!;

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final config = _config;

    // Adjust colors for dark mode and outlined variant
    Color bgColor = config.backgroundColor;
    Color txtColor = config.textColor;

    if (isOutlined) {
      bgColor = Colors.transparent;
      txtColor = isDarkMode ? Colors.white : Colors.black87;
    } else if (isDarkMode && provider == SocialProvider.google) {
      bgColor = const Color(0xFF131314);
      txtColor = Colors.white;
    }

    return SizedBox(
      height: height,
      width: width ?? double.infinity,
      child: Material(
        color: bgColor,
        borderRadius: BorderRadius.circular(borderRadius),
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(borderRadius),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              border: isOutlined || provider == SocialProvider.google
                  ? Border.all(
                      color: isDarkMode
                          ? Colors.grey.shade700
                          : Colors.grey.shade300,
                      width: 1,
                    )
                  : null,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading)
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(txtColor),
                    ),
                  )
                else ...[
                  _buildProviderIcon(),
                  const SizedBox(width: 12),
                  Text(
                    customText ?? 'Continue with ${config.name}',
                    style: TextStyle(
                      color: txtColor,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProviderIcon() {
    switch (provider) {
      case SocialProvider.google:
        return _buildGoogleIcon();
      case SocialProvider.apple:
        return Icon(
          Icons.apple,
          size: 24,
          color: _config.iconColor,
        );
      case SocialProvider.microsoft:
        return _buildMicrosoftIcon();
      case SocialProvider.facebook:
        return Icon(
          Icons.facebook,
          size: 24,
          color: _config.iconColor,
        );
    }
  }

  /// Google's multi-colored G icon
  Widget _buildGoogleIcon() {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(
        painter: _GoogleLogoPainter(),
      ),
    );
  }

  /// Microsoft's 4-square icon
  Widget _buildMicrosoftIcon() {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(
        painter: _MicrosoftLogoPainter(),
      ),
    );
  }
}

/// Custom painter for Google's G logo
class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.width;

    // Google G colors
    final Paint bluePaint = Paint()..color = const Color(0xFF4285F4);
    final Paint redPaint = Paint()..color = const Color(0xFFEA4335);
    final Paint yellowPaint = Paint()..color = const Color(0xFFFBBC05);
    final Paint greenPaint = Paint()..color = const Color(0xFF34A853);

    // Draw the G shape
    final Path path = Path();

    // Blue part (right side)
    path.moveTo(s * 0.95, s * 0.5);
    path.arcToPoint(
      Offset(s * 0.5, s * 0.95),
      radius: Radius.circular(s * 0.45),
      clockwise: true,
    );
    canvas.drawPath(path, bluePaint);

    path.reset();

    // Green part (bottom)
    path.moveTo(s * 0.5, s * 0.95);
    path.arcToPoint(
      Offset(s * 0.05, s * 0.5),
      radius: Radius.circular(s * 0.45),
      clockwise: true,
    );
    canvas.drawPath(path, greenPaint);

    path.reset();

    // Yellow part (left side)
    path.moveTo(s * 0.05, s * 0.5);
    path.arcToPoint(
      Offset(s * 0.5, s * 0.05),
      radius: Radius.circular(s * 0.45),
      clockwise: true,
    );
    canvas.drawPath(path, yellowPaint);

    path.reset();

    // Red part (top)
    path.moveTo(s * 0.5, s * 0.05);
    path.arcToPoint(
      Offset(s * 0.95, s * 0.5),
      radius: Radius.circular(s * 0.45),
      clockwise: true,
    );
    canvas.drawPath(path, redPaint);

    // Draw center cutout and horizontal bar
    final Paint whitePaint = Paint()..color = Colors.white;
    canvas.drawCircle(Offset(s * 0.5, s * 0.5), s * 0.25, whitePaint);

    // Horizontal bar
    canvas.drawRect(
      Rect.fromLTWH(s * 0.5, s * 0.4, s * 0.45, s * 0.2),
      bluePaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Custom painter for Microsoft's 4-square logo
class _MicrosoftLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.width;
    final double gap = s * 0.08;
    final double squareSize = (s - gap) / 2;

    // Microsoft colors
    final Paint redPaint = Paint()..color = const Color(0xFFF25022);
    final Paint greenPaint = Paint()..color = const Color(0xFF7FBA00);
    final Paint bluePaint = Paint()..color = const Color(0xFF00A4EF);
    final Paint yellowPaint = Paint()..color = const Color(0xFFFFB900);

    // Top-left (red)
    canvas.drawRect(
      Rect.fromLTWH(0, 0, squareSize, squareSize),
      redPaint,
    );

    // Top-right (green)
    canvas.drawRect(
      Rect.fromLTWH(squareSize + gap, 0, squareSize, squareSize),
      greenPaint,
    );

    // Bottom-left (blue)
    canvas.drawRect(
      Rect.fromLTWH(0, squareSize + gap, squareSize, squareSize),
      bluePaint,
    );

    // Bottom-right (yellow)
    canvas.drawRect(
      Rect.fromLTWH(squareSize + gap, squareSize + gap, squareSize, squareSize),
      yellowPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// A row of social sign-in icon buttons (compact variant)
class SocialSignInIconRow extends StatelessWidget {
  final VoidCallback? onGooglePressed;
  final VoidCallback? onApplePressed;
  final VoidCallback? onMicrosoftPressed;
  final VoidCallback? onFacebookPressed;
  final bool isLoading;
  final double iconSize;
  final double spacing;

  const SocialSignInIconRow({
    super.key,
    this.onGooglePressed,
    this.onApplePressed,
    this.onMicrosoftPressed,
    this.onFacebookPressed,
    this.isLoading = false,
    this.iconSize = 48,
    this.spacing = 16,
  });

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (onGooglePressed != null)
          _SocialIconButton(
            onPressed: onGooglePressed!,
            isLoading: isLoading,
            size: iconSize,
            backgroundColor: isDarkMode ? const Color(0xFF131314) : Colors.white,
            borderColor: isDarkMode ? Colors.grey.shade700 : Colors.grey.shade300,
            child: SizedBox(
              width: 20,
              height: 20,
              child: CustomPaint(painter: _GoogleLogoPainter()),
            ),
          ),
        if (onGooglePressed != null &&
            (onApplePressed != null || onMicrosoftPressed != null || onFacebookPressed != null))
          SizedBox(width: spacing),
        if (onApplePressed != null)
          _SocialIconButton(
            onPressed: onApplePressed!,
            isLoading: isLoading,
            size: iconSize,
            backgroundColor: isDarkMode ? Colors.white : Colors.black,
            child: Icon(
              Icons.apple,
              size: 24,
              color: isDarkMode ? Colors.black : Colors.white,
            ),
          ),
        if (onApplePressed != null &&
            (onMicrosoftPressed != null || onFacebookPressed != null))
          SizedBox(width: spacing),
        if (onMicrosoftPressed != null)
          _SocialIconButton(
            onPressed: onMicrosoftPressed!,
            isLoading: isLoading,
            size: iconSize,
            backgroundColor: const Color(0xFF2F2F2F),
            child: SizedBox(
              width: 20,
              height: 20,
              child: CustomPaint(painter: _MicrosoftLogoPainter()),
            ),
          ),
        if (onMicrosoftPressed != null && onFacebookPressed != null)
          SizedBox(width: spacing),
        if (onFacebookPressed != null)
          _SocialIconButton(
            onPressed: onFacebookPressed!,
            isLoading: isLoading,
            size: iconSize,
            backgroundColor: const Color(0xFF1877F2),
            child: const Icon(
              Icons.facebook,
              size: 24,
              color: Colors.white,
            ),
          ),
      ],
    );
  }
}

class _SocialIconButton extends StatelessWidget {
  final VoidCallback onPressed;
  final bool isLoading;
  final double size;
  final Color backgroundColor;
  final Color? borderColor;
  final Widget child;

  const _SocialIconButton({
    required this.onPressed,
    required this.isLoading,
    required this.size,
    required this.backgroundColor,
    this.borderColor,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: isLoading ? null : onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: borderColor != null
                ? Border.all(color: borderColor!, width: 1)
                : null,
          ),
          child: Center(
            child: isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(
                        backgroundColor == Colors.white || backgroundColor == const Color(0xFF131314)
                            ? Colors.black54
                            : Colors.white,
                      ),
                    ),
                  )
                : child,
          ),
        ),
      ),
    );
  }
}

/// Divider with "OR" text
class OrDivider extends StatelessWidget {
  final String text;
  final double padding;

  const OrDivider({
    super.key,
    this.text = 'OR',
    this.padding = 24,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = Theme.of(context).textTheme.bodySmall?.color ?? Colors.grey;

    return Padding(
      padding: EdgeInsets.symmetric(vertical: padding),
      child: Row(
        children: [
          Expanded(
            child: Divider(
              color: textColor.withValues(alpha: 0.3),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              text,
              style: TextStyle(
                color: textColor,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Divider(
              color: textColor.withValues(alpha: 0.3),
            ),
          ),
        ],
      ),
    );
  }
}
