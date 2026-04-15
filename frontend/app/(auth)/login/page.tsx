"use client";

import { useEffect, useState } from "react";
import { Form, Input, Button, Alert, Skeleton, message } from "antd";
import { isAxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const onFinish = async (values: { username: string; password: string }) => {
    setError("");
    setSubmitting(true);
    try {
      const successMessage = await login(values.username.trim(), values.password);
      setError("");
      message.success({ content: successMessage, duration: 2 });
      router.replace("/dashboard");
    } catch (err: unknown) {
      const apiMessage =
        isAxiosError(err) && err.response?.data?.message ? String(err.response.data.message) : undefined;
      const messageText =
        apiMessage || (err instanceof Error ? err.message : "Login failed. Please try again.");
      setError(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
        <div style={{ width: "320px" }}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(12px, 5vw, 24px)", background: "var(--background)" }}>
      <div className="glass-card animate-in" style={{ width: "100%", maxWidth: 400, padding: "clamp(24px, 8vw, 40px) clamp(20px, 6vw, 32px)" }}>
        <div style={{ marginBottom: "clamp(20px, 8vw, 32px)" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(20px, 6vw, 24px)", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.02em" }}>Sign in</h1>
          <p style={{ margin: "clamp(6px, 2vw, 8px) 0 0", color: "var(--muted-foreground)", fontSize: "clamp(13px, 3vw, 14px)" }}>Welcome back to TASCA.</p>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: "clamp(16px, 4vw, 24px)", borderRadius: 8 }} />}

        <Form name="login" layout="vertical" onFinish={onFinish} requiredMark={false}>
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
            rules={[{ required: true, message: "Please enter your password" }]}
          > 
            <Input.Password size="large" placeholder="••••••••" autoComplete="current-password" />
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
              Continue
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: "clamp(16px, 6vw, 24px)", textAlign: "center" }}>
          <p style={{ marginBottom: "clamp(12px, 3vw, 16px)", fontSize: "clamp(13px, 3vw, 14px)", color: "var(--muted-foreground)" }}>
            Don't have an account? <Link href="/register" style={{ color: "var(--foreground)", fontWeight: 500 }}>Sign up</Link>
          </p>
          <p style={{ margin: 0, fontSize: "clamp(11px, 2.5vw, 12px)", color: "var(--muted-foreground)" }}>
            Securely managed by TASCA Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
