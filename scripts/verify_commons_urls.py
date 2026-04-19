#!/usr/bin/env python3
"""One-off: verify Wikimedia Commons file URLs for RWS deck ordering."""
import json
import subprocess
import urllib.parse

def build_files():
    majors = [
        "RWS Tarot 00 Fool.jpg",
        "RWS Tarot 01 Magician.jpg",
        "RWS Tarot 02 High Priestess.jpg",
        "RWS Tarot 03 Empress.jpg",
        "RWS Tarot 04 Emperor.jpg",
        "RWS Tarot 05 Hierophant.jpg",
        "RWS Tarot 06 Lovers.jpg",
        "RWS Tarot 07 Chariot.jpg",
        "RWS Tarot 08 Strength.jpg",
        "RWS Tarot 09 Hermit.jpg",
        "RWS Tarot 10 Wheel of Fortune.jpg",
        "RWS Tarot 11 Justice.jpg",
        "RWS Tarot 12 Hanged Man.jpg",
        "RWS Tarot 13 Death.jpg",
        "RWS Tarot 14 Temperance.jpg",
        "RWS Tarot 15 Devil.jpg",
        "RWS Tarot 16 Tower.jpg",
        "RWS Tarot 17 Star.jpg",
        "RWS Tarot 18 Moon.jpg",
        "RWS Tarot 19 Sun.jpg",
        "RWS Tarot 20 Judgement.jpg",
        "RWS Tarot 21 World.jpg",
    ]
    files = list(majors)
    for i in range(1, 15):
        files.append("Tarot Nine of Wands.jpg" if i == 9 else f"Wands{i:02d}.jpg")
    for i in range(1, 15):
        files.append(f"Cups{i:02d}.jpg")
    for i in range(1, 15):
        files.append(f"Swords{i:02d}.jpg")
    for i in range(1, 15):
        files.append(f"Pents{i:02d}.jpg")
    assert len(files) == 78
    return files


def query(titles):
    qs = urllib.parse.urlencode(
        {
            "action": "query",
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json",
            "titles": "|".join("File:" + t for t in titles),
        }
    )
    url = "https://commons.wikimedia.org/w/api.php?" + qs
    out = subprocess.check_output(["curl", "-sS", url], text=True)
    return json.loads(out)


def main():
    files = build_files()
    missing = []
    urls = [None] * 78
    for start in range(0, 78, 35):
        batch = files[start : start + 35]
        data = query(batch)
        for pid, page in data["query"]["pages"].items():
            title = page.get("title", "")
            idx = None
            for i, f in enumerate(files):
                if title == "File:" + f:
                    idx = i
                    break
            if idx is None:
                continue
            if "missing" in page:
                missing.append(title)
            else:
                urls[idx] = page["imageinfo"][0]["url"]
    print("missing:", missing)
    print("null count:", sum(1 for u in urls if u is None))
    for i, (f, u) in enumerate(zip(files, urls)):
        if u is None:
            print(i, f, "NO URL")


if __name__ == "__main__":
    main()
