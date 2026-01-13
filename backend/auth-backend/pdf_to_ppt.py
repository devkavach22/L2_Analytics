import sys
from pdf2pptx import Converter

if len(sys.argv) < 3:
    print("Usage: convert_pdf_to_ppt.py input.pdf output.pptx")
    sys.exit(1)

input_pdf = sys.argv[1]
output_ppt = sys.argv[2]

try:
    cv = Converter(input_pdf)
    cv.convert(output_ppt)
    cv.close()
    print("Conversion successful")
except Exception as e:
    print(str(e))
    sys.exit(1)
