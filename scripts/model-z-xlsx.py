"""Konwersja modelu kompetencji (XLSX od organizatora) do src/data/model-kompetencji.json.

Użycie (tylko biblioteka standardowa Pythona 3.10+):
    python scripts/model-z-xlsx.py "<ścieżka>/Model_kompetencji.xlsx"

Arkusz 1 = spis 14 kompetencji, arkusze 2–15 = wskaźniki behawioralne
z opisami zachowań na 5 poziomach (kolumny B–F).
"""

import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
RID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

# Stałe identyfikatory (ASCII) – kolejność jak w arkuszu „Model kompetencji”.
IDS = [
    "rzetelnosc",
    "komunikacja",
    "wykorzystywanie-wiedzy",
    "organizacja-pracy",
    "kreatywnosc",
    "wspolpraca",
    "myslenie-analityczne",
    "negocjowanie",
    "wystapienia-publiczne",
    "orientacja-na-klienta",
    "sytuacje-kryzysowe",
    "zarzadzanie-strategiczne",
    "zarzadzanie-ludzmi",
    "podejmowanie-decyzji",
]

POZIOMY = [
    {"id": 1, "nazwa": "Znacznie poniżej oczekiwań", "punkty": 1},
    {"id": 2, "nazwa": "Poniżej oczekiwań", "punkty": 3},
    {"id": 3, "nazwa": "Na poziomie oczekiwań", "punkty": 5},
    {"id": 4, "nazwa": "Powyżej oczekiwań", "punkty": 7},
    {"id": 5, "nazwa": "Znacznie powyżej oczekiwań", "punkty": 9},
]


def clean(text: str) -> str:
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


def sentence_case(name: str) -> str:
    low = name.lower()
    return low[:1].upper() + low[1:]


def read_sheets(path: Path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.iter("{%s}t" % NS["m"])))
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    relmap = {r.get("Id"): r.get("Target") for r in rels}
    sheets = []
    for sh in wb.find("m:sheets", NS):
        target = relmap[sh.get(RID)].lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        ws = ET.fromstring(z.read(target))
        rows = []
        for row in ws.find("m:sheetData", NS):
            cells = {}
            for c in row.findall("m:c", NS):
                v = c.find("m:v", NS)
                t = c.get("t")
                if t == "s" and v is not None:
                    val = shared[int(v.text)]
                elif t == "inlineStr":
                    val = "".join(x.text or "" for x in c.iter("{%s}t" % NS["m"]))
                else:
                    val = v.text if v is not None else None
                if val not in (None, ""):
                    col = "".join(ch for ch in c.get("r") if ch.isalpha())
                    cells[col] = clean(val)
            if cells:
                rows.append(cells)
        sheets.append((sh.get("name"), rows))
    return sheets


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    src = Path(sys.argv[1])
    sheets = read_sheets(src)
    summary_rows = sheets[0][1]
    wskazowki = [r["A"] for r in summary_rows[2:5]]
    spis = [r for r in summary_rows if r.get("A", "").isdigit()]
    assert len(spis) == 14 == len(sheets) - 1, "oczekiwano 14 kompetencji"

    kompetencje = []
    for i, (lp_row, (sheet_name, rows)) in enumerate(zip(spis, sheets[1:])):
        nazwa = rows[0]["A"]
        assert nazwa == lp_row["B"], f"niezgodna nazwa: {sheet_name}"
        header = rows[1]
        assert header["A"] == "Wskaźnik behawioralny" and header["D"] == "Na poziomie oczekiwań"
        wskazniki = []
        for j, r in enumerate(rows[2:], start=1):
            wskazniki.append(
                {
                    "id": f"{IDS[i]}-{j}",
                    "opis": r["A"],
                    "zachowania": {str(k): r[col] for k, col in zip(range(1, 6), "BCDEF")},
                }
            )
        assert len(wskazniki) == int(lp_row["C"]), f"liczba wskaźników: {sheet_name}"
        kompetencje.append(
            {
                "id": IDS[i],
                "lp": int(lp_row["A"]),
                "nazwa": sentence_case(nazwa),
                "wskazniki": wskazniki,
            }
        )

    out = {
        "zrodlo": "Model kompetencji – materiał organizatora zadania „Kompas kompetencji” (Ministerstwo Cyfryzacji), HackNation 2026, plik Model_kompetencji.xlsx",
        "poziomy": POZIOMY,
        "wskazowki": wskazowki,
        "kompetencje": kompetencje,
    }
    dest = Path(__file__).resolve().parent.parent / "src" / "data" / "model-kompetencji.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(len(k["wskazniki"]) for k in kompetencje)
    print(f"Zapisano {dest} – {len(kompetencje)} kompetencji, {total} wskaźników")


if __name__ == "__main__":
    main()
