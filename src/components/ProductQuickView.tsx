import { Card, Meta } from "../api";
import OrderModal from "./OrderModal";

export default function ProductQuickView({ product, meta, onClose }: { product: Card; meta: Meta | null; onClose: () => void }) {
  return <OrderModal product={product} meta={meta} onClose={onClose} showProductLink />;
}
