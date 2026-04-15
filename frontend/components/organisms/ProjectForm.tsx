import { Form, Input, Button } from "antd";
import type { FormInstance } from "antd";

interface ProjectFormProps {
  form: FormInstance;
  isEditing: boolean;
  onSubmit: (values: any) => Promise<void>;
  loading: boolean;
}

export default function ProjectForm({ form, isEditing, onSubmit, loading }: ProjectFormProps) {
  return (
    <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 20 }} requiredMark={false}>
      <Form.Item
        name="project_name"
        label={<span className="text-muted text-small font-medium">Project Name</span>}
        rules={[{ required: true, message: "Enter project name" }]}
      >
        <Input size="large" placeholder="e.g. Operation Apollo" />
      </Form.Item>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
        <Button htmlType="reset" type="text">Cancel</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {isEditing ? "Save Changes" : "Create Project"}
        </Button>
      </div>
    </Form>
  );
}
