import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, Delivery } from "../api";
import ReviewModal from "../components/ReviewModal";

export default function ReviewOrder() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Delivery[]>(`/deliveries/mine`)
      .then((rows) => {
        const found = rows.find((row) => row.id === id && row.role === "buyer" && row.status === "delivered");
        if (!found) throw new Error("Reviews are available only for your delivered orders.");
        if (found.reviewed) throw new Error("You have already reviewed this order.");
        setDelivery(found);
      })
      .catch((cause) => setError((cause as Error).message));
  }, [id]);

  if (error) return <p role="alert" className="card mx-auto mt-10 max-w-md rounded-2xl p-5 text-sm text-red-700">{error}</p>;
  if (!delivery) return <p className="py-10 text-center text-sm text-ink/60">Loading order…</p>;
  return <ReviewModal
    deliveryId={delivery.id}
    productTitle={delivery.product_title ?? "Your order"}
    sellerName={delivery.vendor_name ?? "Seller"}
    onClose={() => navigate("/orders")}
    onSubmitted={() => navigate("/orders")}
  />;
}
