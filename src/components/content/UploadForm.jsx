import { useState } from "react";
import axios from "axios";
import { getApiUrl } from '../../config/api';

export default function UploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [icon, setIcon] = useState(null);
  const [loading, setLoading] = useState(false);

  // استخدام API configuration
  const STRAPI_URL = getApiUrl().replace('/api', '');
  const API_TOKEN = "PUT_YOUR_API_TOKEN_HERE"; // خلي بالك لازم يكون معاه صلاحيات Create & Upload

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. رفع الصور لو موجودة
      let uploadedImageId = null;
      let uploadedIconId = null;

      if (image) {
        const formData = new FormData();
        formData.append("files", image);

        const uploadRes = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedImageId = uploadRes.data[0].id;
      }

      if (icon) {
        const formData = new FormData();
        formData.append("files", icon);

        const uploadRes = await axios.post(`${STRAPI_URL}/api/upload`, formData, {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedIconId = uploadRes.data[0].id;
      }

      // 2. حفظ البيانات مع الصور
      const serviceRes = await axios.post(
        `${STRAPI_URL}/api/services`,
        {
          data: {
            ServiceTitle: title,
            ServiceDescription: description,
            ServiceImages: uploadedImageId ? [uploadedImageId] : [],
            ServiceIcon: uploadedIconId ? uploadedIconId : null,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          },
        }
      );

      alert("تم الحفظ بنجاح ✅");
      console.log(serviceRes.data);
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء الرفع ❌");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto" }}>
      <h2>اضافة خدمة جديدة</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Service Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Service Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Service Image</label>
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        </div>

        <div>
          <label>Service Icon</label>
          <input type="file" onChange={(e) => setIcon(e.target.files[0])} />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "جارى الحفظ..." : "حفظ"}
        </button>
      </form>
    </div>
  );
}
