import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PageTitle from "@/components/atoms/PageTitle";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function PageHeader({ title, subtitle, buttonText, onButtonClick }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "clamp(20px, 8vw, 40px)", gap: "clamp(12px, 4vw, 20px)" }}>
      <PageTitle title={title} subtitle={subtitle} />
      {buttonText && (
        <Button size="large" type="primary" onClick={onButtonClick} icon={<PlusOutlined />} style={{ padding: "0 clamp(16px, 4vw, 24px)", height: "clamp(32px, 8vw, 40px)", fontSize: "clamp(13px, 3vw, 14px)" }}>
          {buttonText}
        </Button>
      )}
    </div>
  );
}
