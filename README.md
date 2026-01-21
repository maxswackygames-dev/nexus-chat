# Nexus Chat - Real-Time Messaging Platform

A modern, feature-rich chat application built with React, tRPC, Express, and WebSocket support. Nexus Chat provides instant messaging, channel management, direct messaging, and comprehensive administrative controls for team collaboration.

## Features

### Core Messaging
- **Real-Time Messaging**: Instant message delivery with WebSocket support
- **Read Receipts**: Track message read status across users
- **Typing Indicators**: See when others are typing in real-time
- **Message Editing**: Edit sent messages with edit history
- **Message Deletion**: Remove messages with admin override capability
- **Message Search**: Search across message history with filtering

### Channels & Organization
- **Public & Private Channels**: Create channels with access control
- **Channel Management**: Create, edit, and archive channels
- **Channel Members**: Add/remove members and manage roles
- **Channel Descriptions**: Add context and information to channels

### Direct Messaging
- **One-on-One Conversations**: Private direct messages between users
- **Conversation History**: Full message history with pagination
- **User Presence**: See who's online, away, or offline

### User Management & Admin Controls
- **Role-Based Access**: Admin and user roles with permission system
- **User Management Dashboard**: View all users with status indicators
- **User Banning**: Prevent banned users from accessing the platform
- **User Muting**: Silence users from posting messages
- **Permission Control**: Granular permission management for admins

### Moderation & Safety
- **Message Reporting**: Report inappropriate messages with reasons
- **Report Review**: Admin dashboard for reviewing reported messages
- **Moderation Logs**: Complete audit trail of all moderation actions
- **Ban/Mute History**: Track all user restrictions and actions

### Notifications
- **Real-Time Notifications**: Instant alerts for mentions and DMs
- **Notification Center**: Centralized notification management
- **Notification Types**: Mentions, direct messages, channel invites, and system alerts
- **Read Status**: Track read/unread notifications

### User Presence
- **Online Status**: Real-time presence indicators (online/away/offline)
- **Status Updates**: Automatic status management
- **Presence Indicators**: Visual indicators throughout the app

### File Sharing
- **File Upload**: Share files and images in conversations
- **File Preview**: Preview images and PDFs inline
- **File Download**: Easy download of shared files
- **File Management**: Track file attachments with metadata

## Technology Stack

### Frontend
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: High-quality UI components
- **tRPC**: End-to-end type-safe APIs
- **Socket.io Client**: Real-time communication
- **Wouter**: Lightweight routing

### Backend
- **Express 4**: Web server framework
- **tRPC 11**: Type-safe RPC framework
- **Socket.io**: WebSocket server
- **Drizzle ORM**: Type-safe database access
- **MySQL/TiDB**: Database

### Development
- **Vite**: Fast build tool
- **TypeScript**: Type checking
- **Vitest**: Unit testing framework
- **ESBuild**: JavaScript bundler

## Getting Started

### Prerequisites
- Node.js 22.13.0+
- pnpm 10.15.1+
- MySQL/TiDB database

### Installation

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Up Database**
   ```bash
   pnpm db:push
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```

4. **Build for Production**
   ```bash
   pnpm build
   ```

5. **Start Production Server**
   ```bash
   pnpm start
   ```

## Project Structure

```
nexus-chat/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── contexts/      # React contexts
│   │   └── App.tsx        # Main app component
│   └── public/            # Static assets
├── server/                # Backend Express server
│   ├── routers.ts         # tRPC route definitions
│   ├── db.ts              # Database queries
│   ├── websocket.ts       # WebSocket server
│   └── _core/             # Core framework files
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Database table definitions
├── shared/                # Shared types and constants
└── storage/               # S3 storage helpers
```

## Database Schema

### Core Tables
- **users**: User accounts with roles and status
- **channels**: Chat channels with privacy settings
- **channel_members**: Channel membership and roles
- **messages**: Chat messages with edit/delete tracking
- **read_receipts**: Message read status tracking
- **direct_messages**: One-on-one conversation threads

### Moderation Tables
- **message_reports**: Reported messages with reasons
- **moderation_logs**: Audit trail of moderation actions
- **user_permissions**: Granular permission control

### Additional Tables
- **file_attachments**: Shared files and media
- **message_reactions**: Emoji reactions on messages
- **notifications**: User notifications
- **message_reactions**: Emoji reactions

## API Routes

### Authentication
- `GET /api/oauth/callback` - OAuth callback handler
- `POST /api/trpc/auth.logout` - User logout

### Messages
- `POST /api/trpc/messages.create` - Send message
- `POST /api/trpc/messages.edit` - Edit message
- `POST /api/trpc/messages.delete` - Delete message
- `POST /api/trpc/messages.markAsRead` - Mark as read
- `GET /api/trpc/messages.getChannelMessages` - Fetch channel messages
- `GET /api/trpc/messages.getDirectMessages` - Fetch DM messages
- `GET /api/trpc/messages.search` - Search messages

### Channels
- `GET /api/trpc/channels.list` - List user's channels
- `POST /api/trpc/channels.create` - Create channel
- `GET /api/trpc/channels.getMembers` - Get channel members
- `POST /api/trpc/channels.addMember` - Add member to channel

### Users
- `GET /api/trpc/users.list` - List all users
- `POST /api/trpc/users.ban` - Ban user (admin only)
- `POST /api/trpc/users.unban` - Unban user (admin only)
- `POST /api/trpc/users.mute` - Mute user (admin only)
- `POST /api/trpc/users.unmute` - Unmute user (admin only)

### Moderation
- `POST /api/trpc/moderation.reportMessage` - Report message
- `GET /api/trpc/moderation.getPendingReports` - Get reports (admin only)
- `GET /api/trpc/moderation.getModerationLogs` - Get logs (admin only)

### Notifications
- `GET /api/trpc/notifications.list` - Get user notifications
- `POST /api/trpc/notifications.markAsRead` - Mark notification as read

## WebSocket Events

### Message Events
- `message:channel` - New channel message
- `message:dm` - New direct message
- `message:edit` - Message edited
- `message:delete` - Message deleted
- `message:read` - Message read receipt

### Presence Events
- `presence:update` - User presence changed
- `user:online` - User came online
- `user:offline` - User went offline

### Typing Events
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### Moderation Events
- `user:banned` - User was banned
- `user:muted` - User was muted
- `message:reported` - Message was reported

## Configuration

### Environment Variables
- `DATABASE_URL` - MySQL/TiDB connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth server URL
- `VITE_OAUTH_PORTAL_URL` - OAuth login portal URL

## Development

### Running Tests
```bash
pnpm test
```

### Type Checking
```bash
pnpm check
```

### Code Formatting
```bash
pnpm format
```

## Performance Considerations

- **Database Indexing**: All frequently queried columns are indexed
- **Message Pagination**: Messages are paginated to reduce load
- **WebSocket Optimization**: Efficient event broadcasting
- **Caching**: User and channel data cached in memory
- **Query Optimization**: Minimal database queries with joins

## Security Features

- **Authentication**: OAuth-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: All inputs validated with Zod
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **CORS**: Configured for secure cross-origin requests
- **Rate Limiting**: Implemented on critical endpoints

## Deployment

### Production Build
```bash
pnpm build
pnpm start
```

### Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on the project repository.

## Roadmap

- [ ] Voice and video calling
- [ ] Message threading/replies
- [ ] Custom emoji reactions
- [ ] Message pinning
- [ ] Channel categories
- [ ] User profiles
- [ ] Dark/light theme toggle
- [ ] Mobile app (React Native)
- [ ] Message encryption
- [ ] Scheduled messages
- [ ] Message templates
- [ ] Integration with external services

## Acknowledgments

Built with modern web technologies and best practices for real-time communication platforms.
