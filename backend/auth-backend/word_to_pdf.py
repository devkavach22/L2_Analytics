import sys
import os
from docx2pdf import convert

if len(sys.argv) < 3:
    print("Usage: python word_to_pdf.py <input.docx> <output_dir>")
    sys.exit(1)

input_file = sys.argv[1]
output_dir = sys.argv[2]

if not os.path.exists(input_file):
    print("Input file not found:", input_file)
    sys.exit(1)

try:
    convert(input_file, output_dir)
    print("Conversion OK")
except Exception as e:
    print("Conversion failed:", e)
    sys.exit(1)
