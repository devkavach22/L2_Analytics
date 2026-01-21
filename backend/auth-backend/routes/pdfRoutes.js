import express from "express";
import upload from "../middlewares/upload.js";
import {auth} from "../middlewares/auth.js";
import { mergePdf } from "../controllers/pdf/mergePdf.js";
import {pdfToWord} from "../controllers/pdf/pdfToWord.js";
import {pdfToExcel} from "../controllers/pdf/pdfToExcel.js";
import {splitPdf} from "../controllers/pdf/splitPdf.js";
import {watermarkPdf} from "../controllers/pdf/watermarkPdf.js";
import {imageToPdf} from "../controllers/pdf/imageToPdf.js";
import {compressPdf} from "../controllers/pdf/compressPdf.js";
import {pdfSignature} from "../controllers/pdf/pdfSignature.js";
import {pdfToImage} from "../controllers/pdf/pdfToImage.js";
import {pdfToPpt} from "../controllers/pdf/pdfToPpt.js";
import {protectPdf} from "../controllers/pdf/protectPdf.js";
import {wordToPdf} from "../controllers/pdf/wordToPdf.js";
import {unlockPdf} from "../controllers/pdf/unlockPdf.js";
import {rotatePdf} from "../controllers/pdf/rotatePdf.js";
import { downloadGeneratedFile } from "../controllers/pdf/downloadGeneratedFile.js";
import { optimizePdf } from "../controllers/pdf/optimizePdf.js";
import  { editPdf }  from "../controllers/pdf/editPdf.js";
// import { Router } from "express";
// import { split } from "postcss/lib/list";

const router = express.Router();

router.post("/merge-pdf",auth,upload.array("files",10),mergePdf);

router.post("/pdf-to-word",auth,upload.single("file"),pdfToWord);

router.post("/pdf-to-excel",auth,upload.single("file"),pdfToExcel);

router.post(
    "/pdf-sign",
    auth,
    upload.fields([
        { name: "pdf", maxCount: 1 },
        { name: "signature", maxCount: 1 }
    ]),
    pdfSignature
);


router.post("/pdf-to-image",auth,upload.single("file"),pdfToImage);

router.post("/image-to-pdf",auth,upload.array("files",20),imageToPdf);

router.post("/split-pdf",auth,upload.single("file"),splitPdf);

router.post("/compress-pdf",auth,upload.array("files",20),compressPdf);

router.post("/pdf-to-ppt",auth,upload.single("file"),pdfToPpt);

router.post("/watermark-pdf",auth,upload.single("file"),watermarkPdf);

router.post("/protect-pdf",auth,upload.single("file"),protectPdf);

router.post("/word-to-pdf",auth,upload.array("files",20),wordToPdf);

router.post("/unlock-pdf",auth,upload.single("file"),unlockPdf);

router.post("/rotate-pdf",auth,upload.single("file"),rotatePdf);

router.post("/optimize-pdf",auth,upload.single("file"),optimizePdf);

router.post("/edit-pdf",auth,upload.single("file"),editPdf);

router.get("/download/:filename",auth,downloadGeneratedFile);

export default router;