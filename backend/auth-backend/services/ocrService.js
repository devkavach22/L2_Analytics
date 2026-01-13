import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export const sendToOCR = async (filePath) => {
    try {
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath));

        const response = await axios.post(
            "http://127.0.0.1:5000/ocr",
            form,
            { headers: form.getHeaders() }
        );

        return response.data.text;
    } catch (err) {
        console.error("OCR error:", err.message);
        return "";
    }
};
