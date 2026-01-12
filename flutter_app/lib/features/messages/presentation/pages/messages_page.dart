import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:iconsax/iconsax.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../services/injection.dart';
import '../bloc/messages_bloc.dart';

class MessagesPage extends StatelessWidget {
  const MessagesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<MessagesBloc>()..add(LoadConversations()),
      child: const _MessagesView(),
    );
  }
}

class _MessagesView extends StatelessWidget {
  const _MessagesView();

  @override
  Widget build(BuildContext context) {
    final isWideScreen = MediaQuery.of(context).size.width > 800;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(Iconsax.refresh),
            onPressed: () {
              context.read<MessagesBloc>().add(RefreshConversations());
            },
          ),
        ],
      ),
      body: BlocConsumer<MessagesBloc, MessagesState>(
        listener: (context, state) {
          if (state.error != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.error!),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state.isLoading && state.conversations.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.conversations.isEmpty) {
            return _buildEmptyState(context);
          }

          if (isWideScreen) {
            return Row(
              children: [
                SizedBox(
                  width: 350,
                  child: _ConversationsList(
                    conversations: state.conversations,
                    selectedId: state.selectedConversationId,
                  ),
                ),
                VerticalDivider(width: 1, color: AppColors.grey200),
                Expanded(
                  child: state.selectedConversationId != null
                      ? _ChatView(
                          conversationId: state.selectedConversationId!,
                          messages: state.messages,
                          isSending: state.isSending,
                        )
                      : _buildSelectConversation(context),
                ),
              ],
            );
          }

          return _ConversationsList(
            conversations: state.conversations,
            selectedId: state.selectedConversationId,
            onTap: (conversation) {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: context.read<MessagesBloc>(),
                    child: _ChatPage(conversation: conversation),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Iconsax.message,
            size: 64,
            color: AppColors.grey300,
          ),
          const SizedBox(height: 16),
          Text(
            'No messages yet',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Messages from your connected accounts will appear here',
            style: TextStyle(color: AppColors.grey500),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSelectConversation(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Iconsax.message_text,
            size: 64,
            color: AppColors.grey300,
          ),
          const SizedBox(height: 16),
          Text(
            'Select a conversation',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Choose a conversation from the list to view messages',
            style: TextStyle(color: AppColors.grey500),
          ),
        ],
      ),
    );
  }
}

class _ConversationsList extends StatelessWidget {
  final List<Map<String, dynamic>> conversations;
  final String? selectedId;
  final Function(Map<String, dynamic>)? onTap;

  const _ConversationsList({
    required this.conversations,
    this.selectedId,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: conversations.length,
      separatorBuilder: (_, __) => Divider(height: 1, color: AppColors.grey100),
      itemBuilder: (context, index) {
        final conversation = conversations[index];
        final isSelected = selectedId == conversation['id'];

        return _ConversationTile(
          conversation: conversation,
          isSelected: isSelected,
          onTap: () {
            if (onTap != null) {
              onTap!(conversation);
            } else {
              context.read<MessagesBloc>().add(
                    LoadMessages(conversation['id']),
                  );
            }
          },
        );
      },
    );
  }
}

class _ConversationTile extends StatelessWidget {
  final Map<String, dynamic> conversation;
  final bool isSelected;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.conversation,
    required this.isSelected,
    required this.onTap,
  });

  Color _getPlatformColor(String platform) {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return AppColors.instagram;
      case 'twitter':
        return AppColors.twitter;
      case 'linkedin':
        return AppColors.linkedin;
      case 'whatsapp':
        return AppColors.whatsapp;
      case 'telegram':
        return AppColors.telegram;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final platform = conversation['platform'] ?? 'unknown';
    final participantName =
        conversation['participantName'] ?? conversation['participant'] ?? 'Unknown';
    final lastMessage = conversation['lastMessage'] ?? '';
    final unreadCount = conversation['unreadCount'] ?? 0;
    final updatedAt = conversation['updatedAt'];

    String timeString = '';
    if (updatedAt != null) {
      final date = DateTime.parse(updatedAt);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inDays == 0) {
        timeString = DateFormat('h:mm a').format(date);
      } else if (diff.inDays == 1) {
        timeString = 'Yesterday';
      } else if (diff.inDays < 7) {
        timeString = DateFormat('EEEE').format(date);
      } else {
        timeString = DateFormat('MMM d').format(date);
      }
    }

    return ListTile(
      onTap: onTap,
      selected: isSelected,
      selectedTileColor: AppColors.primary.withOpacity(0.05),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: _getPlatformColor(platform).withOpacity(0.1),
            child: Text(
              participantName[0].toUpperCase(),
              style: TextStyle(
                color: _getPlatformColor(platform),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: _getPlatformColor(platform),
                shape: BoxShape.circle,
                border: Border.all(
                  color: Theme.of(context).colorScheme.surface,
                  width: 2,
                ),
              ),
            ),
          ),
        ],
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              participantName,
              style: TextStyle(
                fontWeight:
                    unreadCount > 0 ? FontWeight.w600 : FontWeight.normal,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            timeString,
            style: TextStyle(
              fontSize: 12,
              color: unreadCount > 0 ? AppColors.primary : AppColors.grey400,
            ),
          ),
        ],
      ),
      subtitle: Row(
        children: [
          Expanded(
            child: Text(
              lastMessage,
              style: TextStyle(
                color: unreadCount > 0 ? AppColors.grey700 : AppColors.grey500,
                fontWeight:
                    unreadCount > 0 ? FontWeight.w500 : FontWeight.normal,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (unreadCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ChatPage extends StatelessWidget {
  final Map<String, dynamic> conversation;

  const _ChatPage({required this.conversation});

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<MessagesBloc>();
    bloc.add(LoadMessages(conversation['id']));
    bloc.add(MarkAsRead(conversation['id']));

    return Scaffold(
      appBar: AppBar(
        title: Text(conversation['participantName'] ?? 'Chat'),
      ),
      body: BlocBuilder<MessagesBloc, MessagesState>(
        builder: (context, state) {
          return _ChatView(
            conversationId: conversation['id'],
            messages: state.messages,
            isSending: state.isSending,
          );
        },
      ),
    );
  }
}

class _ChatView extends StatefulWidget {
  final String conversationId;
  final List<Map<String, dynamic>> messages;
  final bool isSending;

  const _ChatView({
    required this.conversationId,
    required this.messages,
    required this.isSending,
  });

  @override
  State<_ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends State<_ChatView> {
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            reverse: true,
            itemCount: widget.messages.length,
            itemBuilder: (context, index) {
              final message =
                  widget.messages[widget.messages.length - 1 - index];
              final isOutgoing = message['direction'] == 'outgoing';

              return _MessageBubble(
                message: message,
                isOutgoing: isOutgoing,
              );
            },
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            border: Border(top: BorderSide(color: AppColors.grey200)),
          ),
          child: SafeArea(
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 12),
                FloatingActionButton(
                  mini: true,
                  onPressed: widget.isSending ? null : _sendMessage,
                  child: widget.isSending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Iconsax.send_1),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    context.read<MessagesBloc>().add(
          SendMessage(widget.conversationId, _messageController.text.trim()),
        );
    _messageController.clear();
  }
}

class _MessageBubble extends StatelessWidget {
  final Map<String, dynamic> message;
  final bool isOutgoing;

  const _MessageBubble({
    required this.message,
    required this.isOutgoing,
  });

  @override
  Widget build(BuildContext context) {
    final content = message['content'] ?? '';
    final createdAt = message['createdAt'];

    String timeString = '';
    if (createdAt != null) {
      final date = DateTime.parse(createdAt);
      timeString = DateFormat('h:mm a').format(date);
    }

    return Align(
      alignment: isOutgoing ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 8,
          left: isOutgoing ? 64 : 0,
          right: isOutgoing ? 0 : 64,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isOutgoing ? AppColors.primary : AppColors.grey100,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isOutgoing ? 16 : 4),
            bottomRight: Radius.circular(isOutgoing ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              content,
              style: TextStyle(
                color: isOutgoing ? Colors.white : AppColors.grey800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              timeString,
              style: TextStyle(
                fontSize: 10,
                color: isOutgoing
                    ? Colors.white.withOpacity(0.7)
                    : AppColors.grey400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
