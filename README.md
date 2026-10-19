# Songroom

A responsive songwriting companion for desktop and mobile browsers. Explore blues, jazz, country, folk, and rock progressions; transpose into all 12 keys; hear synthesized chords; view movable guitar shapes or piano chord tones; and save ideas and lyrics in browser storage.

## Run

Requires Python 3. No dependency installation or build step is needed.

```sh
cd /workspace/J
python3 -m http.server 3000 --bind 0.0.0.0
```

Open the served application in a browser. Playback requires a user click. Each bar is four beats. Guitar diagrams use standard tuning and movable E-shape voicings. Piano diagrams show pitch classes within one octave, rather than a prescribed hand position. Jazz progressions use a major-key context; blues intentionally uses dominant seventh chords beyond a single major scale.

Saved ideas and notes stay on the current browser/device, without accounts or cloud sync. Clearing browser data removes them. Voice recording, melody analysis, automatic harmonization, and songwriting feedback are future features, not implemented in this version.

Optional Google Fonts enhance typography; system fonts work without network access.
