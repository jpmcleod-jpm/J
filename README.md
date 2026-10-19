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

## Ableton drum variations

1. In Ableton Live, select a single drum MIDI clip and use **Export MIDI Clip** (the clip context menu or File menu, depending on your Live version). Use a beat-based format 0/1 `.mid` file, a single note track/channel, and 4/4 meter. This prototype accepts up to 512 bars and 5 MB. It does not load `.als` projects or extract drums from audio.
2. In Songroom, upload the file under **Give your drums somewhere to go**. Confirm the original pitch numbers and map snare, hat, and tom pads to your Drum Rack. MIDI pitch numbers avoid differences in octave labels between applications. An empty or differently mapped pad will not produce the intended sound.
3. For song-guided placement, export an audio bounce of the arrangement (WAV or MP3 recommended, up to 60 MB / 10 minutes) and upload it as the reference. Set the actual constant song tempo and the clip's start time within the reference, in seconds. The reference must cover the whole clip. Variable-tempo alignment is not supported; bounce an appropriate constant-tempo region instead. Browser codec support varies; try WAV if another format fails.
4. Choose a fill frequency. With reference audio, the tool chooses the strongest energy change above its threshold in each interval; with MIDI alone, it uses regular intervals. A song reference with no detected changes produces no transition fills, rather than inventing section boundaries. Lively/adventurous variants can still add hat accents and ghost notes. This is groove-rule generation with energy analysis, **not a trained AI model** or harmonic/genre/section recognition. It is a first prototype for song-aware drum editing.
5. Create the subtle, lively, and adventurous variants and download MIDI. Drag a file onto a duplicate drum track in Ableton using the same Drum Rack, tempo, clip start, and loop length. Audition there with your actual sounds; Songroom does not render your Ableton instruments. Keep the original clip for comparison.

Original note timing, pitches, velocities, channels, and metadata are retained. Additional hits avoid overlapping original notes on the same pad; the final partial bar receives no additions. MIDI tempo and other tracks' metadata are preserved, not changed by the reference-alignment controls. The tool cannot verify what instrument each pad plays. Everything stays in the browser; reference audio and MIDI are not uploaded or persisted. Changing inputs clears stale downloads.

Run all existing automated tests with `node --test tests/*.test.cjs`. MIDI tests cover round trips, original-event preservation, collision avoidance, custom mappings, energy-transition alignment, corrupt input, and unsupported meter/multitrack clips. A Chromium smoke test also verified uploads, downloaded MIDI parsing, reference guidance, alignment errors, and the mobile layout using synthetic fixtures. Real Ableton import/playback still needs to be auditioned with your Drum Rack.

## Major, minor, and modes

Choose **Scale / Mode** beside the tonic/key. Options include all seven diatonic modes: major (Ionian), Dorian, Phrygian, Lydian, Mixolydian, natural minor (Aeolian), and Locrian. Harmonic minor and ascending/jazz melodic minor are also available. The melodic minor option keeps the same scale in both directions; it does not use the classical descending natural-minor form.

The scale display spells each degree with its diatonic letter and accidental. Click any of the seven scale-chord buttons to hear it and see its guitar or piano voicing; this previews the chord without changing the progression. Jazz uses seventh chords; other styles use triads in the scale palette. Non-major progression recipes follow the selected scale, including diminished, augmented, and altered seventh qualities where required. Genre selection gives a voicing approach, not an assertion that every mode is traditional in that genre. In particular, non-major Blues options are labeled diatonic modal explorations, not traditional blues forms. Original major-key recipes remain available, including the dominant-seventh blues and borrowed Mixolydian rock progression, with their out-of-scale harmony identified.

Saved ideas retain their mode; older ideas without a mode load as major. Vocal key suggestions preserve the selected mode when transposing. Without an entered melody, their tonic-to-tonic octave range remains only an assumption in any mode. Modes concern pitched harmony; unpitched drum-pad MIDI variations do not change with scale selection.
