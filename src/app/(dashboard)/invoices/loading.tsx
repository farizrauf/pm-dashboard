import { ListPageSkeleton } from "@/components/shared/page-skeleton";
export default function InvoicesLoading() {
  return <ListPageSkeleton statCount={4} tableRows={7} />;
}
