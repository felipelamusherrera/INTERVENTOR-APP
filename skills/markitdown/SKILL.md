---
name: markitdown
description: >-
  Converts documents and files of various formats (PDF, Word .docx, PowerPoint .pptx,
  Excel .xlsx/.xls, CSV, HTML, JSON, XML, images, audio, ZIP) into clean Markdown using
  Microsoft MarkItDown. Use this skill whenever the user wants to convert, extract, or parse
  content from documents into Markdown, extract tables or text from PDFs/Office files, or
  preprocess files for LLM analysis.
license: MIT
metadata:
  version: v1
  publisher: microsoft
  repository: https://github.com/microsoft/markitdown
---

# Microsoft MarkItDown Skill

`markitdown` is a utility created by Microsoft designed to convert various file formats into clean, structured Markdown suitable for text analysis and Large Language Model (LLM) pipelines.

Repository: [https://github.com/microsoft/markitdown](https://github.com/microsoft/markitdown)

---

## 1. Environment & Prerequisites

MarkItDown is installed globally via `uv tool` with all format extras:

*   **Binary / CLI**: `markitdown` (located in `~/.local/bin/markitdown.exe` on Windows).
*   **Alternative Execution via `uv`**:
    ```powershell
    uv tool run markitdown <file>
    # or with inline script:
    uv run --with 'markitdown[all]' python -m markitdown <file>
    ```
*   **Verification**:
    ```powershell
    markitdown --version
    # or
    uv tool run markitdown --version
    ```

If the command is not recognized, temporarily ensure `~/.local/bin` is in PATH:
```powershell
$env:PATH = "$HOME\.local\bin;" + $env:PATH
```

---

## 2. Supported Formats

| Category | File Extensions | Extracted Content |
| :--- | :--- | :--- |
| **Documents** | `.pdf`, `.docx`, `.epub` | Headings, paragraphs, tables, lists, text |
| **Presentations** | `.pptx` | Slide titles, bullet points, text boxes, tables |
| **Spreadsheets** | `.xlsx`, `.xls`, `.csv` | Tabular data converted into Markdown tables |
| **Web & Data** | `.html`, `.json`, `.xml` | Formatted content, structured data representation |
| **Images** | `.jpg`, `.jpeg`, `.png` | EXIF metadata + OCR (via plugins/models if enabled) |
| **Audio** | `.mp3`, `.wav` | Metadata + speech-to-text transcription |
| **Archives** | `.zip` | Iterates and converts supported files inside the archive |

---

## 3. CLI Usage

### Basic Conversion
```powershell
# Output directly to stdout
markitdown "path/to/document.pdf"

# Save to an output Markdown file (-o flag)
markitdown "path/to/document.pdf" -o "path/to/output.md"

# Using redirection
markitdown "path/to/spreadsheet.xlsx" > "output.md"
```

### Conversion from Standard Input
```powershell
Get-Content -Raw "document.html" | markitdown -x .html -o "document.md"
```

### Command Options
*   `-o, --output <FILE>`: Specify destination markdown file path.
*   `-x, --extension <EXT>`: Provide a file extension hint when reading from standard input (e.g. `-x .pdf`).
*   `-m, --mime-type <MIME>`: Specify MIME type hint.
*   `-c, --charset <CHARSET>`: Specify character encoding (e.g. `UTF-8`).
*   `--keep-data-uris`: Preserve inline base64 images (by default they are truncated).

---

## 4. Python API Usage

To use MarkItDown programmatically in Python scripts or interactive sessions:

### Basic Python Script
```python
from markitdown import MarkItDown

md = MarkItDown()
result = md.convert("document.pdf")

# Access the generated Markdown text
print(result.markdown_content if hasattr(result, 'markdown_content') else result.text_content)
```

### Running with `uv` (Zero-Config)
```powershell
uv run --with "markitdown[all]" python -c "from markitdown import MarkItDown; md = MarkItDown(); print(md.convert('report.docx').text_content)"
```

---

## 5. Common Workflows

### Converting Presentation Slides to Markdown for Analysis
```powershell
markitdown "presentation.pptx" -o "presentation_notes.md"
```

### Parsing Excel Tables into Markdown
```powershell
markitdown "financial_data.xlsx" -o "financial_data.md"
```

### Converting PDFs to Markdown
```powershell
markitdown "whitepaper.pdf" -o "whitepaper.md"
```

### Batch Conversion in PowerShell
To convert all `.docx` or `.pdf` files in a directory to `.md`:
```powershell
Get-ChildItem -Path ".\docs" -Filter "*.pdf" | ForEach-Object {
    $outFile = [System.IO.Path]::ChangeExtension($_.FullName, ".md")
    Write-Host "Converting $($_.Name) -> $(Split-Path $outFile -Leaf)..."
    markitdown $_.FullName -o $outFile
}
```
