# Frontend: Profile Image (Personal Settings & Dashboard)

Use these React components with your existing auth (JWT, user state).  
Base URL: `process.env.REACT_APP_API_URL` (e.g. `http://localhost:4000`).

---

## 1. Personal Settings Page

Create or update your Personal Settings page with profile image preview, file input, and save that sends **FormData** to `PUT /api/users/update`.

```jsx
// PersonalSettings.jsx (or Settings.jsx)
import { useState, useRef } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function PersonalSettings({ user, setUser }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phoneNumber ?? "");
  const [preview, setPreview] = useState(
    user?.image ? `${API_URL}${user.image}` : null
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMessage({ type: "error", text: "Only jpg, jpeg, png, webp allowed." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Max size 5MB." });
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      if (selectedFile) formData.append("image", selectedFile);

      const { data } = await axios.put(`${API_URL}/api/users/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = data?.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSelectedFile(null);
        setPreview(updatedUser.image ? `${API_URL}${updatedUser.image}` : null);
        setMessage({ type: "success", text: "Profile updated successfully." });
      }
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || "Update failed.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="personal-settings">
      <h2>Personal Settings</h2>
      <form onSubmit={handleSubmit}>
        {/* Profile image preview + upload */}
        <div className="profile-image-section">
          <div className="preview-wrap">
            {preview ? (
              <img
                src={preview}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                No image
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
          >
            Choose image
          </button>
          <span className="text-sm text-gray-500">JPG, PNG, WebP. Max 5MB.</span>
        </div>

        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Phone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {message.text && (
          <p className={message.type === "error" ? "text-red-600" : "text-green-600"}>
            {message.text}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
```

---

## 2. After Successful Upload

- **Update local user state:** `setUser(updatedUser)` (as in the example above).
- **Persist in localStorage:** `localStorage.setItem("user", JSON.stringify(updatedUser))`.
- Dashboard (and any component using the same `user` state/context) will show the new image immediately if you pass `user` from a single source (e.g. context or lifted state).

---

## 3. Dashboard Header – Profile Image

Use the same `user` object. Prefer `user.image` (from `PUT /api/users/update`); fallback to `user.imageUrl` or a default avatar.

```jsx
// In your Dashboard header (or Navbar)
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Prefer image (from /api/users/update), then imageUrl, then default
const imageSrc = user?.image
  ? `${API_URL}${user.image}`
  : user?.imageUrl
  ? `${API_URL}${user.imageUrl}`
  : null;

<img
  src={imageSrc || "/default-avatar.png"}
  alt="Profile"
  className="w-10 h-10 rounded-full object-cover"
  onError={(e) => {
    e.target.src = "/default-avatar.png";
  }}
/>
```

Optional default avatar: add a `public/default-avatar.png` or use a data URI / placeholder.

---

## 4. API Summary

| Method | Endpoint              | Auth   | Body                    |
|--------|------------------------|--------|-------------------------|
| PUT    | `/api/users/update`    | Bearer | multipart: name, email, phone, image (file) |

- **Image:** optional; allowed types: jpg, jpeg, png, webp; max 5MB.
- **Response:** `{ success: true, message, data: { user } }`. Use `data.user` (includes `image`, `name`, `email`, `phoneNumber`, etc.) to update state and localStorage.
