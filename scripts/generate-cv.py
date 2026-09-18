"""Convert the author's Lattes export with a versioned profile and visual theme.

The XML/ZIP stays outside the repository. Only the reviewed PDF is served by Astro.
Conversion reports and editable RenderCV YAML stay in the ignored build directory.
"""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

import yaml


ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Exportação XML ou ZIP do Lattes")
    parser.add_argument("--output", type=Path, default=ROOT / "public/files/cv-diego-volpatto-2026.pdf")
    args = parser.parse_args()
    source = args.input.resolve(strict=True)
    output = args.output.resolve()
    if source == output:
        parser.error("O arquivo de saída deve ser diferente da exportação original.")

    build = ROOT / ".cv-build"
    build.mkdir(exist_ok=True)
    pdf = build / "cv.pdf"
    executables = Path(sys.executable).parent
    subprocess.run([
        str(executables / "lattes2pdf"), "render", str(source),
        "--profile", str(ROOT / "cv/profile.yaml"),
        "--theme", str(ROOT / "cv/design.yaml"),
        "--output", str(pdf), "--force",
    ], check=True)

    editable = pdf.with_suffix(".yaml")
    document = yaml.safe_load(editable.read_text(encoding="utf-8"))
    header = yaml.safe_load((ROOT / "cv/header.yaml").read_text(encoding="utf-8"))
    if document["cv"]["name"] != header["name"]:
        raise ValueError("A exportação pertence a outro autor; o PDF público não foi alterado.")
    # Recover course names with lattes2pdf's own escaping, without displaying raw
    # XML labels/flags that its generic "details" option would add to every section.
    teaching_yaml = build / "teaching.yaml"
    subprocess.run([
        str(executables / "lattes2pdf"), "export", str(source),
        "--include", "activities.teaching", "--hide-field", "contact", "summary",
        "--output", str(teaching_yaml), "--force",
    ], check=True)
    teaching = yaml.safe_load(teaching_yaml.read_text(encoding="utf-8"))
    courses = teaching["cv"]["sections"].get("Ensino", [])
    formatted_courses = []
    for entry in courses:
        updated = {key: value for key, value in entry.items() if key != "highlights"}
        disciplines = []
        for detail in entry.get("highlights", []):
            label, _, value = detail.partition(": ")
            if "Nome instituicao" in label:
                updated["name"] = value
            elif label == "Nome curso":
                updated["summary"] = value
            elif "Disciplina" in label:
                # A spaced ASCII hyphen becomes a new Markdown bullet in RenderCV.
                disciplines.append(value.replace(" - ", ": "))
        if disciplines:
            updated["highlights"] = disciplines
        formatted_courses.append(updated)
    if formatted_courses:
        document["cv"]["sections"]["Ensino"] = formatted_courses

    # Some Lattes line titles include their description in the same field.
    # Separate typography without changing the wording or meaning.
    for entry in document["cv"]["sections"].get("Linhas de pesquisa", []):
        title, separator, description = entry["name"].partition(". Descrição: ")
        if separator:
            entry["name"] = title
            entry["summary"] = description

    document["cv"].update(header)
    editable.write_text(yaml.safe_dump(document, allow_unicode=True, sort_keys=False), encoding="utf-8")
    subprocess.run([
        str(executables / "rendercv"), "render", str(editable),
        "--pdf-path", str(pdf), "--output-folder", str(build / "rendercv"),
        "--dont-generate-markdown", "--dont-generate-png", "--quiet",
    ], check=True)
    if not pdf.read_bytes().startswith(b"%PDF-"):
        raise ValueError("A conversão não gerou um PDF válido.")
    provenance = {
        "input_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "pdf_sha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
        "editorial_adjustments": [
            "Public contact header from cv/header.yaml",
            "Teaching institution/course/discipline details from lattes2pdf export",
            "Research line descriptions separated from titles; wording preserved",
        ],
        "section_counts": {key: len(value) for key, value in document["cv"]["sections"].items()},
    }
    (build / "provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(pdf, output)
    print(f"PDF gerado: {output}")
    print(f"YAML editável e relatório de conversão: {build}")


if __name__ == "__main__":
    main()
