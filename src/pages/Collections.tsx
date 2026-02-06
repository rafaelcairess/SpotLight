import { Sparkles, Orbit } from "lucide-react";
import Header from "@/components/Header";
import CategoryCard from "@/components/CategoryCard";
import SectionHeader from "@/components/SectionHeader";
import { CATEGORIES } from "@/types/game";

const Collections = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Coleções</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Explore por Categoria
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Descubra jogos incríveis organizados por gênero e estilo. Encontre
              sua próxima aventura favorita.
            </p>
          </div>

          {/* Co-op Featured */}
          <div className="mb-10">
            <SectionHeader
              title="Co-op em Destaque"
              subtitle="Jogos para jogar junto com amigos"
              icon={Sparkles}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {CATEGORIES.filter((category) => category.featured).map(
                (category, idx) => (
                  <CategoryCard key={category.id} category={category} index={idx} />
                )
              )}
            </div>
          </div>

          {/* Other Categories */}
          <SectionHeader
            title="Outras Categorias"
            subtitle="Explore mais estilos e gêneros"
            icon={Sparkles}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {CATEGORIES.filter((category) => !category.featured).map(
              (category, idx) => (
                <CategoryCard key={category.id} category={category} index={idx} />
              )
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Orbit className="w-5 h-5 text-primary" />
            <span className="font-bold text-gradient-primary">SpotLight</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Descubra os melhores jogos de PC
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Collections;

