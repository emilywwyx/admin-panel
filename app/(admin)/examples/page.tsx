import { ResourcePage } from "@/components/resource-page";

export default function Page({ searchParams }: PageProps<"/examples">) {
  return <ResourcePage resource="examples" searchParams={searchParams} />;
}
