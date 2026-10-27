import { ResourcePage } from "@/components/resource-page";

export default function Page({ searchParams }: PageProps<"/signup-domains">) {
  return <ResourcePage resource="domains" searchParams={searchParams} />;
}
