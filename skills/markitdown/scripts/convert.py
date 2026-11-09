#!/usr/bin/env python3
"""
Helper script for Microsoft MarkItDown conversions.
Compatible with uv:
    uv run convert.py input.pdf [output.md]
    uv run convert.py --dir ./input_folder --out-dir ./markdown_output
"""

import argparse
import os
import sys
from pathlib import Path
from markitdown import MarkItDown

SUPPORTED_EXTS = {
    ".pdf", ".docx", ".pptx", ".xlsx", ".xls", ".csv",
    ".html", ".htm", ".json", ".xml", ".epub",
    ".png", ".jpg", ".jpeg", ".wav", ".mp3", ".zip"
}

def convert_single(md: MarkItDown, input_path: Path, output_path: Path | None = None) -> bool:
    try:
        result = md.convert(str(input_path))
        content = getattr(result, "markdown", getattr(result, "text_content", str(result)))
        
        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(content, encoding="utf-8")
            print(f"[OK] {input_path} -> {output_path}")
        else:
            print(content)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to convert {input_path}: {e}", file=sys.stderr)
        return False

def convert_directory(md: MarkItDown, dir_path: Path, out_dir: Path | None = None, recursive: bool = False):
    pattern = "**/*" if recursive else "*"
    files = [p for p in dir_path.glob(pattern) if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS]
    
    if not files:
        print(f"No supported files found in {dir_path}")
        return

    print(f"Found {len(files)} files to convert...")
    success_count = 0
    for file_path in files:
        if out_dir:
            rel = file_path.relative_to(dir_path) if recursive else file_path.name
            out_file = out_dir / Path(rel).with_suffix(".md")
        else:
            out_file = file_path.with_suffix(".md")
        
        if convert_single(md, file_path, out_file):
            success_count += 1
            
    print(f"Completed: {success_count}/{len(files)} converted successfully.")

def main():
    parser = argparse.ArgumentParser(description="Convert files to Markdown using Microsoft MarkItDown")
    parser.add_argument("input", nargs="?", help="Input file path or directory (when using --dir)")
    parser.add_argument("output", nargs="?", help="Output file path (optional)")
    parser.add_argument("--dir", action="store_true", help="Treat input as a directory of files")
    parser.add_argument("--out-dir", type=str, help="Destination directory for converted Markdown files")
    parser.add_argument("--recursive", "-r", action="store_true", help="Recursively convert files in subdirectories")
    
    args = parser.parse_args()

    if not args.input:
        parser.print_help()
        sys.exit(1)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Path '{input_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    md = MarkItDown()

    if args.dir or input_path.is_dir():
        out_dir = Path(args.out_dir) if args.out_dir else input_path
        convert_directory(md, input_path, out_dir=out_dir, recursive=args.recursive)
    else:
        out_path = Path(args.output) if args.output else (input_path.with_suffix(".md") if args.output is not None else None)
        convert_single(md, input_path, out_path)

if __name__ == "__main__":
    main()
