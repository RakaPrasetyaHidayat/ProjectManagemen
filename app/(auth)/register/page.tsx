"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, message } from "antd";
import { isAxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const successMessage = await register(values.username.trim(), values.password);
      setSuccess(successMessage);
      message.success({ content: successMessage, duration: 5 });
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      const apiMessage =
        isAxiosError(err) && err.response?.data?.message ? String(err.response.data.message) : undefined;
      const messageText =
        apiMessage || (err instanceof Error ? err.message : "Registration failed. Please try again.");
      setError(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(12px, 5vw, 24px)", background: "var(--background)" }}>
      <div className="glass-card animate-in" style={{ width: "100%", maxWidth: 400, padding: "clamp(24px, 8vw, 40px) clamp(20px, 6vw, 32px)" }}>
        <div style={{ marginBottom: "clamp(20px, 8vw, 32px)" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(20px, 6vw, 24px)", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.02em" }}>Create account</h1>
          <p style={{ margin: "clamp(6px, 2vw, 8px) 0 0", color: "var(--muted-foreground)", fontSize: "clamp(13px, 3vw, 14px)" }}>Join TASCA to manage your projects.</p>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: "clamp(16px, 4vw, 24px)", borderRadius: 8 }} />}
        {success && <Alert type="success" message={success} showIcon style={{ marginBottom: "clamp(16px, 4vw, 24px)", borderRadius: 8 }} />}

        <Form name="register" layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item 
            name="username" 
            label={<span className="text-muted text-small font-medium">Username</span>} 
            rules={[{ required: true, message: "Please enter your username" }]}
          > 
            <Input size="large" placeholder="Jhon Doe" autoComplete="username" autoFocus />
          </Form.Item>

          <Form.Item 
            name="password" 
            label={<span className="text-muted text-small font-medium">Password</span>} 
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 6, message: "Password must be at least 6 characters" }
            ]}
          > 
            <Input.Password size="large" placeholder="••••••••" autoComplete="new-password" />
          </Form.Item>

          <Form.Item style={{ marginTop: "clamp(20px, 8vw, 32px)", marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={submitting}
              style={{ height: "clamp(36px, 10vw, 44px)" }}
            >
              Register
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: "clamp(16px, 6vw, 24px)", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "clamp(13px, 3vw, 14px)", color: "var(--muted-foreground)" }}>
            Already have an account? <Link href="/login" style={{ color: "var(--foreground)", fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
