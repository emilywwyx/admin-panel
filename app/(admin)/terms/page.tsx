import { ResourcePage } from "@/components/resource-page";

export default function Page({ searchParams }: PageProps<"/terms">) {
  return <ResourcePage resource="terms" searchParams={searchParams} />;
}
