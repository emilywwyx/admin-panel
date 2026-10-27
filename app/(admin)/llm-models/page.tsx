import { ResourcePage } from "@/components/resource-page";

export default function Page({ searchParams }: PageProps<"/llm-models">) {
  return <ResourcePage resource="models" searchParams={searchParams} />;
}
