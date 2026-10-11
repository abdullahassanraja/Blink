# Blink

### One tap. One sentence.

**A phone camera that speaks. It starts with the box in your hand.**

Built for **Banana Hacks 2026** (Image AI hackathon, Oct 9-12, 2026) by Abdullah Hassan.
Live app: [Blink Live App](https://blink-roan.vercel.app/) | Demo video: [YouTube Demo](https://youtu.be/aLXntApQXew?si=5qxeIbDOXNPslyoj) | 

---

# Part 1. The problem

## Two boxes, one shelf

Picture a medicine shelf.

Two boxes sit side by side. Same size. Same white card. Same blue stripe. One is for a headache. The other is not.

Anyone who can see knows which is which in half a second. The name is printed right there. You never think about it.

Now take away the half second. You hold one box. Its name is printed in tiny letters on the front, and the strength and directions are printed even smaller on the side. The print is right there in your hand, and none of it reaches you.

You could ask someone. If someone is home. If you do not mind asking, again, for the fifth time this week. If you are happy to hand over a small piece of your privacy every time you need to take a tablet.

That is the problem I could not stop thinking about.

## It does not stop at the medicine box

Once you start looking, the same wall is everywhere.

- A banknote in your hand, and a shopkeeper waiting. Is it a 100 or a 1000?
- A sign on a wall that everyone else walked past in a second.
- A chair that someone moved since yesterday.

Everyday visual information is locked behind sight. Tools that unlock it do exist, but many are expensive, need fast internet, or run on devices most people do not own. And most are built around other currencies and other languages.

What people need is not a big, fancy system. It is the phone they already carry, looking at the world and saying what it sees.

> My uncle is blind. He once ended up in the hospital after taking the wrong medicine, because he mistook one for another. I built Blink so that nobody has to depend on luck, or on someone being home, to know what they are holding.

---

# Part 2. The solution

## Meet Blink

You open Blink. It greets you by voice. The camera starts.

You tap one huge button, or say what you want. You hear one short sentence.

That is the whole idea. **Small move, big impact.**

Back to the shelf. You hold up the box and tap **Read**.

> *"Paracetamol. Five hundred milligrams. Please confirm with a person before taking it."*

Blink read the label. It did not tell you how much to take, and it never will. It handed you the name, and it reminded you to double check. Its job is to give you the information. The decision stays yours.

## Four things Blink can do

| Mode | You do | Blink says |
|---|---|---|
| **Read** (the heart of it) | Point at a medicine box, label, sign or menu | "Paracetamol, 500 milligrams. Please confirm with a person before taking it." |
| **Describe** | Point at the room | "A kitchen counter. A red mug on the left, a knife on the right." |
| **Alert** | Walk with the camera forward | "Chair, left, close." |
| **Money** | Hold up a Pakistani rupee note | "One thousand rupees." |

## How Blink treats you

Every choice here comes from one question: what would I want from a voice that I cannot see, cannot interrupt, and have to trust?

- **It admits when it is not sure.** If the label is blurry or the model is unsure, Blink says "I could not read that. Hold it closer, flat, and in light." A confident wrong answer is worse than no answer, especially when you cannot check it with your eyes.
- **It does not nag.** Obstacle alerts only speak when something meaningful changes, never the same warning twice in a row.
- **It reads, it does not advise.** No doses, no recommendations, only what is printed.
- **It is voice first.** The screen is a backup. Buttons are huge and high contrast, and captions mirror everything Blink says, so a helper beside you can follow along.
- **Obstacle detection runs on the phone.** No internet, no waiting.

---

# Part 3. How it works

```mermaid
flowchart LR
    A[Phone camera] --> B[Blink web app, PWA]
    B -->|Read, Describe| C[Serverless proxy on Vercel]
    C --> D[Gemini Flash]
    B -->|Read, offline| E[Tesseract.js on device]
    B -->|Alert| F[MediaPipe object detector on device]
    B -->|Money| G[FastAPI service on Render]
    G --> H[MobileNetV2 model, TFLite]
    B --> I[Speech out and captions]
