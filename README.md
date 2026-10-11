# Blink

**One tap. One sentence.**

Voice-first camera assistant for blind and low-vision users. Hackathon project — Banana Hacks 2026.

---

## What it does

| Mode | How it works | Needs internet |
|---|---|---|
| **Read** | Point at text, tap Read, hear it spoken | Yes (Gemini) / No (Tesseract fallback) |
| **Describe** | Tap Describe, hear a 2-sentence scene description | Yes |
| **Alert** | Live obstacle warnings: "Chair, left, close." | No (on-device) |
| **Money** | Hold a Pakistani rupee note, hear the denomination | No (on-device) |

## Setup

```bash
npm install
cp .env.example .env   # add your Gemini API key
npm run dev            # then open on a real phone via the Vercel preview URL
```

Camera requires HTTPS. Use `vercel dev` so `/api/gemini` works locally.

## Stack

- React + TypeScript + Vite + vite-plugin-pwa
- Camera: `getUserMedia` (rear camera)
- Voice out / in: `SpeechSynthesis` / `SpeechRecognition`
- Read and Describe: Gemini Flash via serverless proxy (`/api/gemini`)
- OCR fallback: Tesseract.js (lazy loaded, offline)
- Obstacle detection: MediaPipe ObjectDetector, EfficientDet-Lite0 (on-device)
- Money: MobileNetV2 transfer learning, TensorFlow.js (on-device)
- Fonts: DM Sans (bundled)

## Privacy

Photos are sent to the Gemini API to read and describe them. Images are not stored. Please review [Google's current data terms](https://ai.google.dev/gemini-api/terms) before using with sensitive documents.

Blink is an assistive aid, not a replacement for a cane or guide dog.

## Results

See [`docs/results.md`](docs/results.md) for obstacle latency, money accuracy, and time-to-speech numbers.

## Limits

- Scene description and Read require an internet connection.
- Money identifier accuracy depends on training data — see `ml/results.md`.
- Voice commands require Chrome on Android. iOS Safari has limited speech recognition.
- Dosage advice is never given. Always confirm medicine with a person.

## License

MIT
