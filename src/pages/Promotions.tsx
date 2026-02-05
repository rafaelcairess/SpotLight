import Header from "@/components/Header";
import PromotionsBar from "@/components/PromotionsBar";

const Promotions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-12">
        <PromotionsBar />
      </main>
    </div>
  );
};

export default Promotions;
