/**
 * Página da feature promotions.
 */

import { PageContainer, PageShell } from "@/components/PageShell";
import PromotionsBar from "@/features/promotions/components/PromotionsBar";

const Promotions = () => {
  return (
    <PageShell>
      <PageContainer className="pb-12">
        <PromotionsBar />
      </PageContainer>
    </PageShell>
  );
};

export default Promotions;
