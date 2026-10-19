# Songroom

A responsive songwriting companion for desktop and mobile browsers. Explore blues, jazz, country, folk, and rock progressions; transpose into all 12 keys; hear synthesized chords; view movable guitar shapes or piano chord tones; and save ideas and lyrics in browser storage.

## Run

Requires Python 3. No dependency installation or build step is needed.

```sh
cd /workspace/J
python3 -m http.server 3000 --bind 0.0.0.0
```

Open the served application in a browser. Playback requires a user click. Each bar is four beats. Guitar diagrams use standard tuning and movable E-shape voicings. Piano diagrams show pitch classes within one octave, rather than a prescribed hand position. Jazz progressions use a major-key context; blues intentionally uses dominant seventh chords beyond a single major scale.

Saved ideas and notes stay on the current browser/device, without accounts or cloud sync. Clearing browser data removes them. Automatic harmonization and songwriting feedback are future features.

Optional Google Fonts enhance typography; system fonts work without network access.

## Find a key for your voice

Use **Find your singing key** to capture a comfortable low and high note, or select them manually. Microphone access requires HTTPS (such as Netlify) or localhost and browser permission. Sing alone, without accompaniment; pitch estimates can be wrong, especially with breathy notes, background noise, or octave ambiguity. Check the detected notes and never force your range.

For song-specific recommendations, expand the melody section, select its current key, and enter the melody’s lowest/highest notes or sing the full melody (up to 45 seconds). The microphone estimates note range, not key. Stable pitches are used and the outer 2% of melody samples are trimmed to reduce glitches, so brief extremes may be missed. Review the estimates. Suggestions preserve the melody’s intervals and rank transpositions by room inside your range. Apply a suggested key to transpose the progression, then sing the melody in the suggested register. The tool does not generate or play the melody.

Without melody notes, suggestions explicitly assume a major melody from tonic to tonic over one octave. This is a starting point, not a determination of the best key. Vocal comfort also depends on where most notes sit, tone, and phrasing.

Audio is processed in the browser only; no recording is uploaded or stored. Stop ends microphone access; capture also stops automatically after 12 seconds for a note or 45 seconds for a melody, and when the page is hidden. Vocal ranges are not persisted.

Run pitch and transposition tests with `node --test tests/voice.test.cjs`.
