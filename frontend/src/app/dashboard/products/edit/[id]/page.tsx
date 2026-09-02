import { ProductForm } from "@/features/artisan/components/product-form";
import { ProductService } from "@/features/marketplace/product-service";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await ProductService.getProductById(id);
    
    if (!product) {
        notFound();
    }

    return <ProductForm product={product} />;
}
