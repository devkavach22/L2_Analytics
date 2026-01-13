import sys
import os
import subprocess
import tempfile
import shutil
import platform

# ---------------------------
# 1️⃣ Parse inputs
# ---------------------------
if len(sys.argv) < 4:
    print("Usage: python optimize_pdf.py <input.pdf> <output.pdf> <options_comma_separated>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]
options = [opt.lower() for opt in sys.argv[3].split(",")]

if not os.path.exists(input_path):
    print(f"Input file does not exist: {input_path}")
    sys.exit(1)

# ---------------------------
# 2️⃣ Presets for image compression
# ---------------------------
PRESETS = {
    "extreme": {"gs_quality": "/screen", "dpi": "72", "jpeg": "40"},
    "low": {"gs_quality": "/ebook", "dpi": "120", "jpeg": "60"},
    "recommended": {"gs_quality": "/printer", "dpi": "150", "jpeg": "75"},
    "high": {"gs_quality": "/prepress", "dpi": "300", "jpeg": "85"},
}

level = "recommended"
for opt in options:
    if opt.startswith("level:"):
        lvl = opt.split(":")[1]
        if lvl in PRESETS:
            level = lvl

preset = PRESETS[level]

# ---------------------------
# 3️⃣ Temporary file
# ---------------------------
temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False).name
shutil.copy(input_path, temp_file)

# ---------------------------
# 4️⃣ Detect Ghostscript
# ---------------------------
def find_ghostscript():
    if platform.system() == "Windows":
        for exe in ["gswin64c.exe", "gswin32c.exe"]:
            path = shutil.which(exe)
            if path:
                return path
    else:
        path = shutil.which("gs")
        if path:
            return path
    return None

gs_executable = find_ghostscript()
if not gs_executable:
    print("Ghostscript not found. Install Ghostscript and add to PATH.")
    sys.exit(1)

# ---------------------------
# 5️⃣ Image Compression / PDF/A
# ---------------------------
if "image_compression" in options or "archival_(pdf/a)" in options:
    gs_cmd = [
        gs_executable,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dNOPAUSE",
        "-dBATCH",
        "-dQUIET",
        f"-sOutputFile={temp_file}"
    ]

    if "image_compression" in options:
        gs_cmd += [
            f"-dPDFSETTINGS={preset['gs_quality']}",
            f"-dColorImageDownsampleType=/Bicubic",
            f"-dColorImageResolution={preset['dpi']}",
            f"-dGrayImageDownsampleType=/Bicubic",
            f"-dGrayImageResolution={preset['dpi']}",
            f"-dMonoImageDownsampleType=/Subsample",
            f"-dMonoImageResolution={preset['dpi']}",
            f"-dJPEGQ={preset['jpeg']}"
        ]

    if "archival_(pdf/a)" in options:
        gs_cmd += ["-dPDFA", "-dPDFACompatibilityPolicy=1"]

    gs_cmd.append(temp_file)

    try:
        subprocess.run(gs_cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print("Ghostscript failed:", e.stderr)
        if os.path.exists(temp_file):
            os.remove(temp_file)
        sys.exit(1)

# ---------------------------
# 6️⃣ Detect QPDF
# ---------------------------
def find_qpdf():
    exe = "qpdf.exe" if platform.system() == "Windows" else "qpdf"
    path = shutil.which(exe)
    return path

qpdf_executable = find_qpdf()
if not qpdf_executable:
    print("QPDF not found. Install QPDF and add to PATH.")
    sys.exit(1)

# ---------------------------
# 7️⃣ QPDF Optimization
# ---------------------------
qpdf_cmd = [
    qpdf_executable,
    "--linearize",
    "--stream-data=compress",
    "--object-streams=generate",
    temp_file,
    output_path
]

# Add options
if "remove_metadata" in options:
    qpdf_cmd.insert(1, "--remove-xmp")
if "remove_unused_objects" in options:
    qpdf_cmd.insert(1, "--remove-unused")
if "flatten_forms" in options:
    qpdf_cmd.insert(1, "--flatten-forms")
if "remove_bookmarks" in options:
    qpdf_cmd.insert(1, "--remove-bookmarks")
if "optimize_transparency" in options:
    qpdf_cmd.insert(1, "--optimize-images")
if "secure_optimization" in options:
    # Example owner password
    qpdf_cmd.insert(1, "--encrypt")
    qpdf_cmd.insert(2, "")
    qpdf_cmd.insert(3, "owner123")
    qpdf_cmd.insert(4, "128")
    qpdf_cmd.insert(5, "--")

try:
    subprocess.run(qpdf_cmd, check=True, capture_output=True, text=True)
except subprocess.CalledProcessError as e:
    print("QPDF failed:", e.stderr)
    if os.path.exists(temp_file):
        os.remove(temp_file)
    sys.exit(1)

# ---------------------------
# 8️⃣ Cleanup
# ---------------------------
if os.path.exists(temp_file):
    os.remove(temp_file)

print(f"Optimization OK | Options={options} | Output={output_path}")
