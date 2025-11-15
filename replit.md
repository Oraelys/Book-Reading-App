# Book Reader App

A digital book reader and library management application built with Expo and React Native.

## Overview
This is an Expo-based React Native application that allows users to:
- Register and authenticate with Supabase
- Upload and manage PDF/EPUB books
- Read books with progress tracking
- View their library and recently opened books

## Tech Stack
- **Framework**: Expo (React Native for Web)
- **Navigation**: Expo Router
- **Backend**: Supabase (Authentication & Database)
- **Language**: TypeScript

## Project Structure
- `app/` - Application screens and routing
  - `(tabs)/` - Tab-based navigation screens (Home, Library, Add Book)
  - `login.tsx` - Login screen
  - `register.tsx` - Registration screen
  - `reader.tsx` - Book reading interface
  - `_layout.tsx` - Root layout with auth flow
- `contexts/` - React contexts (AuthContext)
- `lib/` - Utilities and Supabase client
- `types/` - TypeScript type definitions
- `supabase/migrations/` - Database schema migrations

## Database Schema
The app uses two main tables in Supabase:
1. **books** - Stores book metadata (title, author, file_uri, cover_image, etc.)
2. **reading_progress** - Tracks user's reading progress per book

## Environment Variables
Required Supabase credentials:
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Development
The app runs on port 5000 using Expo's Metro bundler in web mode.

## Recent Changes
- [2024-11-15] Initial import and Replit configuration setup
- Configured Metro to run on port 5000 for Replit environment
- Set up workflow for web development
