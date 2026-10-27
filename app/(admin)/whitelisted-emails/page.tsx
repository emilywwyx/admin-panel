import { ResourcePage } from "@/components/resource-page";

export default function Page({ searchParams }: PageProps<"/whitelisted-emails">) {
  return <ResourcePage resource="emails" searchParams={searchParams} />;
}
