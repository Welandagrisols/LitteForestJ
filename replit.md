# Overview

LittleForest is a comprehensive nursery management application built as a Progressive Web App (PWA) with mobile capabilities through Capacitor. The system manages plant inventory, sales, customers, tasks, and operations for nursery businesses. It features both web and mobile interfaces, offline functionality, and email notifications for business operations.

The application is designed to work in both production (with Supabase backend) and demo mode (with local mock data), making it accessible for testing and development without requiring immediate database setup.

## Recent Changes (September 28, 2025)
- ✅ **Fresh GitHub Import Setup**: Successfully imported and configured project in new Replit environment
- ✅ **Dependencies**: Installed all Node.js dependencies via npm install  
- ✅ **Supabase Integration**: Verified and tested Supabase connection with real credentials
- ✅ **Cross-Origin Configuration**: Confirmed allowedDevOrigins in next.config.js for Replit proxy compatibility
- ✅ **Deployment Configuration**: Set up autoscale deployment with build and start commands
- ✅ **Workflow Configuration**: Frontend server running on port 5000 with proper host binding (0.0.0.0)
- ✅ **Navigation Restructure**: Moved Impact Stories from standalone tab to Website Management > Impact Stories

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 14 with TypeScript and App Router
- **UI Components**: Radix UI primitives with shadcn/ui design system  
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React hooks and context providers for authentication and app state
- **Development**: Hot module replacement and fast refresh for rapid development

## Backend Architecture
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with email/password authentication
- **File Storage**: Supabase Storage for plant images with public access
- **Demo Mode**: Fallback to local mock data when database is unavailable

## Core Features
- **Inventory Management**: Track plants, consumables, and honey products with batch costing
- **Sales Tracking**: Record sales with customer information and automatic inventory updates
- **Customer Management**: Maintain customer database with contact information
- **Task Management**: Track nursery operations with consumable usage and labor costs
- **Financial Reporting**: Cost analysis, profit margins, and batch profitability
- **Website Integration**: Manage products visible on connected website

## Data Models
- **Inventory**: Plants with scientific names, categories, quantities, pricing, and batch costs
- **Sales**: Transaction records linked to inventory and customers
- **Customers**: Contact information and purchase history
- **Tasks**: Operations tracking with consumable usage and labor costs
- **Email Notifications**: Automated alerts for low stock and business events

## Mobile Features
- **PWA Capabilities**: Install to home screen, offline functionality, push notifications
- **Capacitor Integration**: Native mobile app compilation for app stores
- **Responsive Design**: Optimized layouts for mobile and tablet devices
- **Offline Sync**: Queue operations when offline and sync when connection restored

## Authentication & Security
- **Admin Authentication**: Single admin user with Supabase Auth
- **Demo Mode**: Bypass authentication when database unavailable
- **Row Level Security**: Supabase RLS policies for data protection

# External Dependencies

## Core Services
- **Supabase**: Primary backend service for database, authentication, and file storage
- **Vercel**: Deployment platform for web application hosting

## Mobile Development
- **Capacitor**: Cross-platform mobile app framework by Ionic
- **Android SDK**: Required for Android app compilation
- **iOS SDK**: Required for iOS app compilation (macOS only)

## UI & Styling
- **Radix UI**: Headless component library for accessible UI primitives
- **shadcn/ui**: Pre-built component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **TypeScript**: Type safety and enhanced developer experience
- **Next Themes**: Theme switching (light/dark mode)
- **React Hook Form**: Form validation and management
- **date-fns**: Date manipulation and formatting
- **XLSX**: Excel file export functionality

## Email & Notifications
- **Email Service**: Integration ready for automated notifications
- **Browser Notifications**: PWA push notifications for alerts

## Image Processing
- **File Upload**: Image upload to Supabase Storage
- **Image Optimization**: Next.js built-in image optimization