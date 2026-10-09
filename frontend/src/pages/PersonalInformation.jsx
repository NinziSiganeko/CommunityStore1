import { useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function PersonalInformation() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "Alex Rivera",
        email: "alex.rivera@student.ac.za",
        phone: "+27 82 123 4567",
        studentId: "STU2024-0891",
        campus: "Main Campus",
        bio: "Graduate student. Selling textbooks, electronics and study gear.",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        // later: call API
        alert("Profile updated successfully");
        navigate(-1);
    };

    return (
        <div className="cs-page">
            {/* Header */}
            <header className="cs-header">
                <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
                    <ArrowLeft size={22} />
                </button>
                <h1 className="title">Personal Information</h1>
                <div style={{ width: 34 }} />
            </header>

            <div className="personal-body">
                {/* Avatar */}
                <div className="personal-avatar-section">
                    <div className="personal-avatar-wrap">
                        <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
                            alt="Profile"
                            className="personal-avatar"
                        />
                        <button className="avatar-edit-btn" aria-label="Change photo">
                            <Camera size={16} />
                        </button>
                    </div>
                    <p className="avatar-hint">Tap to change photo</p>
                </div>

                {/* Form */}
                <div className="personal-form">
                    <label className="field-label">Full Name</label>
                    <input
                        className="field-input"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                    />

                    <label className="field-label">Email</label>
                    <input
                        className="field-input"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                    />

                    <label className="field-label">Phone</label>
                    <input
                        className="field-input"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                    />

                    <label className="field-label">Student ID</label>
                    <input
                        className="field-input"
                        name="studentId"
                        value={form.studentId}
                        onChange={handleChange}
                    />

                    <label className="field-label">Campus</label>
                    <input
                        className="field-input"
                        name="campus"
                        value={form.campus}
                        onChange={handleChange}
                    />

                    <label className="field-label">Bio</label>
                    <textarea
                        className="field-input field-textarea"
                        name="bio"
                        rows={3}
                        value={form.bio}
                        onChange={handleChange}
                    />
                </div>

                <button className="btn-primary personal-save-btn" onClick={handleSave}>
                    Save Changes
                </button>
            </div>

            <BottomNav />
        </div>
    );
}