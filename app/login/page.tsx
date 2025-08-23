"use client";

import React, { useState } from "react";
import Cookies from "js-cookie";
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("ورود ناموفق بود");

      const data = await res.json();

      Cookies.set("token", data.data.findAdmin.token, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      if (data.data.findAdmin.role === "super_admin") {
        window.location.href = "/super-dashboard";
      } else {
        window.location.href = "dashboard";
      }
    } catch (err: any) {
      setError(err.message || "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-100 via-white to-purple-100 px-4"
      dir="rtl"
    >
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md border border-indigo-100">
        <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-8 tracking-tight font-vazir">
          ورود مدیر فروشگاه
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-6"
        >
          {/* Username */}
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-indigo-600 font-vazir">
              نام کاربری
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثلاً admin"
              className="w-full border border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-gray-800 font-vazir shadow-sm outline-none transition-all"
              autoComplete="username"
            />
            <div className="absolute left-3 top-[2.3rem] text-indigo-400">
              <i className="fas fa-user"></i>
            </div>
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-indigo-600 font-vazir">
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full border border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-gray-800 font-vazir shadow-sm outline-none transition-all"
              autoComplete="current-password"
            />
            <div className="absolute left-3 top-[2.3rem] text-indigo-400">
              <i className="fas fa-lock"></i>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm text-center font-medium font-vazir">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 font-vazir shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                در حال ورود...
              </span>
            ) : (
              "ورود به پنل"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
