# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SportDogLog is a static website for promoting the SportDogLog iOS app. The site serves as a landing page with download links and legal documentation.

## Architecture

This is a simple static HTML website consisting of:

- **index.html**: Main landing page with app promotion and download link
- **privacy.html**: Privacy policy page detailing Clerk authentication and Supabase data storage
- **terms.html**: Terms of use page with legal agreements
- **logo-sportdoglog.png**: App logo asset
- **CNAME**: GitHub Pages custom domain configuration for sportdoglog.com

## Development Notes

### Deployment
- Site is hosted on GitHub Pages with custom domain sportdoglog.com
- Static files are served directly from the main branch
- No build process required - changes to HTML files are immediately live

### Content Management
- All styling is inline CSS within HTML files for simplicity
- No external dependencies or frameworks
- Mobile-responsive design using viewport meta tags

### Legal Pages
- Privacy policy references third-party services: Clerk (authentication) and Supabase (data storage)
- Terms of use include arbitration clauses and Minnesota jurisdiction
- Both documents dated August 22, 2025

### App Integration
- Main download link points to Apple App Store
- App focuses on tracking dog performance, bird sightings, and hunting data
- Target platform is Apple Watch ("from your wrist")

## Making Changes

Since this is a static site, simply edit HTML files directly. No build commands or testing frameworks are present. Changes are deployed automatically via GitHub Pages when pushed to main branch.