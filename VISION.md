# Roman Chess: vision

_Captured 2026-10-10 from Daniel's voice note. An earlier attempt was an empty Godot project (RomanChess2D, June 2025); the idea keeps coming back._

## Daniel's picture (his words, lightly condensed)

- (Superseded 2026-10-28, see update below.) As a child he imagined a pawn not as one soldier but as a whole **unit**: a tight, ordered rectangle of Roman soldiers. He loves the **order of the Roman army** and its hierarchy of unit sizes, which he met while learning Latin (contubernium → centuria → cohors → legio).
- **Animated battles** make chess attractive. Inspiration: Harry Potter's wizard chess (the queen walks over, lifts her chair and smashes the other piece) and *Battle vs Chess*. Animations can start simple and grow more elaborate.
- **White = Romans.** Black is open: Germanic tribes, Greeks or monsters. More skins later.
- **3D, possibly with a fixed camera** to keep it simple. An app he would buy himself.
- A side project: Daniel mostly talks to a model, the model builds.

## Update 2026-10-28 (Daniel): the pawn

- **A pawn is one Roman legionary**, not a whole unit: a soldier with a large curved, semi-cylindrical shield (scutum) and a spear/pilum.
- The pawn row then forms a **shield wall**: a line of big curved shields side by side. That is the image Daniel wants.
- The "pawn = whole legion" idea stays in the background only, maybe as a later skin or mode.
- Target devices: iPhone and iPad first (Daniel has an iPhone 14), later everything. Daniel has no Mac, only Ubuntu 22.04, so browser first; App Store later via a cloud Mac build.

## Open questions

- Who is Black?
- Fixed or free camera?
- Platform: browser first (playable on phone), or Godot?

## Notes from Claude (2026-10-10, suggestions, not decisions)

- **Black:** Germanic tribes fit best. Historically (Teutoburg, AD 9) and visually: tight Roman blocks against loose, wild clusters makes the theme "order vs. chaos" visible on the board. Monsters would break the tone.
- **Platform:** a browser game (three.js, fixed camera) is the shortest path from talking to playing, and it runs on the phone. Godot can come later if it ever needs to be a store app.
- **Hard part:** code and rules are easy for today's models. Art and character animation are not. Start with stylized low-poly figures built in code or free CC0 asset packs, and keep Harry-Potter-level animation as a later stage.
