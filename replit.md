# Astra Nova Currency Platform

## Overview

The Astra Nova Currency Platform is a school-based virtual currency system that enables students to manage "Astras" (⭐), connect with classmates, send money to friends, and invest in student-run companies. The platform combines social finance features inspired by Venmo with investment capabilities similar to Robinhood, all tailored for an educational environment.

The system features a comprehensive user management system with admin controls, transaction tracking, friend connections, and a company investment marketplace. It's designed to gamify financial literacy education while providing practical experience with digital payments and investment concepts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Technology Stack**: React with TypeScript, utilizing Vite for build tooling and development
**UI Framework**: Shadcn/ui components built on Radix UI primitives for accessibility and consistency
**Styling**: Tailwind CSS with a custom design system featuring space-themed colors (deep space blue primary, warm gold accent)
**State Management**: TanStack Query for server state management and caching
**Routing**: Wouter for lightweight client-side routing
**Authentication**: Context-based auth provider with session management

### Backend Architecture
**Runtime**: Node.js with Express.js framework
**Database ORM**: Drizzle ORM with PostgreSQL as the database engine
**Session Management**: Express sessions with PostgreSQL session store for persistence
**Authentication**: Passport.js with local strategy using scrypt for password hashing
**API Design**: RESTful endpoints with structured error handling and logging middleware

### Database Schema
**Users Table**: Stores user credentials, balance (Astras), admin/ban status
**Transactions Table**: Records all Astra transfers with type classification (send/receive/invest/earn/admin_adjust)
**Companies Table**: Investment marketplace with funding goals and current funding levels
**Friendships Table**: Social connections with status tracking (pending/accepted/blocked)

### Component Architecture
**Modular Design**: Reusable UI components following atomic design principles
**Protected Routes**: Authentication wrapper for secured pages
**Modal System**: Consistent dialog patterns for transactions and user actions
**Theme Support**: Light/dark mode with CSS custom properties
**Responsive Design**: Mobile-first approach with sidebar navigation that adapts to screen size

### Security & Authorization
**Role-based Access**: Admin users have elevated privileges for user management
**Session Security**: HTTP-only cookies with secure session configuration
**Password Security**: Scrypt-based hashing with salt for password storage
**API Protection**: Middleware validation and authentication checks on protected endpoints

### Development Workflow
**Type Safety**: Full TypeScript coverage across frontend and backend with shared schema types
**Code Generation**: Drizzle ORM generates types from database schema
**Hot Reload**: Vite development server with fast refresh capabilities
**Path Aliases**: Organized imports with @ prefix for cleaner code organization

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting via `@neondatabase/serverless`
- **Connection Pooling**: WebSocket-based connections for serverless compatibility

### UI & Design System
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide Icons**: Consistent iconography throughout the application
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens

### State & Data Management
- **TanStack Query**: Server state synchronization with optimistic updates
- **React Hook Form**: Form validation with Zod schema integration
- **Date-fns**: Date manipulation and formatting utilities

### Development & Build Tools
- **Vite**: Fast build tool with plugin ecosystem for React development
- **TypeScript**: Static typing for enhanced developer experience
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds

### Authentication & Security
- **Passport.js**: Modular authentication middleware
- **Express Session**: Session management with PostgreSQL persistence
- **Crypto**: Node.js built-in cryptographic functions for password hashing

The architecture prioritizes developer experience through TypeScript integration, modular component design, and clear separation of concerns between frontend and backend responsibilities.