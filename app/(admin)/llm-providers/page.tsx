import { ResourcePage } from "@/components/resource-page";

export default function Page({ searchParams }: PageProps<"/llm-providers">) {
  return <ResourcePage resource="providers" searchParams={searchParams} />;
}
