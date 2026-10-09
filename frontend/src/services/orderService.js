import apiClient from "./apiClient.js";
import { formatCurrency } from "../utils/format.js";
import {
    fetchProductById,
    mapProduct,
} from "./productService.js";

function mapOrderItem(item) {
    const product = item?.product
        ? mapProduct(item.product)
        : null;

    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPrice || 0);

    const subtotal = Number(
        item?.subtotal ?? quantity * unitPrice,
    );

    return {
        orderItemId: item?.orderItemId ?? null,
        productId: product?.id ?? null,
        name: product?.name || "Item no longer available",
        img: product?.img || null,
        category: product?.category || null,
        quantity,
        unitPrice,
        unitPriceFormatted: formatCurrency(unitPrice),
        subtotal,
        subtotalFormatted: formatCurrency(subtotal),
        sellerName: product?.seller || null,
        sellerEmail: product?.sellerEmail || null,
    };
}

function mapOrder(order) {
    const items = Array.isArray(order?.orderItems)
        ? order.orderItems.map(mapOrderItem)
        : [];

    return {
        orderId: order?.orderId,
        orderNumber: order?.orderNumber || `Order #${order?.orderId}`,
        orderDate: order?.orderDate || null,
        status: order?.status || "PENDING_SELLER_CONFIRMATION",
        totalAmount: Number(order?.totalAmount || 0),
        totalAmountFormatted: formatCurrency(order?.totalAmount),
        paymentMethod: order?.paymentMethod || null,
        shippingAddress: order?.shippingAddress || "",
        buyerId: order?.buyer?.userId ?? order?.buyerId ?? null,
        buyerName: order?.buyer
            ? [order.buyer.firstName, order.buyer.lastName]
                .filter(Boolean)
                .join(" ")
            : null,
        buyerEmail: order?.buyer?.email || null,
        items,
        itemCount: items.reduce(
            (total, item) => total + item.quantity,
            0,
        ),
    };
}

async function getOrdersForBuyer(userId) {
    const response = await apiClient.get(
        `/orders/buyer/${userId}`,
    );

    return (Array.isArray(response.data) ? response.data : [])
        .map(mapOrder)
        .sort(
            (a, b) =>
                new Date(b.orderDate || 0) -
                new Date(a.orderDate || 0),
        );
}

async function getOrderById(orderId) {
    const response = await apiClient.get(
        `/orders/${orderId}`,
    );

    return mapOrder(response.data);
}

async function createOrder({
                               buyer,
                               items,
                               paymentMethod,
                               shippingAddress,
                           }) {
    const response = await apiClient.post(
        "/orders/create",
        {
            buyer: {
                userId: buyer.userId,
                email: buyer.email,
                firstName: buyer.firstName,
                lastName: buyer.lastName,
            },
            orderItems: items.map((item) => ({
                product: {
                    productId: item.productId,
                },
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })),
            paymentMethod,
            shippingAddress,
        },
    );

    return mapOrder(response.data);
}

async function createPaymentForOrder({
                                         orderId,
                                         buyerId,
                                         amount,
                                         method,
                                         status = "PENDING",
                                     }) {
    const response = await apiClient.post(
        "/payment/create",
        {
            amount,
            method,
            status,
            buyer: {
                userId: buyerId,
            },
            customerOrder: {
                orderId,
            },
        },
    );

    return response.data;
}

async function cancelOrder(orderId) {
    await apiClient.delete(`/orders/${orderId}`);
    return true;
}
async function getOrdersForSeller(sellerId) {
    const response = await apiClient.get(
        `/orders/seller/${sellerId}`,
    );

    return (Array.isArray(response.data) ? response.data : [])
        .map(mapOrder)
        .sort(
            (a, b) =>
                new Date(b.orderDate || 0) -
                new Date(a.orderDate || 0),
        );
}

async function respondToSellerOrder(orderId, sellerId, decision) {
    const response = await apiClient.post(
        `/orders/${orderId}/seller-decision`,
        {
            sellerId,
            decision,
        },
    );

    return mapOrder(response.data);
}

export {
    cancelOrder,
    createOrder,
    createPaymentForOrder,
    fetchProductById,
    getOrderById,
    getOrdersForBuyer,
    getOrdersForSeller,
    mapOrder,
    respondToSellerOrder,
};