# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two people holding one conversation: a deaf or hard-of-hearing person who communicates by typing, and a hearing person who communicates by speaking. They meet in person (one phone, tablet or laptop between them) and, on a laptop, also in remote conversations and calls. Languages are mostly Indian (Hindi, Hinglish, Bengali, Tamil, Telugu, Kannada, Marathi, Gujarati, Urdu and more) plus English. Accounts are invite-only; one administrator manages who can sign in.

## Product Purpose
Duologue turns speech into live text for the person who cannot hear, and typed text into spoken audio for the person who can. Success is a conversation that flows without an interpreter or a notepad, in the language both people actually use.

## Positioning
Live speech-to-text and text-to-speech for two-way conversations, built for Indian languages and code-switching (Deepgram for streaming transcription, Sarvam AI for Indic transcription and voice).

## Operating Context
- Face-to-face: the device lies between two people, so one half of the screen is rotated 180 degrees for the person sitting opposite.
- Desktop/laptop: one shared transcript with both input controls, used side by side or in calls.
- Deployed on Cloudflare Pages; Deepgram and Sarvam API keys live server-side in Pages Functions and must never reach the browser.

## Capabilities and Constraints
- Speaker side: microphone toggle, live interim transcript, finalized messages.
- Typist side: text input, sent text is spoken aloud via Sarvam TTS (browser speech synthesis fallback).
- Language setting, chat clear, flip of which side is which.
- Login required. No public sign-up. Admin creates, disables, resets and deletes users. Users stored in Cloudflare D1.
- Proxy endpoints for Deepgram and Sarvam must require an authenticated session.

## Brand Commitments
Name: Duologue. Tagline is functional, stating what it is: live speech-to-text and text-to-speech for two-way conversations. Name is English/international, not Indic.

## Product Principles
1. Reading comes first: the transcript is the product, so legibility and text size beat decoration.
2. Each person sees only the controls for their role; the other person's side is never a mystery.
3. Works one-handed on a phone lying on a table and just as well at a desk with a keyboard; the two are different layouts, not one stretched.
4. Access is closed by default; the admin is the single door.

## Accessibility & Inclusion
Deaf and hard-of-hearing users read the screen as their primary channel: no information may rely on sound alone, state changes (listening, speaking, error) must be visible and textual, contrast at least WCAG AA, adjustable text size, touch targets at least 48px, respects reduced motion.
