# Projekt-Audit — Spicy Kiwi

Stand: 2026-10-02, fünfter Durchlauf.
Geprüft: `scripts/check.sh` (Build, Bootstrap-Check, 359 Seiten + Rezeptdaten), YellowLab Tools auf **13 Live-Seiten** aller Seitentypen, Layout-Stabilität live in Chromium (Desktop + Handy).

**Priorität:** 🔴 dringend · 🟡 lohnt sich · 🟢 nice-to-have
**Wer:** ✅ kann ich selbst · 🟨 brauche Entscheidung/Text · ❌ nur du

---

## Stand

`./scripts/check.sh`: **alles in Ordnung** (0 Fehler; Hinweis: 91 Rezepte ohne Foto).

**YellowLab live (Desktop, mit Cloudflare/gzip):**

| Seitentyp | Seite | Score |
|---|---|---|
| Startseite | `/` | 96 |
| Rezeptliste | `/rezepte/` | 97 |
| Rezeptliste Folgeseite | `/rezepte/page/10/` | 96 |
| Tag-Übersicht | `/tags/` | 97 |
| Tag groß / mittel / klein | `/tags/vegetarisch/`, `/tags/nudeln/`, `/tags/dip/` | 97 / 96 / 97 |
| Tag Folgeseite | `/tags/vegetarisch/page/5/` | 97 |
| Rezept mit Foto (3 Stück) | Bohnensalat, Risotto Spinat, Quiche | 97 / 97 / 97 |
| Rezept ohne Foto (2 Stück) | Einfacher Reis, Bauerntopf | 97 / 97 |

Zum Vergleich: Erster Report 77 (Startseite), `/rezepte/` 54.

**Layout-Stabilität live:** CLS 0 auf allen Seiten, außer einem einzelnen Ausreißer (0,165, Rezeptseite, Handy) in einem von 23 Durchläufen. Nicht reproduzierbar, auch nicht mit/ohne Cloudflare-Skripte (20 Läufe, alle 0). Wird beobachtet.

---

## Was noch Punkte kostet

Auf **allen** Seiten dieselben vier Regeln. Das heißt: Es sind keine seitenspezifischen Probleme mehr übrig, sondern nur noch Grundlast.

| Regel | Score | Ursache | Lösung | Wer |
|---|---|---|---|---|
| CSS-Regeln (`cssRules`) | 27 | ~2.400 Regeln, fast alle aus Tachyons (Ananke) | Tachyons kürzen wie Bootstrap (Prototyp: ~+3–4 Punkte) | ✅ (von dir zurückgestellt) |
| Farben (`cssColors`) | 31 | Farbpaletten von Tachyons und Bootstrap | dito | ✅ |
| `!important` | 57 | ~30 Stück: 14 Bootstrap, 16 Tachyons, 2 eigene | dito | ✅ |
| Cache-Header (`cachingNotSpecified`) | 47–99 | Webserver sendet kein `Cache-Control` | Server-Konfiguration (Werte siehe unten) | ❌ |
| Bilder unter dem Sichtbereich | 45–55 | Startseite/Listen: Karussell- und Kartenbilder | Messfehler von YLT 1.12 (PhantomJS kennt `loading="lazy"` nicht) | – |
| DOM-Tiefe | 80 | Rezept-Kasten (Bootstrap-Card in Grid) | wäre ein Umbau des Rezept-Kastens, lohnt nicht | – |

**Cache-Header (Empfehlung für den Webserver):**
- `*.min.<hash>.css|js`, `/vendor/*.<hash>.js`, Vorschaubilder `*_hu_*.webp`: `public, max-age=31536000, immutable`
- übrige Bilder: `public, max-age=2592000`
- HTML: `no-cache`

---

## Offene Punkte

| # | Punkt | Prio | Wer |
|---|---|---|---|
| 1 | 91 Rezepte ohne Foto (keine Rezept-Rich-Results bei Google) | 🔴 | ❌ |
| 2 | Google Search Console + Sitemap | 🔴 | ❌ |
| 3 | Cache-Header | 🟡 | ❌ |
| 4 | `check.sh` in `deploy.sh` einbinden | 🟡 | ❌ (eine Zeile, siehe unten) |
| 5 | ~~YellowLab-Monitoring~~ erledigt: `scripts/ylt-monitor.py`, Ausgangswert 97,0 (Desktop und Handy) | – | – |
| 6 | Beschreibung `/rezepte/` („Kochanleitungen für leckere Gerichte") | 🟢 | 🟨 |
| 7 | Daten: Lauch Pasta mit Tag Risotto, Blumenkohlsalat mit Curry, „Jamaikan", `nudeln_mit_pilzrahm` ohne Trello/Sterne | 🟢 | 🟨 |
| 8 | Tachyons kürzen (CSS-Regeln, Farben) | 🟢 | ✅ (zurückgestellt) |

`deploy.sh`, erste Zeile:
```bash
/docker/spicykiwi/scripts/check.sh || { echo "Check fehlgeschlagen, kein Deploy."; exit 1; }
```

---

## Empfehlung: Den Global Score für die ganze Seite entwickeln

### YellowLab kann nicht crawlen
Die eigene Instanz (v1.12.1) misst über `POST /api/runs` immer **genau eine URL**. Es gibt keine Crawl- oder Sitemap-Funktion (im Code geprüft). Auch neuere Versionen analysieren nach meinem Kenntnisstand eine URL pro Lauf.

### Eine URL pro Seitentyp reicht
Die Stichprobe zeigt: Seiten aus demselben Template unterscheiden sich um höchstens 1 Punkt, egal ob Tag mit 1 oder 128 Rezepten, Rezept mit oder ohne Foto. Die ganze Seite mit 221 URLs zu messen (~1 h pro Durchlauf) bringt also keine zusätzliche Information. Sinnvoll sind **7 Mess-URLs**, eine pro Template:

| Template | Mess-URL | Anteil an der Seite |
|---|---|---|
| Rezept | `/rezepte/bohnensalat/` | 168 Seiten |
| Tag | `/tags/vegetarisch/` | 50 (+ Folgeseiten) |
| Rezeptliste | `/rezepte/` | 1 (+ 18 Folgeseiten) |
| Rezeptliste Folgeseite | `/rezepte/page/2/` | 18 |
| Tag-Übersicht | `/tags/` | 1 |
| Startseite | `/` | 1 |
| Rezept ohne Foto | `/rezepte/einfacher_reis/` | Kontrolle Platzhalter |

Daraus ergibt sich ein **Seiten-Score** als Mittelwert, gewichtet nach Anzahl Seiten je Template. Heute: ~97. Die Rezeptseiten dominieren, weil sie die meisten Besucher aus Google bekommen.

Ändert sich ein Template, z. B. die Rezeptseite, ändern sich alle 168 Seiten gleich, und die Mess-URL zeigt es sofort. Neue Seitentypen (z. B. „Über uns") kommen einfach als weitere Mess-URL dazu.

### Automatisch messen statt manuell
Vorschlag `scripts/ylt-monitor.py` (✅, kann ich bauen):
- ruft die 7 URLs über die API eurer YellowLab-Instanz auf,
- schreibt Datum, Score je URL und den gewichteten Seiten-Score in `ylt-history.csv`,
- meldet, wenn ein Wert mehr als 3 Punkte unter dem letzten Lauf liegt, und nennt die Regel, die gekippt ist.

Laufen lassen: nach jedem Deploy (letzte Zeile in `deploy.sh`) oder täglich per Cron. So sieht man Verschlechterungen wie den Sprung 87 → 77 (Karussell) sofort und weiß, welche Änderung es war.

### YellowLab aktualisieren
Die Instanz läuft mit **v1.12.1 (PhantomJS)**. Das sorgte hier schon zweimal für Fehlalarme:
- „JS-Fehler" wegen `Set`
- „Bilder unter dem Sichtbereich", weil `loading="lazy"` ignoriert wird

Neuere YellowLab-Versionen messen mit Headless-Chrome und sind näher an echten Browsern. Vor dem Wechsel einmal mit den 7 URLs parallel messen, damit die History vergleichbar bleibt (die Scores werden sich etwas verschieben).

### YellowLab ist nur ein Teil des Bildes
YellowLab bewertet Frontend-Qualität (CSS, JS, Requests), nicht, was Besucher erleben. Ergänzend:
- **Core Web Vitals** (LCP, CLS, INP): PageSpeed Insights bzw. Lighthouse auf dieselben 7 URLs. Sobald genug Besucher da sind, zeigt die Search Console echte Felddaten.
- **`scripts/check.sh`** fängt inhaltliche Fehler ab (Links, Titel, Daten), die YellowLab nicht sieht.
