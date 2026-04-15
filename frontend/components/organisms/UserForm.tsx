import { Form, Input, Select, Button } from "antd";
import type { FormInstance } from "antd";

interface UserFormProps {
  form: FormInstance;
  isEditing: boolean;
  onSubmit: (values: any) => Promise<void>;
  loading: boolean;
}

export default function UserForm({ form, isEditing, onSubmit, loading }: UserFormProps) {
  return (
    <Form layout="vertical" form={form} onFinish={onSubmit} style={{ marginTop: 20 }} requiredMark={false}>
      <Form.Item name="username" label={<span className="text-muted text-small font-medium">Username</span>} rules={[{ required: true }, { min: 3 }]}>
        <Input size="large" placeholder="Enter username" />
      </Form.Item>
      {!isEditing && (
        <Form.Item name="password" label={<span className="text-muted text-small font-medium">Password</span>} rules={[{ required: true }, { min: 6 }]}>
          <Input.Password size="large" placeholder="Create a password" />
        </Form.Item>
      )}
      <Form.Item name="role" label={<span className="text-muted text-small font-medium">Access Level</span>}>
        <Select size="large" options={[{ label: "Staff Member", value: "staf" }, { label: "Administrator", value: "manager" }]} />
      </Form.Item>
      <Form.Item name="status" label={<span className="text-muted text-small font-medium">Account Status</span>}>
        <Select size="large" options={[{ label: "Approved", value: "Approved" }, { label: "Pending", value: "Pending" }, { label: "Rejected", value: "Rejected" }]} />
      </Form.Item>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
        <Button htmlType="reset" type="text">Cancel</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {isEditing ? "Save Changes" : "Create Account"}
        </Button>
      </div>
    </Form>
  );
}
