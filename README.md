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

## Song sections and longer forms

Use **Song Part** to browse loops, full forms, verses, pre-choruses, choruses, or bridges. Each genre has two eight-bar verses, two four-bar pre-choruses, two eight-bar choruses, and two eight-bar bridges. These are songwriting prompts; a chorus does not require a particular chord progression, and melody, rhythm, and dynamics determine its role in your song.

Blues forms include 8, 12, quick-change 12, 16, and stretched 24 bars. The 16-bar option is one variation: I7 for four bars, IV7 for four, I7 for four, then one bar each of V7, IV7, I7, V7. Other genres include a 16-bar verse/chorus pair and a 32-bar form; Jazz uses AABA, with eight bars per section. In non-major scales, forms use diatonic modal adaptations and are labeled accordingly rather than promising traditional blues harmony.

Progression options display total bars, and cards show the bar positions and duration of each chord. All bars currently use 4/4. Playback strikes the chord once per bar so extended changes remain audible. Transposition, guitar/piano views, and idea saving work with these longer sections. Existing saved progression indices are preserved; opening a saved idea resets the song-part filter to All so the saved progression is visible.

## Playback sounds

The **Playback Sound** menu offers acoustic-style pluck, clean electric-style, piano-style, electric piano-style, warm organ, and soft pad, plus a volume slider. These are lightweight synthesized approximations, not sampled instruments or amp models. The guitar/piano tabs still select the diagram independently. Saved ideas retain the sound and volume; older ideas default to the acoustic-style sound. Starting a mix preview stops chord playback; starting chords or vocal capture pauses mix previews.

## Stereo mix helper

In Ableton, use **File → Export Audio/Video** to export the Master/Main output for the desired song range as WAV or AIFF. A MIDI clip and `.als` project have no rendered audio for this tool. Upload a mono/stereo bounce under **A fresh pair of ears for your mix**. WAV is recommended if the browser cannot decode AIFF or another format. Limits: 60 MB, five minutes, and 32 million decoded samples. Files are analyzed and rendered locally, without an AI service, network upload, or persistence.

The helper measures sample peak, unweighted RMS, near-full-scale sample counts, channel levels, DC offset, and overall stereo correlation. Rough frequency-band estimates inform conditional listening suggestions. These are measurements and heuristics, not an assessment that a mix is good or bad. RMS is not LUFS; sample peak is not inter-sample true peak. Near-full-scale samples do not prove clipping. The helper does not separate stems, rebalance individual instruments, fix previously clipped audio, recognize genre, or automatically choose artistic mix decisions.

Adjust bass (180 Hz shelf), mid (1 kHz, Q 0.7), treble (4 kHz shelf), and output trim. Optional processing includes a 30 Hz high-pass and gentle compression (−18 dB threshold, 12 dB knee, 2:1 ratio, 15 ms attack, 200 ms release). Defaults leave these changes neutral/off. Output sample-peak normalization to −1 dBFS is enabled by default; it scales the entire rendered file and can make it louder or quieter. It is not a true-peak limiter or streaming loudness target. Disable it to use output trim alone. Above-full-scale outputs are withheld rather than silently clipped.

Click **Render changes**, audition Original and Processed at similar perceived volume and corresponding positions, and download the processed 24-bit PCM WAV if you prefer it. The two previews pause each other. A/B is manually controlled, not automatically loudness-matched. Browser decoding can resample the source to the audio context's sample rate, which is shown in the analysis and used for the output. The decoded duration and channel count are retained; source file metadata and the Ableton project are not rewritten. Changing settings or files removes stale output. Reset restores neutral controls and the default −1 dBFS sample-peak normalization. Your original file is not overwritten.

Audio tests exercise meter accuracy, stereo correlation, normalization, signed 24-bit PCM interleaving, and synthesized sounds. Browser checks exercise real offline EQ/compression, measured bass attenuation, audio upload, A/B playback, clipping safeguards, WAV download, saved sounds, invalid files, and mobile layout using synthetic audio. Audition the results on your own music before treating a processed mix as an improvement.

## Stem mixer: balance separate parts

In Ableton, select the song range and use **File → Export Audio/Video**, choosing the appropriate individual audio tracks. Export vocals, drums, bass, guitars, keys, and other groups as separate WAV/AIFF stems **from the same start point**, keeping leading silence. Include each signal once; avoid summing a group export alongside its child tracks or adding a full master bounce as another instrument. Decide whether shared return effects should be included or exported separately so they are not counted twice. The website uses rendered audio, not the Live project, plugins, or MIDI instruments.

Under **Give every part its place**, select 2–8 stems together. Limits are 160 MB combined, five minutes per stem, and 64 million decoded samples total. Smaller/shorter sets suit mobile devices. Mono/stereo inputs are decoded by one browser audio context to a common sample rate. Each starts at zero; shorter stems finish early and the combined mix lasts as long as the longest stem. Unequal lengths are flagged, but equal lengths do not prove musical alignment. There is no automatic synchronization, time-stretching, stem separation, or reconstruction of Ableton's master bus.

Play the stems together and adjust each level (−60 to +6 dB), stereo pan, mute, and solo in real time. Pan uses Web Audio's stereo panner: mono tracks use equal-power panning, while stereo tracks use its stereo panning law. A muted solo track does not silence every other track unless another unmuted track is soloed. The seek control restarts all audible sources from the same position; Stop returns to zero. Switching to **Original balance** bypasses those edits for auditioning without deleting them. Original means the uploaded files at unity gain and centered; it may differ from the original session's master output. The preview has conservative fixed attenuation based on source count and peaks, plus a listening-volume control. It does not represent final export loudness and is not automatically loudness-matched for A/B.

Per-stem suggestions flag relative average-level outliers and offer small gain changes. These are RMS-based listening prompts, not AI or a rule that instruments should have equal average levels. There is no automatic instrument-role identification, per-stem EQ/compression, reference-song matching, or automatic artistic mixing in this version.

**Export your balance** renders a stereo 24-bit PCM WAV from the edited levels, pans, mute, and solo states. Preview volume and Original/Your comparison choice do not affect the export. Sample-peak normalization to −1 dBFS is enabled by default; it applies a single gain to the combined output, not per-stem normalization. Without it, outputs exceeding full scale are withheld. This is sample-peak protection, not true-peak limiting or LUFS targeting. The longest input duration is retained and shorter parts are zero-padded. You can load the combined WAV into the existing stereo mix helper for overall EQ/compression. Reset restores unity levels, centered pans, and clears mute/solo. File/setting changes clear stale downloads. No files or balances are saved across page reloads.

Tests cover gain conversion, mute/solo logic, original comparison, and level-outlier prompts. Chromium checks upload/decode, live playback/seek, original comparison, exported channel levels/panning, solo isolation, duration warnings, stale-output cleanup, invalid selection, playback coordination, and mobile layout with synthetic files. Real musical decisions and source alignment still need listening.
