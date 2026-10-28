# Roman Chess: Entscheidungsgrundlage

_Stand 2026-10-28. Rund 25 Minuten Websuche, nichts auf Geräten getestet. Viele Zahlen stammen aus Sekundärquellen (Blogs, Preisvergleiche): vor dem Bezahlen auf der offiziellen Seite prüfen. **(ä)** = älteres Wissen, in dieser Recherche nicht neu geprüft. Alle Punktwerte sind meine Einschätzung._

## Empfehlung auf einen Blick

| Thema | Empfehlung | Grund |
|---|---|---|
| Engine | **three.js** mit TypeScript und Vite, Schachregeln mit chess.js | Modelle schreiben three.js am sichersten; alles ist Text und ohne Editor testbar. Babylon.js liegt knapp dahinter und wäre kein Fehler. |
| Weg zur App | Browser zuerst (auch als Web-App auf dem Home-Bildschirm), später dieselbe Codebasis mit **Capacitor** in den App Store | Ein Code für iPhone, iPad, Android, Desktop |
| iOS-Build ohne Mac | **Codemagic** Free (500 Min/Monat auf Mac mini M2), GitHub Actions als Reserve | Reicht für grob 50 Builds im Monat ohne Kosten |
| Pflichtkosten | Apple Developer Program, **99 $/Jahr** | Ohne geht weder TestFlight noch App Store |
| Test am iPhone | Erst Safari im WLAN, dann **TestFlight** (interner Tester) | |
| Figurenstil, Stufe 1 | **Lebende Statuen** ohne Skelett: Stein oder Bronze, beim Schlagen zerbrechen | Das ist der Zauberschach-Look und spart am Anfang den teuersten Teil |
| Animation, Stufe 2 | Ein Rig für alle Soldaten, Clips aus **Quaternius UAL 1+2 (CC0)** und Mixamo, per Blender-Python-Skript übertragen | Kostenlos, kommerziell nutzbar, vollständig skriptbar |
| KI-3D | **Meshy oder Tripo**, einen Monat bezahlt (~20 $), nur für Körper ohne Schild und Speer. **Hunyuan3D meiden** | Hunyuan-Lizenz gilt nicht in der EU; Gratisstufen verlangen Namensnennung (Meshy) oder verbieten kommerzielle Nutzung (Tripo) |
| Scutum und Speer | Im Code erzeugen | Gekrümmter Zylinderausschnitt und Stab: einfache Geometrie |

## 1. Engine

100 = am besten. Bei Lizenz heißt 100 kostenlos, bei Aufwand heißt 100 wenig Arbeit für dich. Godot geht mit dem nativen Leistungswert in die Gewichtung ein.

| Kriterium | three.js | Babylon.js | PlayCanvas | Godot 4 | Unity 6 |
|---|---|---|---|---|---|
| Modell schreibt und testet allein | 92 | 85 | 68 | 62 | 40 |
| Figuren und Animation | 75 | 80 | 78 | 85 | 92 |
| Leistung iPhone 14 | 75 | 72 | 78 | 85 nativ, 35 im Browser | 90 |
| Weg in den App Store | 70 | 70 | 70 | 70 | 65 |
| Lizenzkosten | 100 (MIT) | 100 (Apache 2.0) | 95 (Engine MIT) | 100 (MIT) | 80 |
| Dein Aufwand | 75 | 75 | 62 | 58 | 40 |
| **Gewichtet** (erste Zeile zählt doppelt) | **83** | **81** | 74 | 75 | 64 |

- **three.js:** Die meisten Beispiele im Netz, also auch im Training der Modelle. Logik mit Vitest, Bild mit Playwright-Screenshots in Headless-Chromium; Playwright bringt auch einen WebKit-Build für Linux mit, als grobe Safari-Näherung (ä). glTF und AnimationMixer mit Überblendungen sind da; Zustandsmaschine und IK schreibt das Modell selbst (klein).
- **Babylon.js:** TypeScript-first und mehr eingebaut (GUI, Havok-Physik, Animationsgruppen, Inspector), Version 9.0 seit März 2026. Etwas weniger Trainingsmaterial, größeres Paket. Gleichwertige Alternative.
- **PlayCanvas:** Engine offiziell ohne Editor nutzbar (npm, React, Web Components, `create-playcanvas`), gut für Mobilgeräte. Die meisten Beispiele setzen aber den Cloud-Editor voraus.
- **Godot 4:** Starkes Animationssystem und native Leistung. Der Web-Export ist auf iOS-Safari die schwächste Plattform (Abstürze, WebGL-Kontextverlust, Speicher), „Browser zuerst" passt also schlecht. Modelle mischen gern Godot-3- und Godot-4-Syntax (ä); Import und Animationsbäume laufen praktisch über den Editor. iOS-Export über macOS-Runner per Community-Action.
- **Unity 6:** Beste Animation (Humanoid-Retargeting), Asset Store mit fertigen Soldaten (ä), beste native Leistung. Szenen und Prefabs sind Editor-Dateien mit GUIDs: Das Modell schreibt C#, die Verdrahtung bleibt Klickarbeit. Personal ist frei bis 200 k $ Umsatz, Splash-Screen seit Unity 6 optional (Ankündigung 2024; eine Quelle von 2026 widerspricht).

**Fazit:** three.js. Die Qualität der Figuren hängt vor allem an den Assets, weniger an der Engine. Regeln (chess.js) und Darstellung getrennt halten; dann bleiben Regeln, Assets und Tests bei einem späteren Wechsel zu Babylon erhalten. Ein Wechsel zu Godot oder Unity wäre ein Neuanfang.
**Leistung:** Schach steht meistens still. Nur rendern, wenn sich etwas bewegt: Das schont Akku und Temperatur mehr als jede Engine-Wahl. 32 Figuren mit je 5–10 k Dreiecken und ein Schattenlicht sind für den A15 unkritisch (ä, nicht gemessen).

## 2. Vom Browser zur App

- **PWA:** Seit iOS 26 öffnet jede zum Home-Bildschirm hinzugefügte Seite als Web-App im Vollbild. Die Installation bleibt manuell, es gibt keinen Store und keine Bezahlung. Gut zum Testen mit dir und Freunden, nicht zum Verkaufen.
- **Capacitor:** Packt dieselbe Web-App in eine native Hülle mit WKWebView, also dieselbe WebKit-Engine wie Safari. Mindestens ein three.js-Spiel mit Capacitor kam nachweislich durch die Review.
- **WebGL/WebGPU:** WebGL2 ist die sichere Basis. WebGPU ist seit iOS 26 standardmäßig an, laut Apple-Ingenieur auch in WKWebView. three.js' WebGPURenderer fällt bei Bedarf auf WebGL2 zurück. Das iPhone 14 bekommt iOS 26 (ä). Mit WebGL2 starten.
- **Bekannte Probleme:**
  1. iOS beendet unter Speicherdruck den GPU-Prozess von WebKit, teils ohne `webglcontextlost`. Gegenmittel: kleines Texturbudget (KTX2), Spielstand laufend speichern, sauberer Wiederanlauf.
  2. Audio: Web Audio gilt auf iOS als „ambient" und folgt dem Stummschalter. Für ein Schachspiel ist das richtig. Der Ton muss mit der ersten Berührung freigeschaltet werden (ä). Wer trotz Stummschalter Ton will: `navigator.audioSession.type = 'playback'` (nicht standardisiert) oder die Bibliothek `unmute`.
  3. Debugging: Safaris Web Inspector für das iPhone braucht einen Mac (ä). Unter Linux: Konsole in der Seite (z. B. Eruda) oder Logs per WLAN an den Rechner.
  4. Richtlinie 4.2 („nur eine Website"): Ein vollständiges Spiel, das offline aus dem App-Paket läuft und keine Webseite lädt, ist gut aufgestellt. Restrisiko senken mit Haptik, Game Center und sauberem Verhalten im Flugmodus (Prüfer testen angeblich so). Eine Garantie gibt es nicht, Apple sagt selbst, das lasse sich vorher nicht sagen.
- **Alternativen:** Tauri 2 nutzt ebenfalls WKWebView und bringt dir nichts dazu, Cordova ist Altlast (beides ä). Capacitor ist der Standardweg.

## 3. iOS-Build ohne Mac

| Posten | Kosten | Bemerkung |
|---|---|---|
| Apple Developer Program | 99 $/Jahr, regional abweichend | Pflicht für TestFlight und App Store. Ohne Verlängerung verschwinden die Apps. |
| Codemagic Free | 0 $ für 500 Min/Monat (Mac mini M2, nur persönliches Konto) | Danach 0,095 $/Min. Ein Capacitor-Build dauert grob 5–10 Min (ä). |
| GitHub Actions macOS | 0,062 $/Min seit 1.1.2026 | Dein Repo ist privat, es gelten also die Freiminuten des Kontos; ob macOS-Minuten weiter zehnfach zählen, ist widersprüchlich. Etwa 0,30–0,60 $ pro Build. |
| Expo EAS | 15 iOS-Builds/Monat gratis | Nur mit React Native/Expo sinnvoll, nicht mit Capacitor. |

Seit 28.04.2026 müssen Uploads mit **Xcode 26 und iOS-26-SDK** gebaut sein; das Build-Image entsprechend wählen.

Ablauf (ä, nicht Schritt für Schritt geprüft):
1. Dem Apple Developer Program als Einzelperson beitreten (auch über die Apple-Developer-App auf dem iPhone möglich).
2. In App Store Connect einen App-Eintrag (Bundle-ID) und einen API-Schlüssel (.p8) anlegen.
3. Codemagic mit dem GitHub-Repo verbinden. Mit dem API-Schlüssel erzeugt Codemagic Zertifikat und Provisioning-Profil selbst.
4. Build als YAML im Repo: `npm ci` → `vite build` → `npx cap sync ios` → Xcode-Build mit Signatur → Upload zu TestFlight.
5. TestFlight-App auf dem iPhone: Interne Tester bekommen Builds ohne Beta-Review; ein Build läuft 90 Tage.

**EU:** Wer mit der App Geld verdient, gilt im EU-App-Store als „Trader" (DSA). Bei Einzelpersonen stehen dann Adresse (oder Postfach), Telefonnummer und E-Mail öffentlich auf der Produktseite.

## 4. Figuren und Animation

| Werkzeug | Kosten | Kommerziell | Hinweis |
|---|---|---|---|
| Meshy | Free 100 Credits/Monat, Pro ~20 $/Monat | Free: CC BY 4.0, Namensnennung nötig. Bezahlt: private Nutzungsrechte. | Rigging und Animation für Humanoide eingebaut |
| Tripo | Pro ~20 $/Monat; Auto-Rig ~0,25 $, Retarget ~0,10 $/Clip (API) | Free: nur nicht-kommerziell. Ab Pro kommerziell. | |
| Hunyuan3D (Tencent) | lokal gratis | Lizenzgebiet schließt **EU, UK, Südkorea** aus | Für dich in der EU nicht nutzbar |
| TRELLIS.2 (Microsoft) | lokal gratis, braucht starke NVIDIA-GPU (ä) | MIT laut Sekundärquellen | Lizenzdatei selbst prüfen |
| Quaternius UAL 1 + 2 | gratis (Vollversion günstig) | CC0 | 120+ bzw. 130+ Clips auf einem Humanoid-Rig; UAL 2 (Januar 2026) mit Nahkampf-Kombos. Ob Schild- oder Speerclips dabei sind: nicht bestätigt. |
| Mixamo | gratis mit Adobe-ID | Ja, in Spielen; Rohdateien nicht weiterverkaufen | Nur Humanoide, Wartungsmodus, im Juni 2025 tagelang ausgefallen. Schwert-und-Schild-Sets vorhanden (ä). |
| Video zu Animation (DeepMotion, Plask, Rokoko Vision, QuickMagic) | Gratisstufen | je Stufe unklar | Du filmst dich mit Besen und Brett als Schild. Bedingungen und glTF-Export vorher prüfen. |

Qualität habe ich nicht selbst getestet. Typische Schwächen von KI-Figuren (ä): ein verschmolzenes Mesh (Schild wächst aus dem Arm), unsaubere Topologie, eingebackenes Licht, schwache Hände. Bei Schachkamera-Distanz zählt die Silhouette mehr als das Detail, und Scutum plus Speer sind eine sehr klare Silhouette. Daher: Körper in A-Pose ohne Requisiten erzeugen, verkleinern, Requisiten getrennt.

**glTF-Weg:** Blender headless mit Python (`bpy`): importieren, Clips auf ein Rig übertragen, benennen, Polygone reduzieren, als `.glb` exportieren → `gltf-transform` (meshopt, KTX2) → three.js `GLTFLoader` und `AnimationMixer`. Alles Skripte, also vom Modell schreib- und prüfbar, z. B. ein Test „jede Figur hat die Clips idle, march, thrust, hit, die und unter 8 k Dreiecke".

**Kleinster realistischer Weg zu überzeugenden Kämpfen:**
1. **Statuen ohne Skelett.** Bewegung als Gleiten und Hüpfen, Angriff als Ausfallschritt; die geschlagene Figur kippt und zerbricht (in Blender per Skript vorzerlegt), dazu Staub, Ton, kurzes Kamerawackeln. **Schildmauer:** Scutum etwa so breit wie ein Feld, dann bilden die acht Bauern auf der zweiten Reihe von selbst eine geschlossene Wand.
2. **Ein Rig für alle Soldaten.** Ein Legionärskörper, 5–6 Clips: Stand in der Schildmauer, Marschschritt, Speerstoß, Schildstoß, Treffer, Tod. Germanen bekommen denselben Rig mit anderem Körper, Rundschild und Speer: Alle Clips lassen sich wiederverwenden.
3. **Duelle beim Schlagen:** 2–4 Sekunden, mehrere Varianten, überspringbar, Tempo umschaltbar.

**Animationsrisiko:** Fertige Schwert-und-Schild-Clips rechnen mit kleinen Schilden. Ein Scutum ist gut einen Meter hoch (ä) und schneidet dann durch Beine und Rumpf. Abhilfe: Schild am Oberkörper befestigen statt an der Hand und nur in eigenen Clips bewegen; Speer an die rechte Hand.

## 5. Ähnliche Spiele und deine Lücke

| Spiel | Stark | Schwach |
|---|---|---|
| Battle Chess (1988) und Battle vs Chess (2011, PC/Konsole) | Kampfanimationen sind der Hauptreiz | Lang und repetitiv (v. a. 1988), teils fehlende Animationen, Minispiele lenken vom Schach ab (2011). Spieler schalten ab oder spulen vor. |
| Battle Chess: Game of Kings (2015, Steam) | Remake in 3D | 51 % positiv bei rund 340 Bewertungen, kaum noch Spieler |
| Wizard's Battle Chess (iOS) | Animierte 3D-Figuren, Zerstörungseffekte | Laut Entwickler „performance-heavy"; keine aktuellen Updates gefunden |
| Chess Ultra: Pantheon (2017, DLC) | Römisches Bronzeset im Tempel, zeigt den Reiz des Themas | Statische Figuren, keine Kämpfe |
| Centurion's Gambit (Mai 2026, Steam) | Antike, Feldzug durch Germanien, Figuren mit Namen und Stufen | Anderes Genre (Roguelike), nur PC, kaum Bewertungen |

**Deine Lücke:** echtes Schach ohne Regeländerung, mobil zuerst, kurze und abwechslungsreiche Kämpfe, die man überspringen kann, und ein einziges starkes Bild: Ordnung (Schildmauer) gegen Wildheit (Germanen). Einen modernen, gut bewerteten historischen Battle-Chess-Titel fürs iPhone habe ich nicht gefunden; die Suche war kurz. Aus der Kritik folgt: Die Stellung muss jederzeit lesbar bleiben (Taste für Draufsicht).

**Nebenbefund:** Stockfish steht unter GPL, und ob GPL-Software in den App Store darf, ist umstritten. Für den Computergegner lieber eine eigene kleine Engine (Alpha-Beta) oder eine freizügig lizenzierte. chess.js ist BSD-2 (ä).

## Quellen

1. Engine: [Babylon.js 9.0](https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0) · [PlayCanvas ohne Editor](https://developer.playcanvas.com/user-manual/engine/standalone/) · [Unity Personal](https://unity.com/products/unity-personal) · [Unity Splash-Screen 2024](https://wccftech.com/unity-to-cap-runtime-fee-to-4-of-revenue-over-1m-users-will-self-report-figures/) · [Godot iOS-Export per Action](https://awesome.ecosyste.ms/projects/github.com%2Fdulvui%2Fgodot4-ios-export) · [Godot-Web auf iOS: Kontextverlust](https://forum.godotengine.org/t/webgl-context-loss-and-app-crash-in-godot-4-3-exported-web-on-ios-browsers/81024)
2. Browser zur App: [WebGPU in WKWebView (Apple-Forum)](https://developer.apple.com/forums/thread/770862) · [WebGPU in iOS 26](https://appdevelopermagazine.com/webgpu-in-ios-26/) · [three.js-Spiel im App Store](https://raxxo.shop/blogs/lab/shipping-a-three-js-game-to-the-ios-app-store) (Seite aus der Recherche-Umgebung nicht abrufbar, nur Suchzusammenfassung) · [Richtlinie 4.2, Forum](https://developer.apple.com/forums/thread/704430) · [4.2 und Spiele, Forum](https://developer.apple.com/forums/thread/103679) · [4.2 Flugmodus-Test (Anbieterblog)](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper) · [iOS 26 Web-Apps (heise)](https://heise.de/-10749652) · [WebKit-Bug Stummschalter](https://bugs.webkit.org/show_bug.cgi?id=251532) · [unmute](https://github.com/swevans/unmute)
3. Build: [GitHub-Actions-Preise 2026](https://stacktrack.com/posts/understanding-github-actions-runner-costs-in-2026/) · [Codemagic-Preise](https://indieappstack.com/tools/codemagic) · [Codemagic Free](https://agentdeals.dev/vendor/codemagic) · [Expo-Preise](https://expo.dev/pricing.md) · [Xcode-26-Pflicht für Capacitor](https://capawesome.io/blog/xcode-26-requirement-for-capacitor-apps/) · [Apple Developer Program](https://studio.adalo.com/blog/apple-developer-program-guide) · [EU-Trader-Pflicht (9to5Mac)](https://9to5mac.com/2025/02/18/apple-trader-information-app-store/) · [DSA (heise)](https://heise.de/-9838371)
4. Figuren: [Meshy-Preise](https://costbench.com/software/ai-3d-generation/meshy/) · [Tripo-API-Preise](https://developers.tripo3d.ai/en/pricing) · [Tripo-Review](https://makerstack.co/reviews/tripo-ai-review/) · [Hunyuan3D-Lizenz](https://huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE) · [TRELLIS.2](https://comfyui-wiki.com/en/models/trellis/trellis-2) · [Mixamo 2026 (Anbieterblog)](https://app.cinevva.com/guides/mixamo-to-blender-2026) · [Quaternius UAL](https://quaternius.com/packs/universalanimationlibrary.html) · [Quaternius UAL 2](https://quaternius.com/packs/universalanimationlibrary2.html) · [Video zu Animation](https://filmthreat.com/features/10-best-ai-tools-for-turning-video-into-3d-character-motion/)
5. Spiele: [Battle vs Chess (GOG)](https://www.gog.com/game/battle_vs_chess) · [GameXplain-Review](https://n4g.com/?p=789151) · [Battle Chess (Pocket Gamer)](https://www.pocketgamer.com/battle-chess/review/) · [Game of Kings (Steam)](https://store.steampowered.com/app/200150) · [Wizard's Battle Chess](https://apps.apple.com/us/app/mage-chess/id1441353927) · [Chess Ultra: Pantheon](https://www.thexboxhub.com/revitalise-chess-ultra-pantheon-game-pack-xbox-one/) · [Centurion's Gambit](https://store.steampowered.com/app/4634140) · [Stockfish und App Store (Forum)](https://talkchess.com/viewtopic.php?p=887130)

## Offene Fragen an dich

1. **Stil:** lebende Statuen (Stein oder Bronze, zerbrechen) oder bemalte Soldaten mit Haut und Stoff? Davon hängt fast der ganze Asset-Aufwand ab.
2. **Wohnsitz und Verkauf:** EU, als Privatperson? Dann stehen Adresse (oder Postfach) und Telefonnummer im EU-App-Store, und Hunyuan3D fällt weg.
3. **Version 1:** zwei Spieler an einem Gerät, Computergegner oder online? Der Computergegner berührt die Stockfish-Frage.
4. **Schwarz = Germanen?** Dann teilen beide Seiten ein Rig und alle Clips.
5. **Budget:** Sind ~20 $ für einen Monat Meshy oder Tripo in Ordnung, oder nur Gratis- und CC0-Material?
