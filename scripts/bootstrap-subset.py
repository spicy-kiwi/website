#!/usr/bin/env python3
"""
Erzeugt assets/css/bootstrap-subset.css: nur die Bootstrap-Regeln, die die Seite braucht.

Warum: Das komplette Bootstrap hat ~2.300 Regeln und ~1.300 !important, die Seite nutzt
davon nur ein paar Dutzend Klassen. Regeln für Klassen, die nirgends vorkommen, ändern
an der Darstellung nichts, kosten aber Ladezeit und Punkte bei YellowLab & Co.

Welche Klassen bleiben:
  1. alle Klassen, die in der gebauten Seite (HTML) vorkommen
  2. alle Klassen, die die eigenen Skripte in assets/js setzen
  3. alle Klassen aus assets/css/bootstrap-keep.txt (für Neues, das noch nirgends steht)

Aufruf (im Projektordner):
  python3 scripts/bootstrap-subset.py           # baut die Seite, schreibt die Teilmenge neu
  python3 scripts/bootstrap-subset.py --check   # prüft nur; Exit-Code 1, wenn etwas fehlt

Neue Bootstrap-Klasse in einem Template benutzt? Einfach das Skript laufen lassen.
Zum schnellen Ausprobieren geht auch: params.bootstrapFull = true in hugo.toml.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FULL = os.path.join(ROOT, "assets/vendor/bootstrap-5.0.2.min.css")
OUT = os.path.join(ROOT, "assets/css/bootstrap-subset.css")
KEEP = os.path.join(ROOT, "assets/css/bootstrap-keep.txt")
JS_DIR = os.path.join(ROOT, "assets/js")

CLASS_RE = re.compile(r"\.([a-zA-Z][\w-]*)")


def used_classes(site_dir):
    used = set()
    for root, _, files in os.walk(site_dir):
        for f in files:
            if f.endswith(".html"):
                html = open(os.path.join(root, f), encoding="utf-8").read()
                for a, b in re.findall(r'class=(?:"([^"]*)"|([^\s>]+))', html):
                    used.update((a or b).split())
    for f in os.listdir(JS_DIR):
        js = open(os.path.join(JS_DIR, f), encoding="utf-8").read()
        for m in re.findall(r"(?:addClass|removeClass|toggleClass|classList\.(?:add|remove|toggle))\(\s*'([^']+)'", js):
            used.update(m.split())
        for m in re.findall(r'class=\\?"([^"\\]+)', js):
            used.update(m.split())
    if os.path.exists(KEEP):
        for line in open(KEEP, encoding="utf-8"):
            line = line.split("#", 1)[0].strip()
            used.update(line.split())
    return used


def keep_selector(sel, used):
    # Klassen in :not(...) entscheiden nicht darüber, ob eine Regel greift
    sel = re.sub(r":not\([^)]*\)", "", sel)
    return all(c in used for c in CLASS_RE.findall(sel))


def purge(css, used):
    out, i = [], 0
    while i < len(css):
        j = css.find("{", i)
        if j < 0:
            break
        head = css[i:j].strip()
        depth, k = 1, j + 1
        while depth:
            depth += {"{": 1, "}": -1}.get(css[k], 0)
            k += 1
        body = css[j + 1:k - 1]
        if head.startswith(("@media", "@supports")):
            inner = purge(body, used)
            if inner:
                out.append(head + "{" + inner + "}")
        elif head.startswith("@"):
            out.append(head + "{" + body + "}")
        else:
            sels = [s for s in head.split(",") if keep_selector(s, used)]
            if sels:
                out.append(",".join(sels) + "{" + body + "}")
        i = k
    return "".join(out)


def main():
    check = "--check" in sys.argv
    with tempfile.TemporaryDirectory() as tmp:
        # mit komplettem Bootstrap bauen: die Teilmenge darf dafür fehlen oder veraltet sein
        env = dict(os.environ, HUGO_PARAMS_BOOTSTRAPFULL="true")
        subprocess.run(["hugo", "--quiet", "-s", ROOT, "-d", tmp], check=True, env=env)
        used = used_classes(tmp)

    full = re.sub(r"/\*.*?\*/", "", open(FULL, encoding="utf-8").read(), flags=re.S)
    bootstrap_classes = set(CLASS_RE.findall(full))
    subset = purge(full, used)

    header = ("/* Automatisch erzeugt von scripts/bootstrap-subset.py aus "
              "assets/vendor/bootstrap-5.0.2.min.css. Nicht von Hand bearbeiten. */\n")
    new = header + subset + "\n"
    old = open(OUT, encoding="utf-8").read() if os.path.exists(OUT) else ""

    in_use = sorted(used & bootstrap_classes)
    if check:
        if new != old:
            print("bootstrap-subset.css ist veraltet. Bitte ausführen: python3 scripts/bootstrap-subset.py")
            sys.exit(1)
        print(f"bootstrap-subset.css ist aktuell ({len(in_use)} Bootstrap-Klassen).")
        return

    open(OUT, "w", encoding="utf-8").write(new)
    print(f"{os.path.relpath(OUT, ROOT)}: {len(new) // 1024} KB, "
          f"{len(in_use)} Bootstrap-Klassen, {subset.count('!important')} × !important")
    print("Klassen:", ", ".join(in_use))


if __name__ == "__main__":
    main()
