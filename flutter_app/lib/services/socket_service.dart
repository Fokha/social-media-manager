import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../core/constants/app_constants.dart';

typedef SocketCallback = void Function(dynamic data);

class SocketService {
  IO.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void connect(String userId) {
    _socket = IO.io(
      AppConstants.socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .disableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
      _socket!.emit('join', userId);
      print('Socket connected');
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      print('Socket disconnected');
    });

    _socket!.onError((error) {
      print('Socket error: $error');
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
  }

  void onNewMessage(SocketCallback callback) {
    _socket?.on('message:new', callback);
  }

  void onPostPublished(SocketCallback callback) {
    _socket?.on('post:published', callback);
  }

  void onNotification(SocketCallback callback) {
    _socket?.on('notification', callback);
  }

  void removeListener(String event) {
    _socket?.off(event);
  }

  void removeAllListeners() {
    _socket?.clearListeners();
  }
}
