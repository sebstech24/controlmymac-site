#!/usr/bin/env python3
"""Run after EVERY Mac or iPhone release. Checks that the website agrees with what is really out, and fixes
the press page.

    python3 scripts/after-release.py          # report only, exit 1 if something is stale
    python3 scripts/after-release.py --fix    # also update the press facts and rebuild press.html + the kit zip

It never commits or pushes: review `git diff`, then commit and push to main (that publishes).

Live sources: appcast.xml (Mac version the app updates to), the newest GitHub release (the DMG),
/download.dmg on the live site, and Apple's public lookup (the iPhone version people can download;
it can lag a few hours behind an approval, so run this again later if it still shows the old one).
The full list of what a release touches on the site is in README.md, "After every release".
"""
import datetime, email.utils, json, os, re, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRESS_SCRIPT = os.path.join(ROOT, "scripts", "build-press-kit.py")
REPO = "sebstech24/controlmymac-site"
APP_ID = "6781458180"
SITE = "https://www.controlmymac.com"
# site folder -> name used on the press page; this order is the order they are listed in
LANG_NAMES = {"": "English", "de": "German", "fr": "French", "it": "Italian", "es": "Spanish",
              "pt": "Portuguese (Brazil)", "nl": "Dutch", "pl": "Polish", "tr": "Turkish", "ru": "Russian",
              "uk": "Ukrainian", "sl": "Slovenian", "cs": "Czech", "sk": "Slovak", "sv": "Swedish",
              "no": "Norwegian", "da": "Danish", "fi": "Finnish", "hu": "Hungarian", "ro": "Romanian",
              "el": "Greek", "ja": "Japanese", "ko": "Korean", "zh": "Simplified Chinese",
              "zh-hant": "Traditional Chinese"}
FIX = "--fix" in sys.argv
problems, notes = [], []


def get(url, method="GET"):
    req = urllib.request.Request(url, method=method, headers={"User-Agent": "controlmymac-site-after-release"})
    return urllib.request.urlopen(req, timeout=30)


def long_date(d):
    return f"{d.day} {d.strftime('%B %Y')}"


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read()


# ---------------------------------------------------------------- Mac: appcast, GitHub release, download link
appcast = read("appcast.xml")
item = appcast.split("<item>")[1]
mac_version = re.search(r"<sparkle:shortVersionString>([^<]+)<", item).group(1)
mac_date = long_date(email.utils.parsedate_to_datetime(re.search(r"<pubDate>([^<]+)<", item).group(1)))
enclosure = re.search(r'<enclosure url="([^"]+)"', item).group(1)
expected_dmg = f"https://github.com/{REPO}/releases/download/v{mac_version}/ControlMyMac-{mac_version}.dmg"
if enclosure != expected_dmg:
    problems.append(f"appcast.xml: the newest item downloads {enclosure}, expected {expected_dmg}")

latest = json.load(get(f"https://api.github.com/repos/{REPO}/releases/latest"))
if latest["tag_name"] != f"v{mac_version}":
    problems.append(f"GitHub's latest release is {latest['tag_name']} but appcast.xml says {mac_version}: "
                    "add the appcast item (or publish the release) so both match")
if f"ControlMyMac-{mac_version}.dmg" not in [a["name"] for a in latest.get("assets", [])]:
    problems.append(f"GitHub release {latest['tag_name']} has no file named ControlMyMac-{mac_version}.dmg")

try:
    urllib.request.build_opener(type("NoRedirect", (urllib.request.HTTPRedirectHandler,),
                                     {"redirect_request": lambda *a, **k: None})).open(
        urllib.request.Request(SITE + "/download.dmg", method="HEAD"), timeout=30)
    live_dmg = "(no redirect)"
except urllib.error.HTTPError as e:
    live_dmg = e.headers.get("Location", "(no redirect)")
if live_dmg != expected_dmg:
    notes.append(f"{SITE}/download.dmg still leads to {live_dmg} (it is cached for up to 30 minutes after a release)")

# ---------------------------------------------------------------- iPhone: Apple's public lookup
look = json.load(get(f"https://itunes.apple.com/lookup?id={APP_ID}&country=us"))["results"][0]
ios_version = look["version"]
ios_date = long_date(datetime.datetime.fromisoformat(look["currentVersionReleaseDate"].replace("Z", "+00:00")))
store_languages = len(look.get("languageCodesISO2A", []))

# ---------------------------------------------------------------- website languages (folders with a home page)
site_folders = [f for f in LANG_NAMES if f == "" or os.path.exists(os.path.join(ROOT, f, "index.html"))]
unknown = sorted(d for d in os.listdir(ROOT) if re.fullmatch(r"[a-z]{2}(-[a-z]+)?", d)
                 and os.path.exists(os.path.join(ROOT, d, "index.html")) and d not in LANG_NAMES)
if unknown:
    problems.append(f"new website language folder(s) {unknown}: add them to LANG_NAMES in scripts/after-release.py")
site_languages = [LANG_NAMES[f] for f in site_folders]

# ---------------------------------------------------------------- press page facts
src = read("scripts/build-press-kit.py")
now = {"ios": re.search(r'^IOS_VERSION, IOS_DATE = "([^"]+)", "([^"]+)"', src, re.M).groups(),
       "mac": re.search(r'^MAC_VERSION, MAC_DATE = "([^"]+)", "([^"]+)"', src, re.M).groups(),
       "langs": re.findall(r'"([^"]+)"', re.search(r"^LANGUAGES = \[(.*?)\]", src, re.M | re.S).group(1))}
new = src
if now["mac"] != (mac_version, mac_date):
    problems.append(f"press page says Mac app {now['mac'][0]} ({now['mac'][1]}), appcast.xml says {mac_version} ({mac_date})")
    new = re.sub(r'^(MAC_VERSION, MAC_DATE = )"[^"]+", "[^"]+"', rf'\1"{mac_version}", "{mac_date}"', new, flags=re.M)
if now["ios"] != (ios_version, ios_date):
    problems.append(f"press page says iPhone app {now['ios'][0]} ({now['ios'][1]}), the App Store says {ios_version} ({ios_date})")
    new = re.sub(r'^(IOS_VERSION, IOS_DATE = )"[^"]+", "[^"]+"', rf'\1"{ios_version}", "{ios_date}"', new, flags=re.M)
# The press page says "N languages on the App Store", so the list only grows once the App Store has them too.
# Apple's lookup counts both Chinese scripts as one language.
store_has_all = store_languages in (len(site_languages), len(site_languages) - 1)
if now["langs"] != site_languages:
    if store_has_all:
        problems.append(f"press page lists {len(now['langs'])} languages, the website and the App Store have {len(site_languages)}")
        rows, line = [], "LANGUAGES = ["
        for name in site_languages:
            piece = f'"{name}", '
            if len(line) + len(piece) > 118:
                rows.append(line.rstrip()); line = "             "
            line += piece
        rows.append(line.rstrip(", ") + "]")
        new = re.sub(r"^LANGUAGES = \[.*?\]", lambda m: "\n".join(rows), new, flags=re.M | re.S)
    else:
        notes.append(f"the website has {len(site_languages)} languages, the App Store shows {store_languages} and the press "
                     f"page lists {len(now['langs'])}: the press list grows once the iPhone release with them is out")

press = read("press.html")
built = re.search(r"iPhone and iPad app ([\d.]+) \(([^)]+)\)\. Mac app ([\d.]+) \(([^)]+)\)", press)
if not built or (built.group(1), built.group(2)) != now["ios"] or (built.group(3), built.group(4)) != now["mac"]:
    problems.append("press.html was not rebuilt after its facts changed")

if FIX and (new != src or any("not rebuilt" in p for p in problems)):
    today = long_date(datetime.date.today())
    new = re.sub(r'^CHECKED = "[^"]+"', f'CHECKED = "{today}"', new, flags=re.M)
    with open(PRESS_SCRIPT, "w", encoding="utf-8") as f:
        f.write(new)
    subprocess.run([sys.executable, PRESS_SCRIPT], check=True, cwd=ROOT, stdout=subprocess.DEVNULL)
    fixed = [p for p in problems if p.startswith("press")]
    problems = [p for p in problems if p not in fixed]
    print("FIXED (not committed, check `git diff`):", *fixed, sep="\n  ")

print(f"Mac app {mac_version} ({mac_date}) · iPhone app {ios_version} ({ios_date}) · "
      f"{len(site_languages)} website languages, {store_languages} on the App Store")
if notes:
    print("NOTES:", *notes, sep="\n  ")
if problems:
    print("STALE:", *problems, sep="\n  ")
    sys.exit(1)
print("Everything on the website matches the releases.")
