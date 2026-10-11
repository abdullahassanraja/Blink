# Gemini Build Guide

Voice-first camera assistant for blind and low-vision users. Banana Hacks 2026.
Name: **Blink** (keep it in ONE config constant, `APP_NAME`).
Tagline: **One tap. One sentence.** Story: **small move, big impact.**

---

## 0. Agent operating rules (read first)

This file is your full brief. You are the lead engineer on Blink, a hackathon project. Follow this guide exactly.

Status: Sprint 0 (accounts, tester, banknotes, Urdu voice test) is done. Hackathon window: Oct 9-12, 2026. Wait for me to name a feature, then build only that one.

```
Rules:
1. Build ONE feature at a time, in the order of the guide. Start only the feature I name.
2. Before coding, read that feature's section and list what you need from me. Ask for it. Do not invent keys, files, or data.
3. Work in small steps. After each step, run the app or build and tell me how to check it on my phone.
4. Touch only the files named in the feature. Do not refactor other features.
5. When the feature's "Done when" list passes, stop, give me a short summary, and a commit message. Wait for my "next".
6. Keep all text strings in one place (src/config/strings.ts) so the app name and language can change later.
7. Never put the Gemini API key in browser code. Use the serverless proxy.
8. No em dashes in any user-facing text.
9. All code is written during the hackathon window (Oct 9-12, 2026). Commit after every working step.
```

---

## 1. Product rules (apply to every feature)

- Voice first. A blind user must never need the screen.
- Speak short: under 12 words per alert, under 25 words per description.
- Honest uncertainty: when unsure, say so and suggest one fix.
- Never spam: do not repeat the same thing within seconds unless it changed.
- Assistive aid only. It does not replace a cane or guide dog. For medicine: read the label, never give dosage advice, always say "Please confirm with a person."
- Privacy: images are not stored. Say in the README that photos are sent to Gemini for reading and describing. Check Google's current free-tier data terms and avoid sensitive documents in testing.

---

## 1b. Decisions already made (do not ask me again)

- App name: **Blink**. Tagline: **One tap. One sentence.**
- Visual style: light yellow and white, see section 3.
- Language: English first. Urdu is a stretch (Feature 7).
- Currency for Money: Pakistani rupee notes.
- Camera needs HTTPS. Test on a real phone through a Vercel preview URL, not only on desktop.
- Run the proxy locally with `vercel dev` so `/api/gemini` works during development.
- If something is not covered here, make the simplest choice, tell me in one line, and continue.

---

## 2. Stack

| Need | Tool |
|---|---|
| App | React + TypeScript + Vite, PWA (vite-plugin-pwa) |
| Fonts | `@fontsource/dm-sans` (bundled, works offline) |
| Camera | getUserMedia (rear camera) |
| Voice out / in | SpeechSynthesis / SpeechRecognition |
| Read and Describe | Gemini API (Flash model) through a serverless proxy |
| Offline reading | Tesseract.js (lazy loaded) |
| Obstacles | `@mediapipe/tasks-vision` ObjectDetector, EfficientDet-Lite0 |
| Money model | MobileNetV2 transfer learning in Colab, run in browser |
| Hosting | Vercel (static app + `/api` function) |

Model names change often. Keep the Gemini model ID in an env var `GEMINI_MODEL` and check Google AI Studio for the current Flash model and free-tier limits.

---

## 3. Design system (from the reference mockup)

Use ONLY the left screen (welcome with white bottom sheet) and the right screen (clean white list with timeline). Ignore the middle green screen. Copy the layout, spacing and palette. Do NOT copy the reference brand name, logo, or photos.

### Tokens (`src/ui/tokens.css`)

```css
:root {
  --yellow: #EDF17B;      /* page background, accents */
  --yellow-soft: #F6F8B8; /* pressed states, highlights */
  --ink: #14231E;         /* text, primary buttons */
  --white: #FFFFFF;       /* sheets, cards */
  --mist: #F5F6EE;        /* subtle surfaces */
  --line: #E3E5DA;        /* borders */
  --ok: #1E7A4C;
  --warn: #B3261E;

  --radius-sheet: 32px;
  --radius-card: 24px;
  --radius-pill: 999px;
  --tap-min: 64px;        /* minimum touch target */
  --font: "DM Sans", system-ui, sans-serif;
}
```

### Type
- Tagline: 28px, weight 600, centered, ink.
- Small caps label: 12px, weight 600, letter-spacing 0.08em, uppercase.
- Big word (like "Easy", "Medium" in the reference): 24px, weight 600.
- Body: 18px minimum. Never below 16px.

### Components
- **Sheet:** white, rounded top corners (32px), sits at the bottom over the hero, soft shadow.
- **Pill button, outlined:** white, 1.5px `--line` border, 64px high, full pill radius.
- **Primary button:** `--ink` background, `--yellow` text, 72px high, full width.
- **Circle button:** 48px, light border, used for close and settings.
- **Status pill card:** rounded, soft shadow, check icon plus label (like "Auto-adaptive" in the reference).
- **Caption card:** shows the last spoken sentence in large text, `aria-live="polite"`.
- **Timeline row:** small caps label, big word, circular icon on a thin vertical line (like the right reference screen).

### Screens
1. **Welcome (left reference).** Yellow page. Top 55%: hero (camera preview once allowed, otherwise a bold wordmark and a simple eye shape drawn in SVG). Bottom: white sheet with tagline, full-width primary "Start" button, two outlined pills side by side ("Voice on", "English"), small privacy text, underlined link "How it works".
2. **Main (camera).** Full-bleed camera on top. White bottom sheet: 2x2 grid of big mode pills (Read, Describe, Alert, Money), caption card above them, circle settings button top right.
3. **Modes list (right reference).** White screen, circle close button top left, centered title and one-line subtitle, vertical timeline of modes. Each row: small caps label ("READ"), big word ("Labels"), circular icon on the line, right side status ("Ready"). Bottom pill card: check icon plus "Works offline".

### Accessibility
- Every touch target at least 64px. Contrast at least 4.5:1 (ink on yellow and white passes).
- All buttons have `aria-label`. Captions use `aria-live`. Respect `prefers-reduced-motion`.
- Dark text only. No information by color alone.

---

## 4. Repo structure

```
/
  GEMINI_BUILD_GUIDE.md
  PLAN.md
  README.md
  .env.example            GEMINI_API_KEY, GEMINI_MODEL
  api/
    gemini.ts             serverless proxy (Vercel)
  public/
    models/               efficientdet_lite0.tflite, money model files
    mediapipe/wasm/       MediaPipe wasm files
  src/
    config/               app.ts (APP_NAME), strings.ts
    ui/                   tokens.css, Button, Sheet, Caption, StatusPill, TimelineRow
    screens/              Welcome, Main, Modes
    camera/               useCamera.ts, captureFrame.ts
    speech/               speak.ts, listen.ts, alertManager.ts
    modes/                readText/, describe/, obstacle/, money/
    core/                 confidence.ts, cache.ts, metrics.ts, offline.ts
  ml/                     colab notebook, dataset notes, results
  docs/                   results.md, user-test.md, notes.md
```

---

# FEATURES (build in this order)

---

## Feature 0: Scaffold

**Goal:** an empty app that builds, installs as a PWA, and applies the design tokens.

**Status: DONE**

**Steps**
1. Create the project: Vite, React, TypeScript. Add `vite-plugin-pwa` with manifest (name from `APP_NAME`, theme color `--yellow`, standalone display, icons placeholder).
2. Install `@fontsource/dm-sans` (weights 400, 500, 600) and import it in `main.tsx`.
3. Add `src/ui/tokens.css` from section 3 and a global reset (box-sizing, 100dvh body, no tap highlight).
4. Create `src/config/app.ts` (`export const APP_NAME = "Blink"`) and `src/config/strings.ts` (all spoken and visible strings, English first, structure ready for Urdu).
5. Add `.env.example` and `.gitignore` (`.env`, `node_modules`).
6. Add a README stub and the folder structure above (empty folders with `.gitkeep`).

**Done when**
- `npm run dev` and `npm run build` pass.
- Page shows a yellow background with ink text in DM Sans.
- Commit: `chore: scaffold app, tokens, pwa`.

---

## Feature 1: UI shell, camera, speech (Sprint 1)

**Goal:** open the app, hear a greeting, see the camera, tap a button, hear it speak.

**Ask me for:** the reference mockup image (use only its left and right screens), whether I have my own hero photo (otherwise draw an SVG eye that blinks once on load, no motion if `prefers-reduced-motion` is set), phone type (Android or iPhone). The tagline is fixed: "One tap. One sentence."

**Files:** `src/ui/*`, `src/screens/Welcome.tsx`, `src/screens/Main.tsx`, `src/camera/useCamera.ts`, `src/speech/speak.ts`, `src/App.tsx`.

**Steps**
1. Build components: `Button` (variants: primary, pill, circle), `Sheet`, `Caption`, `StatusPill`, `ModeTile`. Match section 3.
2. `speak.ts`:
   - `speak(text, { interrupt?: boolean, lang?: string, rate?: number })`.
   - Queue utterances. `interrupt: true` cancels the current one.
   - `stopSpeaking()`.
   - Wait for `voiceschanged` before choosing a voice. Pick a voice matching `lang`, fall back to default.
   - Unlock speech on the first user tap (needed on iPhone).
3. `useCamera.ts`: request `facingMode: { ideal: "environment" }`, expose `videoRef`, `status` (idle, ready, denied, error), `start()`, `stop()`. Stop all tracks on unmount. On denied, speak and show a plain message.
4. `Welcome.tsx`: layout from section 3, screen 1. "Start" unlocks speech, starts the camera, speaks a greeting, goes to Main.
5. `Main.tsx`: full-bleed `<video playsInline muted autoPlay>`, bottom sheet with the 2x2 mode grid. Each tile for now just speaks its mode name and shows it in the caption card.
6. `Caption`: large text, `aria-live="polite"`, updates on every `speak()` call.
7. Simple screen state in `App.tsx` (welcome, main, modes). No router library.

**Done when**
- On a real phone over HTTPS (Vercel preview or tunnel), Start asks for camera, shows it, and speaks.
- Tapping each tile speaks and updates the caption.
- Camera denied case speaks a clear message.
- Commit: `feat: ui shell, camera, speech`.

---

## Feature 2: Read Text (medicine names, labels, signs)

**Goal:** point at a package, tap Read, hear the name and key text.

**Ask me for:** Gemini API key (I will add it to Vercel env and local `.env`), 5 real packages for testing.

**Files:** `api/gemini.ts`, `src/camera/captureFrame.ts`, `src/modes/readText/*`, `src/core/cache.ts`, `src/core/offline.ts`, `src/core/metrics.ts`.

**Steps**
1. **Proxy `api/gemini.ts`:**
   - POST body: `{ image: base64Jpeg, task: "read" | "describe", lang: "en" | "ur" }`.
   - Reads `GEMINI_API_KEY` and `GEMINI_MODEL` from env. Calls the Gemini `generateContent` REST endpoint with the image and a task prompt, `responseMimeType: "application/json"` and a response schema.
   - Rejects images over about 1.5 MB. Simple in-memory rate limit per IP. Never logs or stores images. Returns clean JSON or `{ error }`.
2. **`captureFrame.ts`:** draw the current video frame to a canvas, scale so the longest side is 1024px, export JPEG quality 0.7, return base64 (no data URL prefix).
3. **Read prompt** (inside the proxy):
   ```
   You help a blind person. Read the main text in this image aloud-ready.
   If it is a medicine package: say the medicine name first, then strength, then
   directions only if clearly visible. Never advise dosage.
   If the text is not readable, set legible=false.
   Return JSON: {"text": string, "type": "medicine"|"sign"|"menu"|"other", "legible": boolean}
   Keep text under 40 words. Plain spoken sentences.
   ```
4. **`readText/index.ts`:** capture, call proxy, check `legible`. If false, speak "I could not read that. Hold it closer, flat, and in light." If type is medicine, append "Please confirm with a person before taking it."
5. **Fallback:** if offline or the call fails or rate limit hits, lazy load Tesseract.js, run OCR on the same frame, speak the result with the prefix "Offline. Basic reading." Tell the user what failed in plain words.
6. **Cache:** hash a 16x16 grayscale version of the frame, reuse the result for 60 seconds. Saves free-tier quota.
7. **Metrics:** log time from tap to first spoken word into `metrics.ts` (used later in the write-up).
8. Wire the Read tile in `Main.tsx`. Show a "Reading..." caption and play a short tone so the user knows it is working.

**Done when**
- 5 real packages read correctly, medicine names come first.
- Airplane mode triggers the Tesseract fallback with a spoken explanation.
- Unreadable image triggers the "hold closer" message.
- Latency numbers appear in the console.
- Commit: `feat: read text with gemini and ocr fallback`.

---

## Feature 3: Describe Scene

**Goal:** tap Describe, hear one or two plain sentences about what is in front of the user.

**Ask me for:** nothing new (reuses the key). Ask for 5 rooms or scenes to test.

**Files:** `src/modes/describe/*`, small prompt addition in `api/gemini.ts`.

**Steps**
1. Add the `describe` task prompt in the proxy:
   ```
   You help a blind person. Describe the scene in at most 2 short sentences,
   under 25 words total. Mention people and hazards first, then the main objects,
   left to right. Do not guess. If unclear, say so.
   Return JSON: {"text": string, "confident": boolean}
   ```
2. `describe/index.ts`: reuse `captureFrame`, cache, offline check. If `confident` is false, prefix "I am not sure, but".
3. Offline: speak "Scene description needs internet. Try Read or Alert." (Alert works offline, see Feature 4.)
4. Cooldown of 3 seconds between calls.
5. Log latency to `metrics.ts`.

**Done when**
- 5 varied scenes described sensibly, usually in under 4 seconds.
- Offline message works. Cooldown works.
- Commit: `feat: describe scene`.

---

## Feature 4: Obstacle Alert (on-device)

**Goal:** live camera warns "Chair, left, close." No internet needed. No spam.

**Ask me for:** nothing, unless the model file download fails. Then ask me to download `efficientdet_lite0.tflite` from the MediaPipe object detector model page and place it in `public/models/`.

**Files:** `src/modes/obstacle/detector.ts`, `src/modes/obstacle/logic.ts`, `src/speech/alertManager.ts`, `public/models/`, `public/mediapipe/wasm/`.

**Steps**
1. Install `@mediapipe/tasks-vision`. Copy its wasm files to `public/mediapipe/wasm/` so they load offline. Check the current package docs for the exact file names.
2. `detector.ts`: create `ObjectDetector` with `runningMode: "VIDEO"`, `scoreThreshold: 0.5`, `maxResults: 5`, GPU delegate with CPU fallback. Load lazily when Alert is first opened.
3. Detection loop: `requestAnimationFrame`, but run detection at about 8 to 10 fps (skip frames). Use `detectForVideo(video, performance.now())`.
4. `logic.ts` (the part I will explain to judges):
   - **Position:** box center x divided by frame width. Under 0.33 is "left", over 0.66 is "right", otherwise "ahead".
   - **Distance bucket** from box area divided by frame area: over 0.35 "very close", over 0.15 "close", over 0.05 "near", below that ignore. Document that this is a rough single-camera estimate.
   - **Relevant labels:** person, chair, couch, bed, dining table, bench, potted plant, backpack, suitcase, bicycle, car, dog, and other obstacles from the COCO label set. Keep the list in a config file.
   - **Priority:** closest and most central first. Speak at most one alert per cycle.
5. `alertManager.ts`:
   - Key = label + position + bucket.
   - Speak only if the key is new, or the bucket got closer.
   - Global minimum gap 2.5 seconds, per-key cooldown 6 seconds.
   - "Very close" and "ahead" interrupts current speech.
   - Sentence format: "Chair, left, close." or "Person ahead, very close."
6. Start and stop: tapping Alert toggles it. A big "Stop" state is shown. Stopping cancels speech.
7. Metrics: average detection latency per frame in ms, and fps. Show in a hidden debug overlay (triple tap) for the demo.
8. Optional if time allows: `navigator.vibrate` on "very close" (Android only).

**Done when**
- A 2-minute walk through a room gives sensible warnings with no spam.
- Works in airplane mode.
- Latency number recorded.
- Commit: `feat: obstacle alert on device`.

---

## Feature 5: Money Identifier (data, model, integration)

**Goal:** hold a banknote, hear the denomination. Self-trained model with measured accuracy.

This feature has TWO parts. Part A (data) can start on Day 1 in parallel with Features 2 and 3.

**Ask me for:** which denominations and currency, how many notes I have, confirmation I can run Colab. (Gemini cannot run Colab for me, it writes the notebook and I run it.)

### Part A: Data

1. Folder layout: `data/{class}/session_{n}/img_xxx.jpg` with classes like `100`, `500`, `1000`, `5000`, and `not_a_note`.
2. `not_a_note` class: hands, tables, phones, receipts, other paper, empty background. About as many images as one denomination. This lets the app say "I do not see a note."
3. Shooting guide: about 100 photos per denomination, both sides, different light, angles, distances, backgrounds, flat and folded, partly covered. One "session" = one sitting.
4. Hold out a whole session as the test set (never split randomly, it inflates accuracy).
5. Only photos I take myself during the event window.

### Part B: Training (Colab notebook in `ml/`)

1. Load images, resize to 224x224, normalize the way MobileNetV2 expects.
2. Transfer learning with MobileNetV2: frozen base, new head, light augmentation (rotation, brightness, zoom). Train, then optionally fine-tune the top layers.
3. Evaluate on the held-out session: accuracy, per-class precision and recall, confusion matrix. Save to `ml/results.md`.
4. Export for the browser. Preferred: TensorFlow.js format. Fallback: TFLite run through MediaPipe ImageClassifier (same library as Feature 4). Check current converter compatibility before choosing.
5. Save the model into `public/models/money/` and the class list in a JSON file.

### Part C: Integration

1. `modes/money/classifier.ts`: lazy load model, same preprocessing as training, run on the current frame.
2. Decision rules: top confidence at least 0.85 AND at least 0.2 above second place, AND the same answer in 3 consecutive frames. Else "I am not sure. Hold the note flat and closer."
3. `not_a_note` wins: speak "I do not see a note."
4. Speak "Five hundred rupees" (denomination words come from strings, ready for Urdu later).
5. **Gate:** if held-out accuracy is under 90 percent by end of Day 2, label the mode "experimental" in the UI and demo, or cut it. Do not claim numbers that were not measured.

**Done when**
- All denominations identified on a real phone in normal room light.
- Accuracy table saved in `ml/results.md`.
- Commit: `feat: money identifier`.

---

## Feature 6: Voice commands and honest uncertainty

**Goal:** hands-free switching, and one consistent way to say "I am not sure."

**Ask me for:** which phone and browser I demo on (iPhone Safari has limited speech recognition).

**Files:** `src/speech/listen.ts`, `src/core/confidence.ts`, `src/screens/Main.tsx`.

**Steps**
1. `listen.ts`: wrap `SpeechRecognition` / `webkitSpeechRecognition`. Push-to-talk: a large mic button, press and speak. Feature-detect, and if unsupported hide the button and keep tap controls.
2. Commands: "read", "describe", "alert", "money", "stop", "repeat", "help". Fuzzy match with simple keyword matching, ignore filler words. Leave a map ready for Urdu words.
3. "repeat" replays the last spoken sentence. "help" lists the commands in one short sentence.
4. `confidence.ts`: one file holding all thresholds (OCR legibility, describe confidence, money confidence, detection score) and one helper `unsure(reason)` returning the spoken line.
5. Every mode returns `{ ok, confidence }` and uses the helper. No mode invents its own wording.

**Done when**
- Saying each command switches modes on Android Chrome.
- Unsupported browsers fall back to buttons without errors.
- Commit: `feat: voice commands and uncertainty`.

---

## Feature 7: Polish (language, offline, dark rooms, settings)

**Goal:** kind and robust.

**Ask me for:** results of my Urdu voice test from Sprint 0 (works well, poor, or missing), and a native speaker to review Urdu strings.

**Steps**
1. **Language toggle** in the welcome pills and settings. Gemini prompts take `lang`. If the Urdu voice is poor, show Urdu text on screen and keep English voice, and say so honestly.
2. **Dark room detection:** compute average brightness of a downscaled frame. If too low, speak "It is too dark. Turn on a light."
3. **Offline:** service worker caches the app shell, fonts, MediaPipe wasm, detection model, money model. Status pill on the Modes screen shows what works offline.
4. **Modes screen** (right reference): timeline rows for Read, Describe, Alert, Money with ready or offline status.
5. **Settings:** speech rate slider (large), language, vibration on or off.
6. **Accessibility pass:** test with TalkBack (Android) or VoiceOver (iPhone), fix focus order and labels, 64px targets, reduced motion.
7. Vibration on very close obstacles if not already done (Android only).

**Done when**
- App is usable with the screen reader on and with the screen off.
- Airplane mode: Alert, Money and Tesseract reading still work.
- Commit: `feat: polish, language, offline`.

---

## Feature 8: Deploy, test, submit

**Ask me for:** Vercel account access, YouTube channel, tester availability.

**Steps**
1. Deploy to Vercel. Set `GEMINI_API_KEY` and `GEMINI_MODEL` as env vars. Check HTTPS install on a real phone.
2. Create `docs/results.md`: obstacle latency and fps, money accuracy and dataset size, time to first spoken answer for Read and Describe.
3. Real-user test script in `docs/user-test.md`: 3 tasks (read a medicine box, find an obstacle, identify a note), what to observe, questions to ask, a line for a quote and permission. Do not coach the tester.
4. README: what it does, setup, stack, results, limits, privacy note, the line "an assistive aid, not a replacement for a cane or guide dog."
5. Demo video (3 minutes or less): story hook, live demo with captions, how it works plus numbers, limits and what is next.
6. Devpost write-up: brainstorming, inspiration, design process, resources, final product. Link GitHub and video.

**Done when**
- Live link works on a phone.
- Checklist in PLAN.md is fully ticked.
- Submitted with time to spare.

---

## 5. Cut order if behind

Vibration, then Urdu voice, then Describe polish, then Money. Never cut Read Text, Obstacle Alert, or the real-user test.
