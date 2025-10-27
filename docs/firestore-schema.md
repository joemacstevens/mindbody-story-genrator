# Firestore User Data Model

This document captures the target shape for persisting per-user data in Firestore. It reflects the structure we will migrate to from the current combination of Realtime Database and browser storage.

```
users/{uid}
├─ profile: {
│    email: string
│    displayName?: string
│    photoURL?: string
│    createdAt: Timestamp
│    updatedAt: Timestamp
│    lastActiveAt: Timestamp
│  }
├─ activeTemplateId: string
├─ lastScheduleSlug?: string
├─ preferences: {
│    defaultPaletteId?: string
│    defaultTimezone?: string
│    shareHintsDismissed?: boolean
│  }
└─ storage: {
     logoPath?: string      // firebase storage path
     backgroundPath?: string
   }

users/{uid}/templates/{templateId}
├─ style: Style             // full Style object
├─ updatedAt: Timestamp

users/{uid}/gyms/{slug}
├─ name: string
├─ city: string
├─ state: string
├─ country: string
├─ bookmarkedAt: Timestamp
├─ lastFetchedScheduleAt?: Timestamp

users/{uid}/schedules/{slug}
├─ schedule: Schedule       // last saved schedule payload
├─ updatedAt: Timestamp
├─ lastRequestedDate: string   // ISO date requested from Mindbody
├─ mindbodyMeta?: {
│    locationSlug?: string
│    radius?: number
│    timezone?: string
│  }

users/{uid}/schedules/{slug}/history/{yyyymmdd}
├─ schedule: Schedule       // optional historical snapshot per date
├─ fetchedAt: Timestamp
```

## Notes

- The root `users/{uid}` document acts as a quick lookup for profile info and global preferences.
- Template overrides move from Realtime Database (`settings.configs`) into `users/{uid}/templates`. We continue to merge with `DEFAULT_APP_SETTINGS` on the client.
- Gym bookmarks track the gym meta we already cache locally (`GymLocation` type).
- `schedules` stores the most recent schedule per slug; the optional `history` subcollection keeps per-date records if we decide to support viewing past pulls.
- Storage references hold Firebase Storage paths for the latest uploaded logo/background; we continue to request download URLs at runtime.
- Server timestamps should be written with `FieldValue.serverTimestamp()` so we can audit updates without trusting the client clock.
- Security rules will restrict reads/writes under `users/{uid}` to requests where `request.auth.uid == uid`.
- Legacy Realtime Database and local/session storage caches have been removed from runtime paths; Firestore is now the single source of truth.
- During migration we’ll read from session/local storage once, then seed the Firestore documents the first time a user signs in.

## Security & Testing

- Configure `firestore.rules` with:
  ```
  match /users/{uid}/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  ```
  Expand with finer-grained rules for storage metadata if needed.
- Enable the Firebase Emulator Suite (`firebase emulators:start --only auth,firestore,storage`) to exercise the full sign-in + persistence flow locally without touching production.
- Seed emulator data with representative schedules/templates to validate merge logic and rule coverage.

## Migration Outline

1. Ship the code that writes to Firestore while still reading legacy caches (this change).
2. The auth provider now executes a one-time bootstrap (`runUserDataMigration`) after the first successful sign-in for a given `uid`. The migration currently:
   - copies legacy Realtime Database settings/schedules into `users/{uid}`;
   - lifts saved gyms from browser storage into `users/{uid}/gyms`;
   - stamps the user document with `migrations.userDataV1 = true` to avoid re-running.
3. For future migrations, add new keys (e.g. `userDataV2`) and extend the helper with the additional steps.
4. Once confirmed, remove the Realtime Database dependency paths and trim the legacy storage helpers.
